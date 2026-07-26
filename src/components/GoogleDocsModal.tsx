import React, { useState } from 'react';
import { FileText, ExternalLink, CheckCircle2, AlertCircle, RefreshCw, X, LogIn, HardDrive } from 'lucide-react';
import { Ebook } from '../types';
import { exportToGoogleDocs } from '../lib/gdocsExporter';
import { getCachedToken, signInWithGoogle } from '../lib/firebase';

interface GoogleDocsModalProps {
  ebook: Ebook;
  onClose: () => void;
}

export const GoogleDocsModal: React.FC<GoogleDocsModalProps> = ({ ebook, onClose }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{ success: boolean; url?: string; error?: string } | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleStartExport = async () => {
    let token = getCachedToken();

    if (!token) {
      setIsLoggingIn(true);
      try {
        const res = await signInWithGoogle();
        token = res?.accessToken || null;
      } catch (err: any) {
        setExportResult({ success: false, error: 'É necessário fazer login com o Google para exportar.' });
        setIsLoggingIn(false);
        return;
      } finally {
        setIsLoggingIn(false);
      }
    }

    if (!token) return;

    // Explicit confirmation dialog per Workspace Skill mandatory requirement
    const confirmMsg = `Deseja criar o documento "${ebook.metadata.title}" diretamente na sua conta do Google Docs?`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setIsExporting(true);
    setExportResult(null);

    try {
      const res = await exportToGoogleDocs(ebook, token);
      if (res.success && res.documentUrl) {
        setExportResult({ success: true, url: res.documentUrl });
      } else {
        setExportResult({ success: false, error: res.error || 'Falha ao criar arquivo no Google Docs.' });
      }
    } catch (err: any) {
      setExportResult({ success: false, error: err.message || 'Erro durante a sincronização.' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Exportar para o Google Docs</h3>
            <p className="text-xs text-slate-400">
              Gera um documento formatado com sumário, cabeçalhos, imagens e tabelas no seu Google Drive.
            </p>
          </div>
        </div>

        {/* Ebook Overview */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 mb-5">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            E-book Selecionado
          </div>
          <div className="font-bold text-sm text-slate-200 line-clamp-1">{ebook.metadata.title}</div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <span>{ebook.chapters.length} Capítulos</span>
            <span>•</span>
            <span>Sumário Integrado</span>
            <span>•</span>
            <span>Google Drive</span>
          </div>
        </div>

        {/* Export Result or Action */}
        {exportResult ? (
          <div className="space-y-4">
            {exportResult.success ? (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Documento gerado com sucesso no Google Docs!</span>
                </div>
                <p className="text-xs text-emerald-300/80">
                  Seu e-book foi exportado e salvo na sua conta do Google Drive com cabeçalhos e sumário organizados.
                </p>
                <a
                  href={exportResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Abrir no Google Docs</span>
                </a>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-rose-300">
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                  <span>Falha ao exportar</span>
                </div>
                <p className="text-xs text-rose-300/80">{exportResult.error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Ao clicar no botão abaixo, o aplicativo solicitará sua permissão para criar o documento no seu Google Docs e Google Drive.
            </p>

            <button
              onClick={handleStartExport}
              disabled={isExporting || isLoggingIn}
              className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Formatando e Criando no Google Docs...</span>
                </>
              ) : isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Conectando Conta Google...</span>
                </>
              ) : (
                <>
                  <HardDrive className="w-4 h-4 text-blue-200" />
                  <span>Confirmar e Exportar para o Google Docs</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
