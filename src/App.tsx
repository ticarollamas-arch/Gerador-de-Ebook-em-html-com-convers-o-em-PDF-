import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { PromptEditor } from './components/PromptEditor';
import { EbookPreview } from './components/EbookPreview';
import { StyleCustomizer } from './components/StyleCustomizer';
import { GoogleDocsModal } from './components/GoogleDocsModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { Ebook, EbookStyleConfig, Chapter } from './types';
import { generateStandaloneEbookHtml } from './lib/htmlGenerator';
import { getApiHeaders, getCustomApiKey } from './lib/apiKey';
import { BookOpen, Sparkles, AlertCircle } from 'lucide-react';

const DEFAULT_STYLE: EbookStyleConfig = {
  theme: 'modern',
  fontFamily: 'serif',
  headingFont: 'serif',
  fontSize: 'md',
  lineHeight: 'relaxed',
  coverLayout: 'full-bleed',
  pageSize: 'a4',
  margins: 'normal',
  showPageNumbers: true,
  headerFooterStyle: 'simple',
  accentColor: '#4f46e5',
};

export default function App() {
  const [activeView, setActiveView] = useState<'landing' | 'studio'>('landing');
  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [style, setStyle] = useState<EbookStyleConfig>(DEFAULT_STYLE);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals & Panels
  const [isStyleCustomizerOpen, setIsStyleCustomizerOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [hasCustomKey, setHasCustomKey] = useState(() => !!getCustomApiKey());
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Core Ebook Pipeline
  const handleGenerateEbook = async (options: {
    prompt: string;
    language: string;
    useSearchGrounding: boolean;
    pageTargetCount: number;
    targetAudience: string;
    title?: string;
    author?: string;
  }) => {
    setActiveView('studio');
    setIsGenerating(true);
    setErrorMsg(null);
    setGenerationProgress('Analisando prompt e desenhando estrutura do e-book HTML...');

    try {
      // 1. Generate Outline & Chapters Metadata
      const outlineRes = await fetch('/api/gemini/outline', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          prompt: options.prompt,
          title: options.title,
          author: options.author,
          language: options.language,
          useSearchGrounding: options.useSearchGrounding,
          targetAudience: options.targetAudience,
          pageTargetCount: options.pageTargetCount,
        }),
      });

      if (!outlineRes.ok) {
        const err = await outlineRes.json();
        throw new Error(err.error || 'Falha ao gerar estrutura inicial do e-book.');
      }

      const outlineData = await outlineRes.json();
      const metadata = outlineData.result;

      if (!metadata || !metadata.chapters || metadata.chapters.length === 0) {
        throw new Error('A estrutura do e-book não foi retornada corretamente.');
      }

      // 2. Generate Each Chapter Content
      const generatedChapters: Chapter[] = [];
      const total = metadata.chapters.length;

      for (let i = 0; i < total; i++) {
        const chMeta = metadata.chapters[i];
        setGenerationProgress(`Escrevendo Capítulo ${chMeta.number} de ${total}: "${chMeta.title}"...`);

        // Pacing delay to avoid rate-limiting
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 800));
        }

        let chapterContent = '';
        let attempts = 0;
        while (attempts < 3 && !chapterContent) {
          attempts++;
          try {
            const chRes = await fetch('/api/gemini/generate-chapter', {
              method: 'POST',
              headers: getApiHeaders(),
              body: JSON.stringify({
                ebookTitle: metadata.title,
                chapter: chMeta,
                language: options.language,
                useSearchGrounding: options.useSearchGrounding,
              }),
            });

            if (chRes.ok) {
              const chData = await chRes.json();
              chapterContent = chData.content || `Conteúdo do capítulo ${chMeta.title}`;
            } else {
              const errJson = await chRes.json().catch(() => ({}));
              console.warn(`Tentativa ${attempts} falhou para o capítulo ${chMeta.number}:`, errJson);
              if (attempts < 3) {
                await new Promise((resolve) => setTimeout(resolve, 2000 * attempts));
              }
            }
          } catch (err) {
            console.warn(`Erro na requisição do capítulo ${chMeta.number}:`, err);
            if (attempts < 3) {
              await new Promise((resolve) => setTimeout(resolve, 2000 * attempts));
            }
          }
        }

        if (!chapterContent) {
          chapterContent = `*O conteúdo deste capítulo poderá ser gerado novamente clicando em "Ajustar com IA".*\n\nResumo do capítulo: ${chMeta.summary}`;
        }

        generatedChapters.push({
          id: `ch-${i + 1}`,
          number: chMeta.number || i + 1,
          title: chMeta.title,
          subtitle: chMeta.subtitle,
          content: chapterContent,
        });
      }

      // 3. Compile Standalone Styled HTML document
      const fullHtml = generateStandaloneEbookHtml(
        metadata.title,
        metadata.subtitle,
        metadata.author || 'Autor Especialista',
        metadata.description,
        generatedChapters,
        style,
        options.language
      );

      // 4. Assemble Ebook object
      const newEbook: Ebook = {
        id: `ebook-${Date.now()}`,
        metadata: {
          title: metadata.title,
          subtitle: metadata.subtitle,
          author: metadata.author || 'Autor Especialista',
          description: metadata.description,
          language: options.language,
          targetAudience: options.targetAudience,
          pageTargetCount: options.pageTargetCount,
          createdAt: new Date().toISOString(),
        },
        chapters: generatedChapters,
        style,
        fullHtmlContent: fullHtml,
        sourcePrompt: options.prompt,
        useSearchGrounding: options.useSearchGrounding,
      };

      setEbook(newEbook);

    } catch (err: any) {
      console.error('Ebook Generation Error:', err);
      setErrorMsg(err.message || 'Ocorreu um erro durante a criação do e-book.');
    } finally {
      setIsGenerating(false);
      setGenerationProgress('');
    }
  };

  const handleExportPdf = async () => {
    if (!ebook) return;
    setIsExportingPdf(true);
    try {
      const fullHtml = ebook.fullHtmlContent || generateStandaloneEbookHtml(
        ebook.metadata.title,
        ebook.metadata.subtitle,
        ebook.metadata.author,
        ebook.metadata.description,
        ebook.chapters,
        style,
        ebook.metadata.language
      );
      
      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${ebook.metadata.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_ebook.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Top Header */}
      <Navbar
        onExportPdf={handleExportPdf}
        onExportDocs={() => setIsDocsModalOpen(true)}
        onOpenStyleCustomizer={() => setIsStyleCustomizerOpen(true)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        hasCustomApiKey={hasCustomKey}
        hasEbook={!!ebook}
        isExportingPdf={isExportingPdf}
        activeView={activeView}
        onSelectView={(v) => setActiveView(v)}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Error Banner */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span className="text-xs font-semibold">{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-xs font-bold px-3 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-900"
            >
              OK
            </button>
          </div>
        )}

        {/* View Switching Logic */}
        {activeView === 'landing' ? (
          <LandingPage
            onStartCreate={() => setActiveView('studio')}
            onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
            hasCustomApiKey={hasCustomKey}
          />
        ) : (
          <>
            {/* Input Prompt Section */}
            <PromptEditor
              onGenerate={handleGenerateEbook}
              onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
              hasCustomApiKey={hasCustomKey}
              isGenerating={isGenerating}
              generationProgress={generationProgress}
            />

            {/* Ebook Live Preview Studio */}
            {ebook ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-bold text-lg flex items-center gap-2 text-slate-200">
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                    Documento E-book HTML Gerado
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    {ebook.chapters.length} Capítulos • Sumário Dinâmico • {ebook.metadata.pageTargetCount || 50} Páginas Estimadas
                  </span>
                </div>

                <EbookPreview
                  ebook={ebook}
                  style={style}
                  onUpdateEbook={(updated) => setEbook(updated)}
                />
              </div>
            ) : (
              <div className="text-center py-16 px-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-300">
                  Pronto para criar seu E-book em HTML Extenso (10 a 500 páginas)
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Digite seu prompt ou selecione um volume de páginas. A inteligência artificial irá gerar o livro completo em código HTML puro, pronto para edição, download `.html` ou conversão instantânea para PDF.
                </p>
              </div>
            )}
          </>
        )}

      </main>

      {/* Modals & Sidebar Panels */}
      {isStyleCustomizerOpen && (
        <StyleCustomizer
          style={style}
          onChangeStyle={(newStyle) => {
            setStyle(newStyle);
            if (ebook) {
              const updatedHtml = generateStandaloneEbookHtml(
                ebook.metadata.title,
                ebook.metadata.subtitle,
                ebook.metadata.author,
                ebook.metadata.description,
                ebook.chapters,
                newStyle,
                ebook.metadata.language
              );
              setEbook({ ...ebook, style: newStyle, fullHtmlContent: updatedHtml });
            }
          }}
          onClose={() => setIsStyleCustomizerOpen(false)}
        />
      )}

      {isDocsModalOpen && ebook && (
        <GoogleDocsModal
          ebook={ebook}
          onClose={() => setIsDocsModalOpen(false)}
        />
      )}

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeyUpdated={() => setHasCustomKey(!!getCustomApiKey())}
      />

    </div>
  );
}

