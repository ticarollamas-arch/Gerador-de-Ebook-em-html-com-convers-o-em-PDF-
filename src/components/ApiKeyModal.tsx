import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, ExternalLink, Check, Trash2, X, Sparkles, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { getCustomApiKey, setCustomApiKey, removeCustomApiKey } from '../lib/apiKey';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onKeyUpdated }) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = getCustomApiKey();
      setSavedKey(current);
      setApiKeyInput(current);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = apiKeyInput.trim();
    if (trimmed) {
      setCustomApiKey(trimmed);
      setSavedKey(trimmed);
      setSuccessMsg('Chave de API do Gemini salva com sucesso! O aplicativo usará seu saldo pessoal.');
    } else {
      removeCustomApiKey();
      setSavedKey('');
      setSuccessMsg('Chave personalizada removida. Usando cota padrão.');
    }

    if (onKeyUpdated) onKeyUpdated();
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleRemove = () => {
    removeCustomApiKey();
    setSavedKey('');
    setApiKeyInput('');
    setSuccessMsg('Chave de API personalizada removida.');
    if (onKeyUpdated) onKeyUpdated();
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const maskedKey = savedKey
    ? `${savedKey.substring(0, 6)}...${savedKey.substring(savedKey.length - 4)}`
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-slate-100 shadow-2xl space-y-5 relative">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
              Configurar Chave API do Gemini
              {savedKey && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Ativa
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Insira sua chave própria para utilizar seu saldo de créditos e cotas exclusivas.
            </p>
          </div>
        </div>

        {/* Status Box */}
        <div className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-3 ${
          savedKey
            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
            : 'bg-slate-950/60 border-slate-800 text-slate-300'
        }`}>
          <ShieldCheck className={`w-5 h-5 shrink-0 mt-0.5 ${savedKey ? 'text-emerald-400' : 'text-slate-400'}`} />
          <div>
            {savedKey ? (
              <>
                <strong className="block text-emerald-300 mb-0.5">Sua chave pessoal está ativa! ({maskedKey})</strong>
                Todas as requisições de geração de e-book, capítulos, imagens e áudios usarão diretamente seu saldo e limites de requisição.
              </>
            ) : (
              <>
                <strong className="block text-slate-200 mb-0.5">Modo Padrão (Sem chave personalizada)</strong>
                Você está utilizando a cota compartilhada do sistema. Se encontrar limites de requisição (erro 429), insira sua própria chave de API abaixo.
              </>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Chave de API Gemini (Google AI Studio)
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Ex: AIzaSy..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Alert / Success message */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-between gap-2 pt-2">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 underline underline-offset-2"
            >
              <span>Obter chave no Google AI Studio</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <div className="flex items-center gap-2">
              {savedKey && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remover</span>
                </button>
              )}

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Chave</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
