import React from 'react';
import {
  FileText,
  ExternalLink,
  Download,
  X,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  HelpCircle,
  UploadCloud,
  FileCode
} from 'lucide-react';

interface SejdaPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadHtml?: () => void;
  hasEbook?: boolean;
}

export const SejdaPdfModal: React.FC<SejdaPdfModalProps> = ({
  isOpen,
  onClose,
  onDownloadHtml,
  hasEbook = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 text-slate-100 overflow-hidden">
        
        {/* Glow Header Background */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-emerald-500 to-teal-400" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Guia: Converter HTML para PDF no Sejda
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Aprenda a transformar seu e-book em um PDF de altíssima fidelidade usando o conversor gratuito do Sejda.
            </p>
          </div>
        </div>

        {/* Step by Step Guide */}
        <div className="space-y-3 pt-2">
          
          {/* Step 1 */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-500/40 flex-shrink-0 mt-0.5">
              1
            </div>
            <div className="text-xs space-y-1">
              <span className="font-bold text-slate-200 block">Baixe o código HTML do seu e-book</span>
              <p className="text-slate-400">
                Gere seu livro e clique no botão <span className="text-indigo-300 font-semibold">"Baixar .HTML"</span> para salvar a estrutura e os estilos no seu dispositivo.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-600/30 text-emerald-300 font-bold text-xs flex items-center justify-center border border-emerald-500/40 flex-shrink-0 mt-0.5">
              2
            </div>
            <div className="text-xs space-y-1">
              <span className="font-bold text-slate-200 block">Acesse a ferramenta do Sejda</span>
              <p className="text-slate-400">
                Clique no botão abaixo para abrir a página oficial do <span className="text-emerald-300 font-semibold">Sejda HTML para PDF</span> em uma nova aba.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-teal-600/30 text-teal-300 font-bold text-xs flex items-center justify-center border border-teal-500/40 flex-shrink-0 mt-0.5">
              3
            </div>
            <div className="text-xs space-y-1">
              <span className="font-bold text-slate-200 block">Envie o arquivo HTML e converta</span>
              <p className="text-slate-400">
                Faça o upload do seu arquivo <span className="text-slate-200 font-mono">.html</span> no Sejda, clique em <span className="text-emerald-300 font-semibold">"Converter em PDF"</span> e faça o download pronto do PDF!
              </p>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          
          {hasEbook && onDownloadHtml && (
            <button
              onClick={() => {
                onDownloadHtml();
              }}
              className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Baixar Arquivo .HTML</span>
            </button>
          )}

          <a
            href="https://www.sejda.com/pt/html-to-pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 group"
          >
            <span>Abrir Sejda (HTML para PDF)</span>
            <ExternalLink className="w-4 h-4 text-emerald-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>

        </div>

        {/* Pro Tip Footer */}
        <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-2 justify-center">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span>O Sejda preserva tipografia, estilos CSS e quebras de página do HTML.</span>
        </div>

      </div>
    </div>
  );
};
