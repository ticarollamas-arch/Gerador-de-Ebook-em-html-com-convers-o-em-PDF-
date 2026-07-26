import React from 'react';
import { Palette, Type, Layout, Sliders, Check, X } from 'lucide-react';
import { EbookStyleConfig } from '../types';

interface StyleCustomizerProps {
  style: EbookStyleConfig;
  onChangeStyle: (newStyle: EbookStyleConfig) => void;
  onClose: () => void;
}

const THEMES: { id: EbookStyleConfig['theme']; name: string; bg: string; text: string; accent: string }[] = [
  { id: 'modern', name: 'Modern Light', bg: 'bg-slate-50', text: 'text-slate-900', accent: '#4f46e5' },
  { id: 'dark', name: 'Dark Luxury', bg: 'bg-slate-950', text: 'text-slate-100', accent: '#f59e0b' },
  { id: 'classic', name: 'Editorial Serif', bg: 'bg-[#faf8f5]', text: 'text-[#1c1917]', accent: '#9f1239' },
  { id: 'minimal', name: 'Minimalist Studio', bg: 'bg-white', text: 'text-gray-900', accent: '#2563eb' },
  { id: 'parchment', name: 'Warm Parchment', bg: 'bg-[#fbf7ee]', text: 'text-[#292524]', accent: '#d97706' },
  { id: 'emerald', name: 'Emerald Science', bg: 'bg-[#f0fdf4]', text: 'text-[#064e3b]', accent: '#059669' },
];

export const StyleCustomizer: React.FC<StyleCustomizerProps> = ({
  style,
  onChangeStyle,
  onClose,
}) => {
  const update = (partial: Partial<EbookStyleConfig>) => {
    onChangeStyle({ ...style, ...partial });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 overflow-y-auto text-slate-100 shadow-2xl flex flex-col justify-between">
        
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-lg">Personalização do E-book</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Theme Selector */}
          <div className="space-y-4 mb-6">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Tema Visual & Cores
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => update({ theme: t.id })}
                  className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                    style.theme === t.id
                      ? 'border-indigo-500 bg-slate-800 ring-2 ring-indigo-500/20'
                      : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full border border-slate-700 shadow-inner"
                      style={{ backgroundColor: t.accent }}
                    />
                    <span className="text-xs font-semibold">{t.name}</span>
                  </div>
                  {style.theme === t.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div className="space-y-4 mb-6">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
              <Type className="w-4 h-4 text-purple-400" />
              Tipografia & Fontes
            </label>
            
            {/* Font Family */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'serif', name: 'Serifa (Clássica)' },
                { id: 'sans', name: 'Sem Serifa (Moderna)' },
                { id: 'mono', name: 'Mono (Técnica)' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => update({ fontFamily: f.id as any })}
                  className={`p-2.5 rounded-lg text-xs font-semibold border text-center transition ${
                    style.fontFamily === f.id
                      ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/60'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>

            {/* Font Size & Line Height */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-1">Tamanho do Texto</span>
                <div className="grid grid-cols-3 gap-1">
                  {(['sm', 'md', 'lg'] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => update({ fontSize: sz })}
                      className={`py-1 text-xs font-bold rounded-lg border uppercase transition ${
                        style.fontSize === sz
                          ? 'bg-purple-600/30 text-purple-200 border-purple-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-400 block mb-1">Espaçamento Entre Linhas</span>
                <div className="grid grid-cols-3 gap-1">
                  {(['normal', 'relaxed', 'spacious'] as const).map((lh) => (
                    <button
                      key={lh}
                      onClick={() => update({ lineHeight: lh })}
                      className={`py-1 text-[10px] font-bold rounded-lg border uppercase transition ${
                        style.lineHeight === lh
                          ? 'bg-purple-600/30 text-purple-200 border-purple-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      {lh.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Cover Layout */}
          <div className="space-y-4 mb-6">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
              <Layout className="w-4 h-4 text-emerald-400" />
              Estilo da Capa
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'full-bleed', name: 'Full Bleed (Imagem Grande)' },
                { id: 'centered', name: 'Minimalista Centralizado' },
                { id: 'split', name: 'Dividido (Arte & Texto)' },
                { id: 'framed', name: 'Moldura Arquitetônica' },
              ].map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => update({ coverLayout: layout.id as any })}
                  className={`p-2.5 rounded-lg text-xs font-semibold border text-left transition ${
                    style.coverLayout === layout.id
                      ? 'bg-emerald-600/30 text-emerald-200 border-emerald-500'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {layout.name}
                </button>
              ))}
            </div>
          </div>

          {/* Header/Footer & Page Numbers */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Exibir Número de Páginas</span>
              <button
                onClick={() => update({ showPageNumbers: !style.showPageNumbers })}
                className={`w-11 h-6 rounded-full transition relative p-0.5 ${
                  style.showPageNumbers ? 'bg-indigo-600' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    style.showPageNumbers ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

        </div>

        {/* Footer Apply Button */}
        <div className="pt-6 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
          >
            Aplicar Modificações de Estilo
          </button>
        </div>

      </div>
    </div>
  );
};
