import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Zap,
  FileText,
  Palette,
  Download,
  Share2,
  CheckCircle2,
  ArrowRight,
  Globe,
  ShieldCheck,
  Search,
  Layers,
  Feather,
  Layout,
  Sliders,
  Cpu,
  Bookmark,
  ExternalLink
} from 'lucide-react';

interface LandingPageProps {
  onStartCreate: () => void;
  onOpenApiKeyModal: () => void;
  hasCustomApiKey: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartCreate,
  onOpenApiKeyModal,
  hasCustomApiKey,
}) => {
  const [activePreviewTheme, setActivePreviewTheme] = useState<'modern' | 'classic' | 'dark' | 'emerald'>('modern');

  const sampleStyles = {
    modern: {
      bg: 'bg-white text-slate-900',
      accent: 'text-indigo-600',
      border: 'border-slate-200',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      titleFont: 'font-sans font-extrabold',
      bodyFont: 'font-sans',
      name: 'Modern Clean',
    },
    classic: {
      bg: 'bg-[#faf8f5] text-[#2c2825]',
      accent: 'text-[#8c6d3f]',
      border: 'border-[#e8e2d9]',
      badge: 'bg-[#f4efe6] text-[#6e5227] border-[#dfd5c6]',
      titleFont: 'font-serif font-bold',
      bodyFont: 'font-serif',
      name: 'Classic Serif',
    },
    dark: {
      bg: 'bg-slate-900 text-slate-100',
      accent: 'text-cyan-400',
      border: 'border-slate-800',
      badge: 'bg-cyan-950/80 text-cyan-300 border-cyan-800',
      titleFont: 'font-sans font-bold',
      bodyFont: 'font-sans',
      name: 'Cyber Dark',
    },
    emerald: {
      bg: 'bg-[#f0fdf4] text-[#064e3b]',
      accent: 'text-emerald-700',
      border: 'border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      titleFont: 'font-serif font-bold',
      bodyFont: 'font-serif',
      name: 'Editorial Emerald',
    },
  };

  const currentTheme = sampleStyles[activePreviewTheme];

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative pt-6 pb-12 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="text-center space-y-6 max-w-4xl mx-auto px-4">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Gerador Inteligente de E-books com IA Gemini</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15]">
            Transforme Ideias em{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-teal-300 bg-clip-text text-transparent">
              E-books Profissionais
            </span>{' '}
            Prontos para Publicar
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Crie livros digitais completos em HTML e PDF com capa personalizada, sumário dinâmico, paginação inteligente e exportação integrada para o Google Docs.
          </p>

          {/* Action CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onStartCreate}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-base shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 transition-all flex items-center justify-center gap-2 group"
            >
              <BookOpen className="w-5 h-5 text-indigo-200 group-hover:scale-110 transition-transform" />
              <span>Começar a Criar E-book</span>
              <ArrowRight className="w-5 h-5 text-indigo-200 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onOpenApiKeyModal}
              className={`w-full sm:w-auto px-6 py-4 rounded-xl border font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                hasCustomApiKey
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>{hasCustomApiKey ? 'Chave Gemini Ativa' : 'Configurar Chave API'}</span>
            </button>
          </div>

          {/* Highlights Row */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Exportação em PDF e HTML Puro</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Sincronização com Google Docs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Índice e Paginação Automáticos</span>
            </div>
          </div>
        </div>

        {/* Interactive Mockup Preview */}
        <div className="mt-12 max-w-5xl mx-auto px-4">
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-2 sm:p-4 shadow-2xl shadow-indigo-950/50 backdrop-blur-xl">
            
            {/* Mockup Toolbar */}
            <div className="flex items-center justify-between pb-3 px-3 border-b border-slate-800 text-xs text-slate-400 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="font-mono text-[11px] text-slate-500 ml-2">Ebook_Studio_Preview.html</span>
              </div>

              {/* Theme Picker Switcher */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 mr-1.5 px-1">Tema:</span>
                {(['modern', 'classic', 'dark', 'emerald'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setActivePreviewTheme(t)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                      activePreviewTheme === t
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {sampleStyles[t].name}
                  </button>
                ))}
              </div>
            </div>

            {/* Ebook Page Simulator */}
            <div className="p-4 sm:p-8 mt-3 rounded-xl min-h-[380px] transition-all duration-300 relative overflow-hidden" style={{ minHeight: '380px' }}>
              <div className={`p-6 sm:p-10 rounded-lg border shadow-lg transition-all ${currentTheme.bg} ${currentTheme.border}`}>
                
                {/* Header Badge */}
                <div className="flex items-center justify-between border-b pb-4 mb-6 border-current/10">
                  <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border ${currentTheme.badge}`}>
                    Capítulo 1 • Fundamentos
                  </span>
                  <span className="text-xs opacity-60 font-mono">Página 03 de 48</span>
                </div>

                {/* Chapter Title */}
                <h3 className={`text-2xl sm:text-3xl ${currentTheme.titleFont} mb-3 ${currentTheme.accent}`}>
                  A Era da Inteligência Artificial Criativa
                </h3>
                <p className="text-sm font-medium opacity-75 mb-6 italic">
                  Como os modelos de linguagem estão revolucionando a produção editorial moderna.
                </p>

                {/* Chapter Body Text */}
                <div className={`space-y-3 text-xs sm:text-sm leading-relaxed ${currentTheme.bodyFont}`}>
                  <p>
                    A criação de conteúdo passou por uma metamorfose profunda. Hoje, autores e profissionais utilizam assistentes cognitivos para estruturar sumários detalhados, refinar o tom de voz e gerar materiais educativos com rigor técnico e estética impecável.
                  </p>
                  <p className="hidden sm:block">
                    Este e-book demonstra a capacidade de combinar formatação tipográfica fluida, paginação automática para impressão e sincronização em tempo real com suítes de produtividade como o Google Docs.
                  </p>
                </div>

                {/* Footer simulation */}
                <div className="mt-8 pt-4 border-t border-current/10 flex items-center justify-between text-[11px] opacity-60 font-mono">
                  <span>Guia Definitivo de IA & Arquitetura</span>
                  <span>Ebook Studio Pro</span>
                </div>

              </div>
            </div>

          </div>
        </div>

      </section>

      {/* Feature Bento Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Recursos Projetados para Autores e Profissionais
          </h2>
          <p className="text-sm text-slate-400">
            Cada detalhe foi arquitetado para gerar livros de alto impacto com o mínimo de esforço.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-4 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">
              Geração de Livros Extensos
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Crie obras completas com meta de 10 a 500 páginas. A IA constrói o sumário, divide em capítulos coerentes e redige conteúdo profundo sem cortes abruptos.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-violet-500/40 transition-all space-y-4 group">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20 group-hover:scale-110 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">
              Exportação para Google Docs
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sincronize seu e-book diretamente com o Google Docs e Google Drive via autenticação oficial OAuth para edição colaborativa e formatação avançada.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-teal-500/40 transition-all space-y-4 group">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20 group-hover:scale-110 transition-transform">
              <Palette className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">
              Estilização & Design Editorial
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Escolha entre temas editorial clássico, moderno, minimalista e escuro. Ajuste fontes, tamanho de página (A4 / Carta), margens e cores de destaque.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-4 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">
              Search Grounding em Tempo Real
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ative a pesquisa web integrada para que a IA consulte fontes recentes, fatos atualizados, estatísticas e referências confiáveis ao escrever os capítulos.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition-all space-y-4 group">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">
              Download PDF & Conversão Sejda
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Baixe o arquivo <code className="text-indigo-300 font-mono">.html</code> autônomo com estilos CSS embutidos e converta para PDF perfeito usando o Sejda.
            </p>
            <a
              href="https://www.sejda.com/pt/html-to-pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 pt-1 border-t border-slate-800 w-full"
            >
              <span>Ir para Sejda (HTML em PDF)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-4 group">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 group-hover:scale-110 transition-transform">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">
              Suporte Multilíngue Natural
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Gere e-books fluentemente em Português (Brasil), Inglês, Espanhol, Francês, Alemão e Italiano com terminologia adaptada ao público-alvo.
            </p>
          </div>

        </div>
      </section>

      {/* How it Works Step-by-Step */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 rounded-3xl bg-slate-900/40 border border-slate-800/80">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
            Fluxo Simples & Eficiente
          </span>
          <h2 className="text-2xl font-extrabold text-white">Como Funciona em 3 Passos</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          
          {/* Step 1 */}
          <div className="space-y-3 text-center md:text-left relative">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-black text-sm flex items-center justify-center mx-auto md:mx-0 shadow-lg shadow-indigo-600/30">
              1
            </div>
            <h3 className="font-bold text-slate-200 text-sm">Defina a Ideia ou Tópico</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Digite seu prompt descrevendo o tema, selecione o idioma, o público-alvo e o número estimado de páginas desejado.
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-3 text-center md:text-left relative">
            <div className="w-10 h-10 rounded-full bg-violet-600 text-white font-black text-sm flex items-center justify-center mx-auto md:mx-0 shadow-lg shadow-violet-600/30">
              2
            </div>
            <h3 className="font-bold text-slate-200 text-sm">IA Constrói a Estrutura</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              O motor Gemini analisa a proposta, delineia o sumário e redige os capítulos com coerência narrativa e profundidade técnica.
            </p>
          </div>

          {/* Step 3 */}
          <div className="space-y-3 text-center md:text-left relative">
            <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-black text-sm flex items-center justify-center mx-auto md:mx-0 shadow-lg shadow-teal-600/30">
              3
            </div>
            <h3 className="font-bold text-slate-200 text-sm">Personalize & Exporte</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ajuste temas tipográficos, reorganize capítulos, edite o texto interativamente e faça o download em PDF ou envie ao Google Docs.
            </p>
          </div>

        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-indigo-500/5 backdrop-blur-3xl pointer-events-none" />

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight relative z-10">
            Pronto para criar seu e-book em minutos?
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed relative z-10">
            Acesse o estúdio interativo agora mesmo e veja sua ideia se transformar em um livro digital impecável.
          </p>

          <div className="pt-2 relative z-10">
            <button
              onClick={onStartCreate}
              className="px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base shadow-xl shadow-indigo-600/40 transition-all inline-flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-indigo-200" />
              <span>Abrir Estúdio de Criação</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
