import React, { useState } from 'react';
import {
  Sparkles,
  Globe,
  Search,
  FileText,
  Layers,
  RefreshCw,
  Upload,
  Zap,
  Check,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  User,
  Key,
  Type as TypeIcon
} from 'lucide-react';
import { getApiHeaders } from '../lib/apiKey';

interface PromptEditorProps {
  onGenerate: (data: {
    prompt: string;
    language: string;
    useSearchGrounding: boolean;
    pageTargetCount: number;
    targetAudience: string;
    title?: string;
    author?: string;
  }) => void;
  onOpenApiKeyModal?: () => void;
  hasCustomApiKey?: boolean;
  isGenerating: boolean;
  generationProgress?: string;
}

interface FeasibilityAnalysis {
  feasibilityRating: string;
  recommendedPages: number;
  hallucinationRisk: string;
  reasoning: string;
  growthHackInsights: string[];
  optimizedPrompt: string;
}

const PRESETS = [
  {
    title: '📘 Guia Definitivo: 20.000 Comandos de Termux',
    author: 'Autor Especialista',
    pages: 100,
    prompt: 'Crie um E-book em formato HTML exaustivo e prático sobre Termux para Linux em dispositivos móveis. Inclua comandos organizados por categoria (navegação, pacotes, redes, automação, Python e Bash), tabelas comparativas de parâmetros, exemplos em blocos de código com cópia e dicas de produtividade.',
  },
  {
    title: '📗 Tratado Completo de Arquitetura de Software',
    author: 'Engenheiro Sênior',
    pages: 250,
    prompt: 'Elabore um E-book HTML abrangente sobre Arquitetura de Microserviços, Resiliência de Sistemas e Engenharia de Dados. Inclua diagramas conceituais em tabelas HTML, padrões de projeto, exemplos de código e sumário com navegação.',
  },
  {
    title: '📕 Relatório de Tendências de Mercado & Finanças',
    author: 'Analista de Mercado',
    pages: 50,
    prompt: 'Escreva um livro em HTML analisando Tendências Macroeconômicas Globais, Criptoativos e IA Financeira. Inclua tabelas de projeções de mercado, quadros de aviso e resumos em destaque por capítulo.',
  },
  {
    title: '📙 Manual Prático de Nutrição & Longevidade',
    author: 'Dra. Nutrição Otimizada',
    pages: 30,
    prompt: 'Desenvolva um manual HTML de Nutrição Otimizada e Estilo de Vida Saudável. Aborde micronutrientes, sono, biohacking e rotinas de treino com quadros informativos e listas estilizadas.',
  },
];

export const PromptEditor: React.FC<PromptEditorProps> = ({
  onGenerate,
  onOpenApiKeyModal,
  hasCustomApiKey = false,
  isGenerating,
  generationProgress,
}) => {
  const [bookTitle, setBookTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('pt');
  const [useSearchGrounding, setUseSearchGrounding] = useState(true);
  const [pageTargetCount, setPageTargetCount] = useState<number>(50);
  const [targetAudience, setTargetAudience] = useState('Profissionais e Estudantes');

  // AI Feasibility Analyzer State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FeasibilityAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const wordCount = prompt.trim() ? prompt.trim().split(/\s+/).length : 0;
  const charCount = prompt.length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setPrompt(text);
      }
    };
    reader.readAsText(file);
  };

  const handleRunAnalysis = async () => {
    if (!prompt.trim()) return;
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await fetch('/api/gemini/analyze-feasibility', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          title: bookTitle,
          author: authorName,
          targetPages: pageTargetCount,
          prompt,
          language,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Falha ao analisar viabilidade.');
      }

      const data: FeasibilityAnalysis = await res.json();
      setAnalysisResult(data);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setAnalysisError(err.message || 'Erro ao conectar ao analisador de viabilidade.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyOptimizedPrompt = () => {
    if (!analysisResult) return;
    setPrompt(analysisResult.optimizedPrompt);
    if (analysisResult.recommendedPages) {
      setPageTargetCount(analysisResult.recommendedPages);
    }
    setAnalysisResult(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onGenerate({
      prompt,
      language,
      useSearchGrounding,
      pageTargetCount,
      targetAudience,
      title: bookTitle,
      author: authorName,
    });
  };

  const selectPreset = (preset: typeof PRESETS[0]) => {
    setBookTitle(preset.title.replace(/^[^\s]+\s+/, ''));
    setAuthorName(preset.author);
    setPageTargetCount(preset.pages);
    setPrompt(preset.prompt);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl text-slate-100 space-y-6">
      
      {/* Title Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Configuração do E-book & Gerador Inteligente
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Defina título, autor, meta de páginas e analise a estrutura para evitar alucinações de IA.
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* API Key Modal Trigger */}
          <button
            type="button"
            onClick={onOpenApiKeyModal}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
              hasCustomApiKey
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>{hasCustomApiKey ? 'Chave API Gemini (Ativa)' : 'Inserir Minha Chave API'}</span>
          </button>

          {/* Upload File Button */}
          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition">
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Carregar Rascunho (.txt/.md)</span>
            <input
              type="file"
              accept=".txt,.md,.markdown"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Title & Author Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <TypeIcon className="w-3.5 h-3.5 text-indigo-400" />
              Título do E-book (Opcional)
            </label>
            <input
              type="text"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder="Ex: Guia Definitivo: 20.000 Comandos de Termux"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <User className="w-3.5 h-3.5 text-purple-400" />
              Nome do Autor (Opcional)
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Ex: Autor Especialista"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
        
        {/* Main Textarea */}
        <div className="relative">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1.5">
            <span>Conteúdo Fonte / Prompt / Rascunho (Até 50.000 palavras):</span>
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Digite ou cole aqui o prompt ou texto base para o seu E-book (ex: 'Escreva um e-book completo em 8 capítulos sobre...')"
            rows={7}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-y font-mono leading-relaxed"
          />

          {/* Word and Char Counter Badge */}
          <div className="absolute bottom-3 right-3 flex items-center gap-3 px-3 py-1 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg text-xs font-mono text-slate-400">
            <span>{wordCount.toLocaleString()} palavras</span>
            <span className="text-slate-700">|</span>
            <span>{charCount.toLocaleString()} / 300.000 caracteres</span>
          </div>
        </div>

        {/* Growth Hack AI Feasibility Analyzer Bar */}
        <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
            <div>
              <div className="text-xs font-bold text-indigo-200">
                Growth Hack IA: Analisador de Viabilidade & Risco de Alucinação
              </div>
              <div className="text-[11px] text-slate-400">
                Verifique se o prompt possui profundidade para a meta de {pageTargetCount} páginas.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRunAnalysis}
            disabled={isAnalyzing || !prompt.trim()}
            className="px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-bold transition flex items-center gap-2 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-300" />
                <span>Avaliando Estrutura...</span>
              </>
            ) : (
              <>
                <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
                <span>Analisar Viabilidade do Prompt</span>
              </>
            )}
          </button>
        </div>

        {/* AI Analysis Result Card */}
        {analysisResult && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/40 shadow-xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm text-slate-100">Resultado da Análise de Viabilidade</span>
              </div>
              <button
                type="button"
                onClick={() => setAnalysisResult(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Fechar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Status de Viabilidade</span>
                <span className="font-bold text-indigo-300 text-sm">{analysisResult.feasibilityRating}</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Volume Recomendado</span>
                <span className="font-bold text-emerald-400 text-sm">~{analysisResult.recommendedPages} Páginas</span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Risco de Alucinação</span>
                <span className={`font-bold text-sm ${
                  analysisResult.hallucinationRisk === 'Baixo' ? 'text-emerald-400' :
                  analysisResult.hallucinationRisk === 'Médio' ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {analysisResult.hallucinationRisk}
                </span>
              </div>
            </div>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 leading-relaxed text-slate-300">
              <strong className="text-slate-100 block mb-1">Diagnóstico da Estrutura:</strong>
              {analysisResult.reasoning}
            </div>

            {analysisResult.growthHackInsights.length > 0 && (
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                <strong className="text-amber-300 flex items-center gap-1.5 mb-1">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  Insights de Growth Hacking Editorial:
                </strong>
                <ul className="list-disc pl-4 space-y-1 text-slate-300">
                  {analysisResult.growthHackInsights.map((insight, idx) => (
                    <li key={idx}>{insight}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-1 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleApplyOptimizedPrompt}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Substituir pelo Prompt Otimizado por IA</span>
              </button>
            </div>
          </div>
        )}

        {analysisError && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{analysisError}</span>
          </div>
        )}

        {/* Quick Presets */}
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Modelos de Prontos Rápido (Presets):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectPreset(preset)}
                className="text-left p-2.5 rounded-xl bg-slate-950/50 hover:bg-slate-800/80 border border-slate-800/80 text-xs text-slate-300 hover:text-white transition group"
              >
                <div className="font-semibold text-indigo-300 group-hover:text-indigo-200 mb-0.5 truncate">
                  {preset.title}
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {preset.prompt}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Configuration Options Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          
          {/* Language Selector */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              Idioma do E-book
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="pt">Português (Brasil)</option>
              <option value="en">English (US)</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="it">Italiano</option>
            </select>
          </div>

          {/* Target Page Volume Selector (15 - 500 pages) */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              Volume Desejado (Páginas HTML)
            </label>
            <select
              value={pageTargetCount}
              onChange={(e) => setPageTargetCount(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
            >
              <option value={15}>📄 ~15 Páginas (Resumo Executivo)</option>
              <option value={50}>📘 ~50 Páginas (Guia Completo)</option>
              <option value={100}>📚 ~100 Páginas (Livro Extenso)</option>
              <option value={250}>🏛️ ~250 Páginas (Manual Extenso)</option>
              <option value={500}>👑 ~500 Páginas (Tratado Abrangente)</option>
            </select>
          </div>

          {/* Search Grounding Toggle */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-amber-400" />
              Dados do Google Search
            </label>
            <button
              type="button"
              onClick={() => setUseSearchGrounding(!useSearchGrounding)}
              className={`w-full py-1.5 px-2 rounded-lg text-xs font-semibold transition border flex items-center justify-center gap-1.5 mt-1.5 ${
                useSearchGrounding
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Zap className={`w-3 h-3 ${useSearchGrounding ? 'text-amber-400' : 'text-slate-500'}`} />
              {useSearchGrounding ? 'Search Grounding Ativo' : 'Apenas Modelo IA'}
            </button>
          </div>

          {/* Target Audience */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              Público-Alvo
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="Ex: Executivos, Iniciantes"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

        </div>

        {/* Generate Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white shadow-lg shadow-indigo-900/40 border border-indigo-400/30 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{generationProgress || 'Sintetizando E-book & Gerando Sumário Inteligente...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
                <span>Gerar E-book Profissional com Sumário Dinâmico</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
