import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Edit3,
  RefreshCw,
  Check,
  Code,
  Download,
  Copy,
  Printer,
  Eye,
  FileCode,
  Bookmark,
  ExternalLink,
  FileText
} from 'lucide-react';
import { Ebook, Chapter, EbookStyleConfig } from '../types';
import { generateStandaloneEbookHtml } from '../lib/htmlGenerator';
import { getApiHeaders } from '../lib/apiKey';
import { SejdaPdfModal } from './SejdaPdfModal';

interface EbookPreviewProps {
  ebook: Ebook;
  style: EbookStyleConfig;
  onUpdateEbook: (updated: Ebook) => void;
}

// Interactive Code Block component with Copy Command Button
const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-xl text-xs font-mono">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800/80 text-slate-300">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
          </div>
          <span className="font-bold text-indigo-400 tracking-wider text-[11px] uppercase ml-2">
            {language || 'COMANDO BASH'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold transition border ${
            copied
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white border-slate-700'
          }`}
          title="Copiar comando exato para a área de transferência"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar Comando</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-slate-100 leading-relaxed font-mono whitespace-pre-wrap break-all">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export const EbookPreview: React.FC<EbookPreviewProps> = ({
  ebook,
  style,
  onUpdateEbook,
}) => {
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editInstruction, setEditInstruction] = useState('');
  const [isQuickEditing, setIsQuickEditing] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [viewMode, setViewMode] = useState<'reader' | 'code'>('reader');
  const [isSejdaModalOpen, setIsSejdaModalOpen] = useState(false);

  // Compiled Standalone HTML
  const fullHtmlContent = ebook.fullHtmlContent || generateStandaloneEbookHtml(
    ebook.metadata.title,
    ebook.metadata.subtitle,
    ebook.metadata.author,
    ebook.metadata.description,
    ebook.chapters,
    style,
    ebook.metadata.language
  );

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(fullHtmlContent);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  const handleDownloadHtmlFile = () => {
    const blob = new Blob([fullHtmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ebook.metadata.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_ebook.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPdf = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(fullHtmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  // Inline AI Refine Chapter
  const handleApplyQuickEdit = async (chapter: Chapter) => {
    if (!editInstruction.trim()) return;
    setIsQuickEditing(true);

    try {
      const res = await fetch('/api/gemini/quick-edit', {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          text: chapter.content,
          instruction: editInstruction,
        }),
      });

      if (!res.ok) throw new Error('Falha ao ajustar texto.');

      const data = await res.json();
      if (data.result) {
        const updatedChapters = ebook.chapters.map((c) =>
          c.id === chapter.id ? { ...c, content: data.result } : c
        );
        const updatedHtml = generateStandaloneEbookHtml(
          ebook.metadata.title,
          ebook.metadata.subtitle,
          ebook.metadata.author,
          ebook.metadata.description,
          updatedChapters,
          style,
          ebook.metadata.language
        );
        onUpdateEbook({ ...ebook, chapters: updatedChapters, fullHtmlContent: updatedHtml });
        setEditingChapterId(null);
        setEditInstruction('');
      }
    } catch (err) {
      console.error('Quick edit error:', err);
    } finally {
      setIsQuickEditing(false);
    }
  };

  // Helper function to render text, tables, and code blocks with Copy Buttons
  const renderFormattedChapterContent = (content: string) => {
    if (!content) return null;

    // Code block splitter regex: ```lang ... ```
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        const textChunk = content.substring(lastIndex, match.index);
        elements.push(renderTextAndTablesChunk(textChunk, `text-${lastIndex}`));
      }

      const lang = match[1] || 'bash';
      const code = match[2].trim();
      elements.push(<CodeBlock key={`code-${match.index}`} code={code} language={lang} />);

      lastIndex = codeBlockRegex.lastIndex;
    }

    if (lastIndex < content.length) {
      const textChunk = content.substring(lastIndex);
      elements.push(renderTextAndTablesChunk(textChunk, `text-${lastIndex}`));
    }

    return elements;
  };

  // Render text lines, headings, quotes, and markdown tables
  const renderTextAndTablesChunk = (chunkText: string, keyPrefix: string) => {
    const lines = chunkText.split('\n');
    const nodes: React.ReactNode[] = [];
    let inTable = false;
    let tableRows: string[][] = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Markdown Table
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true;
        if (trimmed.includes('---')) return;
        const cells = trimmed
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());
        tableRows.push(cells);
        return;
      } else if (inTable) {
        if (tableRows.length > 0) {
          const header = tableRows[0];
          const body = tableRows.slice(1);
          nodes.push(
            <div
              key={`${keyPrefix}-table-${idx}`}
              className="my-6 overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/60 shadow-md"
            >
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-800 text-indigo-300 font-bold">
                  <tr>
                    {header.map((cell, hIdx) => (
                      <th key={hIdx} className="p-3 border-b border-slate-700">
                        {cell}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-slate-200 divide-y divide-slate-800">
                  {body.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={rIdx % 2 === 0 ? 'bg-transparent' : 'bg-slate-800/30'}
                    >
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-3 font-normal">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        inTable = false;
        tableRows = [];
      }

      // Headings & Text
      if (line.startsWith('### ')) {
        nodes.push(
          <h3
            key={`${keyPrefix}-h3-${idx}`}
            className="text-lg font-bold mt-6 mb-2 text-indigo-400 break-words"
          >
            {line.replace('### ', '')}
          </h3>
        );
      } else if (line.startsWith('## ')) {
        nodes.push(
          <h2
            key={`${keyPrefix}-h2-${idx}`}
            className="text-xl font-bold mt-8 mb-3 pb-1 border-b border-slate-800 text-slate-100 break-words"
          >
            {line.replace('## ', '')}
          </h2>
        );
      } else if (line.startsWith('> ')) {
        nodes.push(
          <blockquote
            key={`${keyPrefix}-quote-${idx}`}
            className="my-4 pl-4 py-2 border-l-4 border-indigo-500 bg-indigo-950/20 italic text-slate-300 rounded-r-lg break-words"
          >
            {line.replace('> ', '')}
          </blockquote>
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        nodes.push(
          <li key={`${keyPrefix}-li-${idx}`} className="ml-6 list-disc my-1 text-slate-300 break-words">
            {line.replace(/^[-*]\s+/, '')}
          </li>
        );
      } else if (line.trim().length > 0) {
        // Parse inline backticks and links
        const formattedLine = line;
        nodes.push(
          <p key={`${keyPrefix}-p-${idx}`} className="my-3 leading-relaxed text-slate-300 break-words">
            {formattedLine}
          </p>
        );
      }
    });

    return <div key={keyPrefix}>{nodes}</div>;
  };

  // Card theme helper classes for interactive reader
  const getThemeContainerClass = () => {
    switch (style.theme) {
      case 'classic':
        return 'bg-[#faf8f5] text-[#1c1917] border-[#e7e5e4]';
      case 'parchment':
        return 'bg-[#fbf7ee] text-[#292524] border-[#e7e0d3]';
      case 'emerald':
        return 'bg-[#f0fdf4] text-[#064e3b] border-[#a7f3d0]';
      case 'minimal':
        return 'bg-white text-gray-900 border-gray-200';
      case 'dark':
      case 'modern':
      default:
        return 'bg-slate-900 text-slate-100 border-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Action & Mode Toolbar */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-4 shadow-xl text-slate-200">
        
        {/* Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('reader')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === 'reader'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Leitor Interativo (Design Pro)</span>
          </button>
          <button
            onClick={() => setViewMode('code')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === 'code'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Código HTML Puro</span>
          </button>
        </div>

        {/* Export & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Copy HTML */}
          <button
            onClick={handleCopyHtml}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
            title="Copiar código HTML gerado"
          >
            {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Code className="w-3.5 h-3.5 text-indigo-400" />}
            <span>{copiedHtml ? 'HTML Copiado!' : 'Copiar HTML'}</span>
          </button>

          {/* Download .HTML */}
          <button
            onClick={handleDownloadHtmlFile}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
            title="Baixar arquivo HTML standalone"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Baixar .HTML</span>
          </button>

          {/* Print PDF */}
          <button
            onClick={handlePrintPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
            title="Imprimir ou Salvar diretamente pelo navegador"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>

          {/* Converter para PDF via Sejda */}
          <button
            onClick={() => setIsSejdaModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition group"
            title="Tutorial e conversor oficial Sejda HTML para PDF"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-200 group-hover:scale-110 transition-transform" />
            <span>Converter PDF (Sejda)</span>
          </button>
        </div>
      </div>

      {/* Sejda Banner Tip */}
      <div className="bg-slate-900/80 border border-emerald-500/30 rounded-xl p-3.5 px-4 flex items-center justify-between gap-3 text-xs text-slate-300 flex-wrap shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <strong className="text-emerald-300 font-semibold">Como converter para PDF sem perdas?</strong> Baixe o arquivo <code className="text-indigo-300 font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">.HTML</code> e utilize a ferramenta oficial do <strong className="text-white">Sejda (HTML to PDF)</strong>.
          </div>
        </div>
        <button
          onClick={() => setIsSejdaModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[11px] transition ml-auto"
        >
          <span>Guia Passo a Passo</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Sejda PDF Modal */}
      <SejdaPdfModal
        isOpen={isSejdaModalOpen}
        onClose={() => setIsSejdaModalOpen(false)}
        onDownloadHtml={handleDownloadHtmlFile}
        hasEbook={true}
      />

      {/* Main View Display */}
      {viewMode === 'reader' ? (
        
        /* INTERACTIVE READER VIEW (DESIGN PRO) */
        <div className="w-full max-w-4xl mx-auto space-y-12">
          
          {/* BOOK CONTAINER */}
          <div
            className={`w-full rounded-3xl p-6 sm:p-12 shadow-2xl border transition-all ${getThemeContainerClass()} break-words overflow-hidden`}
          >
            {/* COVER PAGE */}
            <div className="min-h-[600px] flex flex-col justify-between border-b-2 border-indigo-500/30 pb-12 mb-12 relative">
              <div className="text-xs font-mono font-bold tracking-widest uppercase opacity-70 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-indigo-400" /> E-BOOK EDICÃO ESPECIAL
                </span>
                <span>{ebook.metadata.language.toUpperCase()}</span>
              </div>

              <div className="my-auto py-12 text-center space-y-4 max-w-2xl mx-auto">
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300">
                  {ebook.metadata.title}
                </h1>
                {ebook.metadata.subtitle && (
                  <p className="text-lg sm:text-xl font-medium opacity-80">
                    {ebook.metadata.subtitle}
                  </p>
                )}
                {ebook.metadata.author && (
                  <div className="pt-4 text-xs font-semibold uppercase tracking-widest text-indigo-400">
                    POR: {ebook.metadata.author}
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-800 text-xs text-center opacity-70 leading-relaxed max-w-xl mx-auto">
                {ebook.metadata.description}
              </div>
            </div>

            {/* TABLE OF CONTENTS (SUMÁRIO) */}
            <div className="py-8 mb-12 border-b border-slate-800">
              <div className="flex items-center gap-3 mb-6 pb-2 border-b-2 border-indigo-500">
                <BookOpen className="w-6 h-6 text-indigo-400" />
                <h2 className="text-2xl font-bold uppercase tracking-wider">Sumário do Livro</h2>
              </div>

              <div className="space-y-3">
                {ebook.chapters.map((chapter) => (
                  <a
                    key={chapter.id}
                    href={`#chapter-${chapter.id}`}
                    className="group flex items-baseline justify-between hover:text-indigo-400 transition"
                  >
                    <div className="font-semibold text-base flex items-baseline gap-2 max-w-[80%] truncate">
                      <span className="font-mono text-xs text-indigo-400">Capítulo {chapter.number}.</span>
                      <span className="group-hover:underline truncate">{chapter.title}</span>
                    </div>
                    
                    <div className="flex-1 mx-3 border-b border-dotted border-slate-700 opacity-40"></div>

                    <div className="font-mono text-xs font-bold opacity-70">
                      pág. {chapter.number * 3 + 2}
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* CHAPTERS RENDER */}
            <div className="space-y-16">
              {ebook.chapters.map((chapter, index) => (
                <div
                  key={chapter.id}
                  id={`chapter-${chapter.id}`}
                  className="pt-6 pb-12 border-b border-slate-800/80 relative"
                >
                  {/* Chapter Header */}
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                    <span className="text-xs font-mono font-bold tracking-widest uppercase text-indigo-400">
                      CAPÍTULO {chapter.number}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setEditingChapterId(editingChapterId === chapter.id ? null : chapter.id)
                        }
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Ajustar com IA</span>
                      </button>
                    </div>
                  </div>

                  {/* Chapter Title */}
                  <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 tracking-tight">
                    {chapter.title}
                  </h2>
                  {chapter.subtitle && (
                    <p className="text-base font-medium opacity-70 mb-6 italic">
                      {chapter.subtitle}
                    </p>
                  )}

                  {/* Quick AI Refine Drawer */}
                  {editingChapterId === chapter.id && (
                    <div className="my-4 p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-slate-100 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-indigo-300">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          Refinar Capítulo com Gemini
                        </span>
                        <button
                          onClick={() => setEditingChapterId(null)}
                          className="text-slate-400 hover:text-white"
                        >
                          Cancelar
                        </button>
                      </div>
                      <input
                        type="text"
                        value={editInstruction}
                        onChange={(e) => setEditInstruction(e.target.value)}
                        placeholder="Ex: 'Adicione mais detalhes técnicos', 'Inclua um exemplo prático em bash'"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => handleApplyQuickEdit(chapter)}
                        disabled={isQuickEditing || !editInstruction.trim()}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-2 disabled:opacity-50"
                      >
                        {isQuickEditing ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Ajustando Texto...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Aplicar Ajuste</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Chapter Content with Code Block Copy Buttons */}
                  <div className="prose prose-invert max-w-none break-words">
                    {renderFormattedChapterContent(chapter.content)}
                  </div>

                  {/* Running Footer Page Number */}
                  <div className="mt-12 pt-4 border-t border-slate-800 text-xs font-mono text-center opacity-50">
                    Página {chapter.number * 3 + 2} • {ebook.metadata.title}
                  </div>

                </div>
              ))}
            </div>

          </div>

        </div>

      ) : (

        /* STANDALONE CODE / IFRAME VIEW */
        <div className="w-full max-w-4xl mx-auto rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-white h-[850px] relative">
          <iframe
            srcDoc={fullHtmlContent}
            title="Live HTML E-Book Render"
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>

      )}

    </div>
  );
};
