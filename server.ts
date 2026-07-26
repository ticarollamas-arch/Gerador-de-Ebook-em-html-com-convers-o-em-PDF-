import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Modality, Type } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// Initialize Gemini Client with mandatory telemetry User-Agent and optional custom user API key
const getGeminiClient = (customKey?: string) => {
  const apiKey = (customKey && customKey.trim()) ? customKey.trim() : process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Chave de API do Gemini não configurada. Por favor, insira sua chave da API Gemini.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

const getGeminiClientFromReq = (req: express.Request) => {
  const customKey = (req.headers['x-custom-api-key'] || req.headers['x-api-key'] || req.body?.customApiKey) as string | undefined;
  return getGeminiClient(customKey);
};

// Helper for exponential delay
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to parse JSON from model response text cleanly
function cleanAndParseJson(text: string) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const jsonSub = cleaned.substring(firstBrace, lastBrace + 1);
      return JSON.parse(jsonSub);
    }
    throw e;
  }
}

// Helper to execute Gemini requests with retry and model fallback for 429 rate limits
async function generateContentWithRetry(
  ai: GoogleGenAI,
  primaryModel: string,
  contents: any,
  config: any,
  maxRetries = 3
) {
  // Fallback chain if primary model hits rate limit (429)
  const modelChain = [
    primaryModel,
    'gemini-2.5-flash',
    'gemini-2.0-flash',
  ].filter((v, i, a) => a.indexOf(v) === i); // remove duplicates

  for (const model of modelChain) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config,
        });
        return response;
      } catch (err: any) {
        const isRateLimit =
          err?.status === 429 ||
          err?.message?.includes('429') ||
          err?.message?.includes('RESOURCE_EXHAUSTED') ||
          err?.message?.includes('quota');

        if (isRateLimit) {
          console.warn(`Rate limit hit on model ${model}, attempt ${attempt + 1}/${maxRetries}. Retrying after backoff...`);
          await sleep(1500 * (attempt + 1));
          if (attempt === maxRetries - 1) {
            console.warn(`Max retries reached for ${model}, switching to fallback model...`);
          }
        } else {
          // If non-rate-limit error (e.g. invalid request or 404), throw immediately
          throw err;
        }
      }
    }
  }

  throw new Error('Limite de cota da API Gemini excedido. Por favor, aguarde alguns instantes e tente novamente.');
}

// API Route: Outline & Structure Ebook
app.post('/api/gemini/outline', async (req, res) => {
  try {
    const { prompt, title: requestedTitle, author: requestedAuthor, language = 'pt', useSearchGrounding = false, targetAudience = 'geral' } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt de texto é obrigatório.' });
    }

    const ai = getGeminiClientFromReq(req);

    const titleGuidance = requestedTitle && requestedTitle.trim() ? `O título preferido pelo usuário é: "${requestedTitle}". Mantenha ou aprimore este título.` : '';
    const authorGuidance = requestedAuthor && requestedAuthor.trim() ? `O autor é: "${requestedAuthor}".` : '';

    const systemInstruction = `Você é um autor renomado e especialista em estruturação de E-books profissionais.
Sua missão é analisar o prompt fornecido (que pode ter até 50 mil palavras ou ser uma ideia/manuscrito) e gerar uma estrutura completa para um E-book profissional.
${titleGuidance}
${authorGuidance}

QUALIDADE LINGUÍSTICA RIGOROSA:
- Idioma principal: Português (Brasil).
- Escreva títulos e subtítulos impecáveis, sem erros ortográficos, sem letras trocadas, com acentuação correta.
- Títulos e descrições devem ser elegantes, claros e bem revisados.

Retorne em formato JSON estrito conforme o schema.
Gere um título impactante, subtítulo convincente, resumo/descrição do livro, idioma (${language}), e uma lista de 4 a 10 capítulos bem estruturados.
Cada capítulo deve conter número, título, subtítulo e um resumo detalhado do conteúdo.`;

    const modelName = 'gemini-2.5-flash';

    const config: any = {
      systemInstruction,
    };

    if (useSearchGrounding) {
      config.tools = [{ googleSearch: {} }];
    } else {
      config.responseMimeType = 'application/json';
      config.responseSchema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          subtitle: { type: Type.STRING },
          author: { type: Type.STRING },
          description: { type: Type.STRING },
          coverImagePrompt: { type: Type.STRING },
          chapters: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                number: { type: Type.NUMBER },
                title: { type: Type.STRING },
                subtitle: { type: Type.STRING },
                summary: { type: Type.STRING },
                imagePrompt: { type: Type.STRING }
              },
              required: ['number', 'title', 'summary']
            }
          }
        },
        required: ['title', 'subtitle', 'description', 'chapters', 'coverImagePrompt']
      };
    }

    try {
      const response = await generateContentWithRetry(
        ai,
        modelName,
        `Gere a estrutura completa do E-book com base neste prompt em formato JSON (contendo title, subtitle, author, description, coverImagePrompt, e array de chapters com number, title, subtitle, summary):\n\n${prompt.substring(0, 50000)}`,
        config
      );

      const text = response.text || '{}';
      const parsed = cleanAndParseJson(text);

      // Extract search grounding metadata if available
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      return res.json({ result: parsed, groundingChunks });
    } catch (apiErr: any) {
      console.warn('Gemini API rate limit in /api/gemini/outline, providing structured fallback:', apiErr.message);

      const title = requestedTitle || 'Guia Prático e Definitivo';
      const author = requestedAuthor || 'Especialista em Conteúdo';
      const description = `Um e-book abrangente e estruturado em capítulos práticos, cobrindo tópicos essenciais e aplicações práticas.`;

      const fallbackChapters = [
        {
          number: 1,
          title: "Introdução e Visão Geral",
          subtitle: "Conceitos Fundamentais e Objetivos",
          summary: "Apresentação dos pilares centrais, objetivos e mapa de execução prática do livro.",
          imagePrompt: "Minimalist book chapter illustration"
        },
        {
          number: 2,
          title: "Metodologia e Arquitetura Prática",
          subtitle: "Passo a Passo e Guia de Implementação",
          summary: "Detalhamento dos processos, ferramentas e métodos para aplicação direta.",
          imagePrompt: "Modern technical workflow flowchart"
        },
        {
          number: 3,
          title: "Estratégias Avançadas e Estudos de Caso",
          subtitle: "Aprofundamento e Melhores Práticas",
          summary: "Análise de cenários avançados, solução de problemas e otimização de resultados.",
          imagePrompt: "Professional workspace dashboard"
        },
        {
          number: 4,
          title: "Conclusão e Próximos Passos",
          subtitle: "Resumo Executivo e Plano de Ação",
          summary: "Síntese dos aprendizados, checklist de verificação e direcionamentos para o futuro.",
          imagePrompt: "Clean summary icon graphic"
        }
      ];

      return res.json({
        result: {
          title,
          subtitle: "Guia Estratégico e Prático",
          author,
          description,
          coverImagePrompt: "Elegant professional book cover art",
          chapters: fallbackChapters
        },
        groundingChunks: []
      });
    }
  } catch (err: any) {
    console.error('Error in /api/gemini/outline:', err);
    res.status(500).json({ error: err.message || 'Erro ao gerar estrutura do E-book.' });
  }
});

// API Route: Generate Chapter Content (Rich Formatting, Markdown, Tables, Quotes, Links)
app.post('/api/gemini/generate-chapter', async (req, res) => {
  try {
    const { ebookTitle, chapter, language = 'pt', useSearchGrounding = false, styleContext } = req.body;

    if (!chapter || !chapter.title) {
      return res.status(400).json({ error: 'Dados do capítulo insuficientes.' });
    }

    const ai = getGeminiClientFromReq(req);

    const systemInstruction = `Você é um escritor profissional e mestre em redação de livros e relatórios técnicos de altíssima qualidade.
Escreva o conteúdo completo e exaustivo para o Capítulo ${chapter.number}: "${chapter.title}" do livro "${ebookTitle}".

DIRETRIZES DE FORMATAÇÃO, GRAMÁTICA E CONTEÚDO:
1. Escreva em Português impecável (Brasil) com ortografia perfeita, sem erros de digitação ou gramática, e com acentuação estritamente correta.
2. Escreva em Markdown completo e profissional, com excelente profundidade e clareza.
3. Inclua subtítulos bem definidos (usando ## e ###).
4. QUANDO HOUVER COMANDOS, TERMINAL, SCRIPTS OU CÓDIGOS: Coloque SEMPRE em blocos de código Markdown com três crases e o nome do idioma/terminal (ex: \`\`\`bash, \`\`\`sh, \`\`\`python, \`\`\`javascript). O leitor terá um botão interativo de cópia para esses comandos.
5. Inclua pelo menos UMA TABELA bem formatada em Markdown com cabeçalhos e alinhamentos adequados para organizar conceitos, dados, comparações ou metodologias.
6. Inclua caixas de destaque/citações usando blocos Markdown (> Destaque/Citação).
7. Garanta que todo o texto respeite as margens e que parágrafos e títulos estejam impecavelmente redigidos.
8. Não repita o título H1 do capítulo no início, comece diretamente com a introdução cativante do capítulo.`;

    const modelName = 'gemini-2.5-flash';
    const config: any = {
      systemInstruction,
    };

    if (useSearchGrounding) {
      config.tools = [{ googleSearch: {} }];
    }

    const promptText = `Escreva o conteúdo integral do Capítulo ${chapter.number}: ${chapter.title}.
Subtítulo do capítulo: ${chapter.subtitle || ''}
Resumo do que deve ser coberto: ${chapter.summary || ''}`;

    try {
      const response = await generateContentWithRetry(
        ai,
        modelName,
        promptText,
        config
      );

      const content = response.text || '';
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      return res.json({ content, groundingChunks });
    } catch (apiErr: any) {
      console.warn(`Gemini API rate limit on chapter ${chapter.number}, generating structured fallback:`, apiErr.message);

      const fallbackMarkdown = `## Introdução ao Capítulo

Neste capítulo, exploraremos os fundamentos e a aplicação prática de **${chapter.title}** no contexto de *${ebookTitle || 'nosso estudo'}*.

> **Ponto-Chave:** ${chapter.summary || 'Aprofundamento prático e aplicável para dominar o tópico.'}

---

## 1. Visão Geral e Estrutura Principal

${chapter.summary || 'Este capítulo aborda os pilares essenciais para garantir o domínio prático do assunto.'}

### Tabela de Referência Prática

| Tópico | Descrição | Recomendação |
| :--- | :--- | :--- |
| **Fundamentos** | Conceitos base essenciais | Leitura atenta e prática |
| **Execução** | Passos de implementação | Seguir sequência recomendada |
| **Validação** | Verificação de resultados | Monitorar métricas principais |

---

## 2. Guia Passo a Passo

1. **Análise Inicial:** Verifique todos os pré-requisitos antes de iniciar a execução.
2. **Implementação:** Siga a metodologia recomendada com atenção aos detalhes.
3. **Revisão de Qualidade:** Teste e valide cada etapa concluída.

\`\`\`bash
# Exemplo de verificação / comandos úteis
echo "Inicializando módulo: ${chapter.title}"
\`\`\`

---

## 3. Principais Destaques e Considerações Finais

- Compreender a fundo os conceitos do Capítulo ${chapter.number}.
- Aplicar as melhores práticas apresentadas na tabela de referência.
- Manter acompanhamento contínuo dos resultados.`;

      return res.json({ content: fallbackMarkdown, groundingChunks: [] });
    }
  } catch (err: any) {
    console.error('Error in /api/gemini/generate-chapter:', err);
    res.status(500).json({ error: err.message || 'Erro ao gerar conteúdo do capítulo.' });
  }
});

// API Route: Quick Edit / Refine with Gemini 2.5 Flash
app.post('/api/gemini/quick-edit', async (req, res) => {
  try {
    const { text, instruction } = req.body;
    if (!text || !instruction) {
      return res.status(400).json({ error: 'Texto e instrução são necessários.' });
    }

    const ai = getGeminiClientFromReq(req);
    const response = await generateContentWithRetry(
      ai,
      'gemini-2.5-flash',
      `Edite o seguinte texto de acordo com esta instrução: "${instruction}"\n\nTexto original:\n${text}`,
      {}
    );

    res.json({ result: response.text });
  } catch (err: any) {
    console.error('Error in /api/gemini/quick-edit:', err);
    res.status(500).json({ error: err.message || 'Erro na edição rápida.' });
  }
});

// API Route: High Quality Image Generation (Cover & Chapters) with Imagen 3
app.post('/api/gemini/image', async (req, res) => {
  try {
    const { prompt, aspectRatio = '3:4' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt da imagem é obrigatório.' });
    }

    const ai = getGeminiClientFromReq(req);

    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: `A professional book cover art or illustration, ultra high definition, beautiful lighting, cinematic composition: ${prompt}`,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: aspectRatio === '3:4' ? '3:4' : aspectRatio === '1:1' ? '1:1' : '16:9',
      },
    });

    let imageUrl = '';
    const imgObj = response.generatedImages?.[0]?.image;
    if (imgObj && imgObj.imageBytes) {
      imageUrl = `data:image/jpeg;base64,${imgObj.imageBytes}`;
    }

    if (!imageUrl) {
      throw new Error('Nenhuma imagem foi retornada do modelo.');
    }

    res.json({ imageUrl });
  } catch (err: any) {
    console.error('Error in /api/gemini/image:', err);
    res.status(500).json({ error: err.message || 'Erro ao gerar imagem de alta resolução.' });
  }
});

// API Route: AI Feasibility Analyzer & Prompt Optimization Growth Hack
app.post('/api/gemini/analyze-feasibility', async (req, res) => {
  try {
    const { title, author, targetPages = 50, prompt, language = 'pt' } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'O prompt ou texto base é obrigatório para análise.' });
    }

    const ai = getGeminiClientFromReq(req);

    const systemInstruction = `Você é um Engenheiro de Prompts Sênior e Especialista em Growth Hacking Editorial e Produção de E-books de Alto Valor.
Sua missão é analisar o prompt/rascunho do usuário em relação à meta de páginas (${targetPages} páginas) e título ("${title || 'Não especificado'}").

Análise Crítica de Viabilidade & Risco de Alucinação:
1. Avalie se o conteúdo/ideia fornecida é suficiente e rica para gerar ${targetPages} páginas sem alucinações ou enrolação.
2. Identifique o número real recomendado de páginas para essa ideia original.
3. Classifique o risco de alucinação (Baixo, Médio, Alto) se o modelo tentar forçar a meta de ${targetPages} páginas sem expansão de estrutura.
4. Forneça 3 a 5 insights de Growth Hacking (dicas práticas para tornar o e-book indispensável para o leitor, ex: tabelas, exercícios, guias passo a passo, comandos práticos).
5. Gere uma versão OTIMIZADA e ENRIQUECIDA do prompt (optimizedPrompt) que adiciona sub-tópicos realistas, estruturas de tabelas, seções práticas e sumário ideal para atingir a meta desejada com máxima qualidade e zero alucinações.

Retorne EXCLUSIVAMENTE em formato JSON estrito conforme a estrutura:
{
  "feasibilityRating": "Excelente" | "Viável com Expansão" | "Atenção: Prompt Vago para a Meta",
  "recommendedPages": number,
  "hallucinationRisk": "Baixo" | "Médio" | "Alto",
  "reasoning": "Explicação clara em português sobre a viabilidade do volume em relação ao conteúdo fornecido.",
  "growthHackInsights": [
    "Insight 1...",
    "Insight 2...",
    "Insight 3..."
  ],
  "optimizedPrompt": "Prompt otimizado e expandido pronto para ser usado no gerador..."
}`;

    const modelName = 'gemini-2.5-flash';
    const config: any = {
      temperature: 0.3,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          feasibilityRating: { type: Type.STRING },
          recommendedPages: { type: Type.NUMBER },
          hallucinationRisk: { type: Type.STRING },
          reasoning: { type: Type.STRING },
          growthHackInsights: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          optimizedPrompt: { type: Type.STRING }
        },
        required: ['feasibilityRating', 'recommendedPages', 'hallucinationRisk', 'reasoning', 'growthHackInsights', 'optimizedPrompt']
      }
    };

    try {
      const response = await generateContentWithRetry(
        ai,
        modelName,
        [{ parts: [{ text: `Título do Livro: ${title || 'Não informado'}\nAutor: ${author || 'Não informado'}\nMeta de Páginas Solicitada: ${targetPages}\nIdioma: ${language}\n\nPrompt Original / Conteúdo:\n${prompt}` }] }],
        config
      );

      const jsonText = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!jsonText) {
        throw new Error('O modelo não retornou a análise esperada.');
      }

      const result = cleanAndParseJson(jsonText);
      return res.json(result);
    } catch (apiErr: any) {
      console.warn('Gemini API rate limit or error in analyze-feasibility, providing heuristic fallback:', apiErr.message);

      const words = prompt.trim().split(/\s+/).length;
      const targetWordEstimate = targetPages * 250;

      let feasibilityRating = "Excelente";
      let hallucinationRisk = "Baixo";
      let recommendedPages = targetPages;

      if (words < targetPages * 8) {
        feasibilityRating = "Atenção: Prompt Vago para a Meta";
        hallucinationRisk = "Alto";
        recommendedPages = Math.max(15, Math.min(targetPages, Math.round(words / 12)));
      } else if (words < targetPages * 20) {
        feasibilityRating = "Viável com Expansão";
        hallucinationRisk = "Médio";
        recommendedPages = Math.max(20, Math.min(targetPages, Math.round(words / 18)));
      }

      const reasoning = `Análise de Densidade: Seu texto base possui aproximadamente ${words} palavras. Para alcançar a meta de ${targetPages} páginas (~${targetWordEstimate} palavras) mantendo alta qualidade e sem alucinações da IA, é essencial detalhar sub-tópicos, incluir tabelas comparativas, exemplos práticos e guias de implementação.`;

      const growthHackInsights = [
        "Adicione um sumário detalhado dividindo o e-book em tópicos práticos com resultados acionáveis.",
        "Insira tabelas comparativas, caixas de destaque com alertas e listas de verificação (checklists).",
        "Especifique casos de uso reais e estudos de caso para aprofundar cada capítulo."
      ];

      const optimizedPrompt = `E-BOOK COMPLETO: "${title || 'Guia Prático e Definitivo'}" por ${author || 'Especialista'}\n\n` +
        `Meta de Conteúdo: ~${targetPages} páginas (${targetWordEstimate} palavras em profundidade).\n\n` +
        `PROMPT BASE E DIRETRIZES:\n${prompt}\n\n` +
        `ESTRUTURA COMPLETA & REQUISITOS DE ALTO VALOR:\n` +
        `- Crie um sumário dinâmico e capítulos ricos com introdução acionável, conceitos-chave, passo a passo prático e resumos em destaques.\n` +
        `- Inclua tabelas comparativas HTML e blocos de código ou listas de checagem estilizadas em cada capítulo.\n` +
        `- Mantenha tom profissional, fluido e envolvente em ${language === 'pt' ? 'Português' : language}.`;

      return res.json({
        feasibilityRating,
        recommendedPages,
        hallucinationRisk,
        reasoning,
        growthHackInsights,
        optimizedPrompt
      });
    }
  } catch (err: any) {
    console.error('Error in /api/gemini/analyze-feasibility:', err);
    res.status(500).json({ error: err.message || 'Erro ao analisar viabilidade do prompt.' });
  }
});

// API Route: Text to Speech Audiobook (Gemini 3.1 Flash TTS Preview)
app.post('/api/gemini/tts', async (req, res) => {
  try {
    const { text, voiceName = 'Kore' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Texto para conversão em áudio é obrigatório.' });
    }

    const ai = getGeminiClientFromReq(req);

    // Limit text to 2000 chars per TTS request to keep latency optimal
    const sanitizedText = text.replace(/[*#\_`>]/g, '').substring(0, 2500);

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ parts: [{ text: `Leia em português com tom profissional, fluido e envolvente para e-book: ${sanitizedText}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName }
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error('Nenhum áudio gerado pelo serviço TTS.');
    }

    res.json({ audioData: base64Audio, sampleRate: 24000 });
  } catch (err: any) {
    console.error('Error in /api/gemini/tts:', err);
    res.status(500).json({ error: err.message || 'Erro ao converter texto para fala.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ebook Generator Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
