export interface Chapter {
  id: string;
  number: number;
  title: string;
  subtitle?: string;
  content: string; // HTML / Markdown text
  audioUrl?: string; // TTS audio data URL
}

export interface TableOfContentsItem {
  id: string;
  title: string;
  level: 1 | 2;
  pageNumber?: number;
}

export interface EbookMetadata {
  title: string;
  subtitle: string;
  author: string;
  description: string;
  language: string;
  targetAudience?: string;
  pageTargetCount?: number; // e.g. 10, 50, 100, 250, 500 pages
  estimatedWordCount?: number;
  createdAt: string;
}

export interface EbookStyleConfig {
  theme: 'modern' | 'dark' | 'classic' | 'minimal' | 'parchment' | 'emerald';
  fontFamily: 'sans' | 'serif' | 'mono';
  headingFont: 'sans' | 'serif' | 'display';
  fontSize: 'sm' | 'md' | 'lg';
  lineHeight: 'normal' | 'relaxed' | 'spacious';
  coverLayout: 'full-bleed' | 'centered' | 'split' | 'framed' | 'classic-editorial';
  pageSize: 'a4' | 'letter';
  margins: 'narrow' | 'normal' | 'wide';
  showPageNumbers: boolean;
  headerFooterStyle: 'simple' | 'accent' | 'minimal' | 'none';
  accentColor: string;
}

export interface Ebook {
  id: string;
  metadata: EbookMetadata;
  chapters: Chapter[];
  style: EbookStyleConfig;
  fullHtmlContent: string; // Pure standalone styled HTML string ready for browser/PDF conversion
  sourcePrompt?: string;
  useSearchGrounding?: boolean;
}

