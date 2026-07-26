import React, { useState, useEffect } from 'react';
import { BookOpen, Download, FileText, Palette, Sparkles, LogIn, LogOut, Key, CheckCircle2, ExternalLink } from 'lucide-react';
import { User } from 'firebase/auth';
import { initAuth, signInWithGoogle, logoutUser } from '../lib/firebase';

interface NavbarProps {
  onExportPdf: () => void;
  onExportDocs: () => void;
  onOpenStyleCustomizer: () => void;
  onOpenApiKeyModal: () => void;
  hasCustomApiKey?: boolean;
  hasEbook: boolean;
  isExportingPdf: boolean;
  activeView: 'landing' | 'studio';
  onSelectView: (view: 'landing' | 'studio') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onExportPdf,
  onExportDocs,
  onOpenStyleCustomizer,
  onOpenApiKeyModal,
  hasCustomApiKey = false,
  hasEbook,
  isExportingPdf,
  activeView,
  onSelectView,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (u) => setUser(u),
      () => setUser(null)
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await signInWithGoogle();
      if (res?.user) {
        setUser(res.user);
      }
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onSelectView('landing')}
            className="flex items-center gap-3 text-left focus:outline-none group"
          >
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Ebook Studio Pro
              </h1>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Gerador de E-books HTML & PDF Profissional
              </p>
            </div>
          </button>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1 ml-4 pl-4 border-l border-slate-800 text-xs font-semibold">
            <button
              onClick={() => onSelectView('landing')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeView === 'landing'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Apresentação
            </button>
            <button
              onClick={() => onSelectView('studio')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeView === 'studio'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>Gerador de E-book</span>
            </button>

            <a
              href="https://www.sejda.com/pt/html-to-pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-700/60 transition flex items-center gap-1.5 font-bold"
              title="Acessar o conversor oficial do Sejda (HTML para PDF)"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Converter PDF (Sejda)</span>
              <ExternalLink className="w-3 h-3 text-emerald-400 opacity-80" />
            </a>
          </nav>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {hasEbook && (
            <>
              {/* Style Customizer */}
              <button
                onClick={onOpenStyleCustomizer}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                title="Personalizar layout e tipografia"
              >
                <Palette className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden md:inline">Estilo & Design</span>
              </button>

              {/* Google Docs Export */}
              <button
                onClick={onExportDocs}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition"
                title="Exportar para o Google Docs e Google Drive"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden lg:inline">Google Docs</span>
              </button>

              {/* Download .HTML / PDF */}
              <button
                onClick={onExportPdf}
                disabled={isExportingPdf}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-md shadow-emerald-900/30 transition disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Salvar PDF / .HTML</span>
              </button>
            </>
          )}

          {/* API Key Config Button */}
          <button
            onClick={onOpenApiKeyModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              hasCustomApiKey
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Inserir ou gerenciar sua chave de API do Gemini (Saldo Pessoal)"
          >
            <Key className={`w-3.5 h-3.5 ${hasCustomApiKey ? 'text-amber-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">
              {hasCustomApiKey ? 'Chave API (Ativa)' : 'Inserir Chave API'}
            </span>
          </button>

          {/* User Auth Button */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <img
                src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName || 'User'}`}
                alt={user.displayName || 'User'}
                className="w-7 h-7 rounded-full border border-slate-700"
                referrerPolicy="no-referrer"
              />
              <span className="text-xs font-medium text-slate-300 hidden xl:inline max-w-[100px] truncate">
                {user.displayName?.split(' ')[0]}
              </span>
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                title="Sair da conta Google"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Conectar Google</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
