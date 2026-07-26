import { Ebook, EbookStyleConfig, Chapter } from '../types';

export function generateStandaloneEbookHtml(
  title: string,
  subtitle: string,
  author: string,
  description: string,
  chapters: Chapter[],
  style?: EbookStyleConfig,
  language: string = 'pt'
): string {

  // Convert markdown/text to formatted HTML inside chapters adhering strictly to Cybersecurity design theme
  function formatChapterHtml(content: string): string {
    if (!content) return '';

    let processed = content;

    // Handle code blocks (```lang ... ```)
    const codeBlockRegex = /```([a-zA-Z0-9_+\-#]*)\n([\s\S]*?)```/g;
    processed = processed.replace(codeBlockRegex, (_, lang, codeText) => {
      const cleanLang = (lang || 'PYTHON3').toUpperCase();
      const escapedCode = codeText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .trim();

      return `___CODEBLOCK_START___
<div class="code-block-container">
  <div class="code-block-header">
    <span class="code-block-lang">${cleanLang}</span>
    <button type="button" class="code-copy-btn" onclick="copyCode(this)">📋 Copiar</button>
  </div>
  <pre><code>${escapedCode}</code></pre>
</div>
___CODEBLOCK_END___`;
    });

    const rawLines = processed.split('\n');
    let html = '';
    let inList = false;
    let inTable = false;
    let tableRows: string[][] = [];
    let inCodeBlock = false;

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const trimmed = line.trim();

      if (trimmed === '___CODEBLOCK_START___') {
        if (inList) { html += '</ul>'; inList = false; }
        if (inTable) { html += flushTable(tableRows); inTable = false; tableRows = []; }
        inCodeBlock = true;
        continue;
      }
      if (trimmed === '___CODEBLOCK_END___') {
        inCodeBlock = false;
        continue;
      }

      if (inCodeBlock) {
        html += line + '\n';
        continue;
      }

      // Tables (| Col 1 | Col 2 |)
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        if (inList) { html += '</ul>'; inList = false; }
        inTable = true;
        if (trimmed.includes('---')) continue; // Skip separator line
        const cells = trimmed
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());
        tableRows.push(cells);
        continue;
      } else if (inTable) {
        html += flushTable(tableRows);
        inTable = false;
        tableRows = [];
      }

      // Headings
      if (trimmed.startsWith('### ')) {
        if (inList) { html += '</ul>'; inList = false; }
        const h3Text = formatInline(trimmed.replace('### ', ''));
        html += `<h3>${h3Text}</h3>`;
      } else if (trimmed.startsWith('## ')) {
        if (inList) { html += '</ul>'; inList = false; }
        const h2Text = formatInline(trimmed.replace('## ', ''));
        html += `<h2>${h2Text}</h2>`;
      } else if (trimmed.startsWith('# ')) {
        if (inList) { html += '</ul>'; inList = false; }
        const h2Text = formatInline(trimmed.replace('# ', ''));
        html += `<h2>${h2Text}</h2>`;
      } else if (trimmed.startsWith('> ')) {
        if (inList) { html += '</ul>'; inList = false; }
        const bqText = formatInline(trimmed.replace('> ', ''));
        html += `<blockquote>${bqText}</blockquote>`;
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (!inList) { html += '<ul class="styled-list">'; inList = true; }
        const liText = formatInline(trimmed.replace(/^[-*]\s+/, ''));
        html += `<li>${liText}</li>`;
      } else if (trimmed.length > 0) {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<p>${formatInline(trimmed)}</p>`;
      }
    }

    if (inList) html += '</ul>';
    if (inTable) html += flushTable(tableRows);

    return html;
  }

  function flushTable(tableRows: string[][]): string {
    if (tableRows.length === 0) return '';
    const header = tableRows[0];
    const body = tableRows.slice(1);
    let tHtml = `<div class="table-container"><table><thead><tr>`;
    header.forEach((h) => (tHtml += `<th>${formatInline(h)}</th>`));
    tHtml += `</tr></thead><tbody>`;
    body.forEach((row) => {
      tHtml += `<tr>`;
      row.forEach((cell) => (tHtml += `<td>${formatInline(cell)}</td>`));
      tHtml += `</tr>`;
    });
    tHtml += `</tbody></table></div>`;
    return tHtml;
  }

  function formatInline(text: string): string {
    let formatted = text;
    formatted = formatted.replace(/`([^`]+)`/g, '<span class="inline-code">$1</span>');
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    formatted = formatted.replace(
      /\[(.*?)\]\((https?:\/\/.*?)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>'
    );
    return formatted;
  }

  // Table of Contents HTML
  const tocHtml = chapters
    .map(
      (ch, idx) => `
      <div class="toc-item">
        <a href="#chapter-${ch.id}" class="toc-link">
          <span class="toc-number">Capítulo ${ch.number || idx + 1}</span>
          <span class="toc-title">${ch.title}</span>
          <span class="toc-page">pág. ${(idx + 1) * 4 + 1}</span>
        </a>
      </div>
    `
    )
    .join('\n');

  // Generate HTML chapters string
  const chaptersHtml = chapters
    .map((ch, idx) => {
      const chapterNum = ch.number || idx + 1;
      return `
      <section class="ebook-chapter" id="chapter-${ch.id}">
        <div class="chapter-header">
          <span class="chapter-number">CAPÍTULO ${chapterNum}</span>
          <h2 class="chapter-title">${ch.title}</h2>
          ${ch.subtitle ? `<p class="chapter-subtitle">${ch.subtitle}</p>` : ''}
        </div>
        <div class="chapter-body">
          ${formatChapterHtml(ch.content)}
        </div>
        <footer class="chapter-footer">
          <span>Página ${chapterNum * 4 + 1}</span>
          <span>${title} • Cybersecurity Research</span>
        </footer>
      </section>
      `;
    })
    .join('\n');

  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} – E-book de Cybersegurança</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-deep: #06060e;
            --bg-primary: #0a0c18;
            --bg-card: #0d1022;
            --bg-card-hover: #111530;
            --bg-code: #050610;
            --border: #1a1d3a;
            --border-light: #252850;
            --text-primary: #e2e4f0;
            --text-secondary: #a0a5c0;
            --text-muted: #6b7094;
            --accent: #4f6ef7;
            --accent-glow: rgba(79, 110, 247, 0.25);
            --accent-2: #22d3ee;
            --accent-3: #818cf8;
            --danger: #f87171;
            --success: #34d399;
            --warning: #fbbf24;
            --gradient-hero: linear-gradient(135deg, #0d1022 0%, #0a0f1f 40%, #060b1a 100%);
            --gradient-accent: linear-gradient(135deg, #4f6ef7, #6366f1, #818cf8);
            --shadow-lg: 0 25px 60px rgba(0, 0, 0, 0.5);
            --shadow-card: 0 4px 20px rgba(0, 0, 0, 0.3);
            --radius-sm: 8px;
            --radius-md: 14px;
            --radius-lg: 20px;
            --radius-xl: 28px;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background: var(--bg-deep);
            color: var(--text-primary);
            font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
            font-size: 15.5px;
            line-height: 1.78;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            background-image:
                radial-gradient(ellipse at 20% 20%, rgba(79, 110, 247, 0.04) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 60%, rgba(34, 211, 238, 0.03) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 90%, rgba(99, 102, 241, 0.04) 0%, transparent 50%);
            background-attachment: fixed;
        }

        .ebook-container {
            max-width: 880px;
            margin: 30px auto 60px;
            background: var(--bg-primary);
            border: 1px solid var(--border);
            border-radius: var(--radius-xl);
            box-shadow: var(--shadow-lg);
            padding: 50px 70px;
            word-break: break-word;
            overflow-wrap: break-word;
            position: relative;
        }

        .ebook-container::before {
            content: '';
            position: absolute;
            top: -1px;
            left: -1px;
            right: -1px;
            bottom: -1px;
            border-radius: var(--radius-xl);
            background: linear-gradient(135deg, rgba(79, 110, 247, 0.2), transparent 40%, transparent 60%, rgba(34, 211, 238, 0.15));
            z-index: -1;
            pointer-events: none;
        }

        /* Cover */
        .ebook-cover {
            min-height: 780px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            border-bottom: 2px solid var(--border-light);
            padding-bottom: 50px;
            margin-bottom: 50px;
            page-break-after: always;
            position: relative;
        }

        .cover-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 2.5px;
            color: var(--accent-2);
            background: rgba(34, 211, 238, 0.08);
            border: 1px solid rgba(34, 211, 238, 0.2);
            padding: 8px 18px;
            border-radius: 50px;
            width: fit-content;
            margin-bottom: 30px;
        }

        .cover-badge .dot {
            width: 7px;
            height: 7px;
            background: var(--accent-2);
            border-radius: 50%;
            animation: pulse-dot 2s infinite;
        }

        @keyframes pulse-dot {
            0%,
            100% {
                box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.7);
            }
            50% {
                box-shadow: 0 0 0 10px rgba(34, 211, 238, 0);
            }
        }

        .cover-main {
            text-align: center;
            margin: auto 0;
            padding: 30px 0;
        }

        .cover-icon {
            font-size: 56px;
            margin-bottom: 20px;
            display: block;
            filter: drop-shadow(0 8px 24px rgba(79, 110, 247, 0.4));
        }

        .cover-title {
            font-family: 'Space Grotesk', 'Inter', sans-serif;
            font-size: 38px;
            font-weight: 800;
            line-height: 1.18;
            color: #ffffff;
            margin-bottom: 16px;
            letter-spacing: -0.8px;
            background: var(--gradient-accent);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .cover-subtitle {
            font-size: 17px;
            font-weight: 500;
            color: var(--text-secondary);
            max-width: 560px;
            margin: 0 auto 28px auto;
            letter-spacing: 0.2px;
        }

        .cover-author {
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: var(--accent-3);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .cover-author::before,
        .cover-author::after {
            content: '';
            width: 30px;
            height: 1px;
            background: var(--border-light);
        }

        .cover-footer {
            text-align: center;
            font-size: 12px;
            color: var(--text-muted);
            border-top: 1px solid var(--border);
            padding-top: 22px;
            letter-spacing: 0.5px;
        }

        /* TOC */
        .ebook-toc {
            page-break-after: always;
            padding-bottom: 50px;
            margin-bottom: 50px;
            border-bottom: 1px solid var(--border);
        }

        .toc-header {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 26px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #ffffff;
            border-bottom: 2px solid var(--accent);
            padding-bottom: 14px;
            margin-bottom: 32px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .toc-header::before {
            content: '📑';
            font-size: 22px;
        }

        .toc-item {
            margin-bottom: 10px;
        }

        .toc-link {
            display: flex;
            align-items: center;
            text-decoration: none;
            color: var(--text-primary);
            font-weight: 500;
            padding: 12px 16px;
            border-radius: var(--radius-sm);
            transition: all 0.25s ease;
            gap: 12px;
            border: 1px solid transparent;
        }

        .toc-link:hover {
            background: var(--bg-card-hover);
            border-color: var(--border-light);
            color: #ffffff;
            transform: translateX(4px);
        }

        .toc-number {
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            font-weight: 700;
            color: var(--accent);
            background: rgba(79, 110, 247, 0.1);
            padding: 5px 10px;
            border-radius: 6px;
            white-space: nowrap;
            min-width: 90px;
            text-align: center;
        }

        .toc-title {
            font-size: 15px;
            flex: 1;
        }

        .toc-page {
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: var(--text-muted);
            white-space: nowrap;
        }

        /* Chapters */
        .ebook-chapter {
            page-break-before: always;
            padding-top: 30px;
            padding-bottom: 50px;
            border-bottom: 1px solid var(--border);
        }

        .chapter-header {
            margin-bottom: 32px;
            padding-bottom: 18px;
            border-bottom: 1px solid var(--border-light);
            position: relative;
        }

        .chapter-header::after {
            content: '';
            position: absolute;
            bottom: -1px;
            left: 0;
            width: 60px;
            height: 3px;
            background: var(--gradient-accent);
            border-radius: 3px;
        }

        .chapter-number {
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 3px;
            color: var(--accent-2);
            text-transform: uppercase;
            display: block;
            margin-bottom: 6px;
        }

        .chapter-title {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 30px;
            font-weight: 700;
            line-height: 1.2;
            color: #ffffff;
            margin-bottom: 8px;
            letter-spacing: -0.3px;
        }

        .chapter-subtitle {
            font-size: 15px;
            color: var(--text-muted);
            font-weight: 400;
        }

        .chapter-body h2 {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 21px;
            margin: 36px 0 14px 0;
            color: #ffffff;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--border);
            letter-spacing: -0.2px;
        }

        .chapter-body h3 {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 17px;
            margin: 26px 0 10px 0;
            color: var(--accent-3);
            font-weight: 600;
        }

        .chapter-body p {
            margin-bottom: 16px;
            text-align: justify;
            color: var(--text-secondary);
        }

        .chapter-body strong {
            color: #ffffff;
            font-weight: 600;
        }

        .chapter-body blockquote {
            margin: 22px 0;
            padding: 18px 22px;
            border-left: 4px solid var(--accent);
            background: rgba(79, 110, 247, 0.06);
            color: var(--text-primary);
            border-radius: 0 var(--radius-md) var(--radius-md) 0;
            font-style: normal;
            font-weight: 500;
            position: relative;
        }

        .chapter-body blockquote::before {
            content: '💡';
            position: absolute;
            top: -12px;
            left: -16px;
            font-size: 20px;
        }

        .styled-list {
            margin: 14px 0 22px 22px;
            list-style: none;
        }

        .styled-list li {
            margin-bottom: 9px;
            padding-left: 20px;
            position: relative;
            color: var(--text-secondary);
        }

        .styled-list li::before {
            content: '▸';
            position: absolute;
            left: 0;
            color: var(--accent);
            font-weight: 700;
        }

        /* Code Blocks */
        .code-block-container {
            margin: 22px 0;
            background: var(--bg-code);
            border: 1px solid var(--border-light);
            border-radius: var(--radius-md);
            overflow: hidden;
            box-shadow: var(--shadow-card);
        }

        .code-block-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 16px;
            background: #080a16;
            border-bottom: 1px solid var(--border);
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
        }

        .code-block-lang {
            color: var(--accent-2);
            font-weight: 700;
            letter-spacing: 1px;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .code-block-lang::before {
            content: '';
            width: 8px;
            height: 8px;
            background: var(--accent-2);
            border-radius: 50%;
        }

        .code-copy-btn {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            background: #1a1d35;
            color: #c0c4e0;
            border: 1px solid #2a2d4a;
            border-radius: 6px;
            padding: 5px 12px;
            font-size: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: 'Inter', sans-serif;
            letter-spacing: 0.5px;
        }

        .code-copy-btn:hover {
            background: var(--accent);
            border-color: var(--accent);
            color: #fff;
            box-shadow: 0 0 16px var(--accent-glow);
        }
        .code-copy-btn.copied {
            background: #059669;
            border-color: #059669;
            color: #fff;
        }

        .code-block-container pre {
            padding: 18px;
            overflow-x: auto;
            font-family: 'JetBrains Mono', 'Fira Code', monospace;
            font-size: 13px;
            line-height: 1.7;
            white-space: pre-wrap;
            word-break: break-all;
            color: #d4d7f0;
        }

        .code-block-container pre code {
            color: #d4d7f0;
        }

        /* Inline code */
        .inline-code {
            font-family: 'JetBrains Mono', monospace;
            background: rgba(79, 110, 247, 0.15);
            color: var(--accent-3);
            padding: 3px 7px;
            border-radius: 4px;
            font-size: 0.88em;
            word-break: break-word;
            border: 1px solid rgba(79, 110, 247, 0.2);
        }

        /* Tables */
        .table-container {
            margin: 26px 0;
            overflow-x: auto;
            border: 1px solid var(--border-light);
            border-radius: var(--radius-md);
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13.5px;
        }
        th {
            background: #0d1025;
            color: #ffffff;
            font-weight: 700;
            text-align: left;
            padding: 13px 16px;
            border-bottom: 2px solid var(--border-light);
            font-family: 'Space Grotesk', sans-serif;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            font-size: 11px;
        }
        td {
            padding: 12px 16px;
            border-bottom: 1px solid var(--border);
            color: var(--text-secondary);
        }
        tr:nth-child(even) {
            background: rgba(255, 255, 255, 0.015);
        }
        tr:hover {
            background: rgba(79, 110, 247, 0.04);
        }

        .chapter-footer {
            margin-top: 45px;
            padding-top: 14px;
            border-top: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            color: var(--text-muted);
            letter-spacing: 1px;
        }

        /* Responsive */
        @media (max-width: 768px) {
            .ebook-container {
                padding: 20px 14px !important;
                margin: 8px auto !important;
                border-radius: 14px !important;
            }
            .cover-title {
                font-size: 24px !important;
            }
            .cover-subtitle {
                font-size: 13px !important;
            }
            .chapter-title {
                font-size: 20px !important;
            }
            .code-block-container pre {
                padding: 10px !important;
                font-size: 11px !important;
            }
            .toc-link {
                flex-wrap: wrap;
                gap: 6px;
                padding: 10px 8px !important;
            }
        }

        @media print {
            @page {
                size: A4 portrait;
                margin: 14mm 10mm;
            }
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            body {
                background: #06060e !important;
                color: #e2e4f0 !important;
                padding: 0 !important;
                margin: 0 !important;
            }
            .ebook-container {
                max-width: 100% !important;
                margin: 0 !important;
                border: none !important;
                box-shadow: none !important;
                padding: 18px !important;
                background: #0a0c18 !important;
                color: #e2e4f0 !important;
            }
            .code-block-container {
                background: #050610 !important;
                color: #d4d7f0 !important;
                border: 1px solid #1a1d3a !important;
                page-break-inside: avoid !important;
            }
            .code-copy-btn {
                display: inline-flex !important;
            }
            .ebook-cover {
                min-height: 85vh !important;
                page-break-before: auto !important;
                page-break-after: always !important;
            }
            .ebook-toc {
                page-break-after: always !important;
            }
            .ebook-chapter {
                page-break-before: always !important;
            }
            a {
                text-decoration: none !important;
                color: #4f6ef7 !important;
            }
        }
    </style>
</head>
<body>
    <div class="ebook-container">

        <!-- CAPA -->
        <div class="ebook-cover">
            <div>
                <div class="cover-badge">
                    <span class="dot"></span> CYBERSECURITY RESEARCH • BUG BOUNTY • OFFENSIVE & DEFENSIVE
                </div>
            </div>
            <div class="cover-main">
                <span class="cover-icon">🛡️</span>
                <h1 class="cover-title">${title}</h1>
                ${subtitle ? `<p class="cover-subtitle">${subtitle}</p>` : ''}
                <div class="cover-author">Por ${author || 'Especialista em Cybersegurança'}</div>
            </div>
            <div class="cover-footer">
                Edição ${year} • Guia Completo com Scripts, Bypasses Avançados e Estratégias Práticas
            </div>
        </div>

        <!-- SUMÁRIO -->
        <div class="ebook-toc">
            <h2 class="toc-header">Sumário</h2>
            ${tocHtml}
        </div>

        <!-- CAPÍTULOS -->
        ${chaptersHtml}

    </div>

    <script>
        function copyCode(btn) {
            try {
                const container = btn.closest('.code-block-container');
                if (!container) return;
                const codeElement = container.querySelector('pre code');
                if (!codeElement) return;
                const textToCopy = codeElement.innerText || codeElement.textContent;
                navigator.clipboard.writeText(textToCopy).then(function() {
                    const originalHTML = btn.innerHTML;
                    btn.innerHTML = '✅ Copiado!';
                    btn.classList.add('copied');
                    setTimeout(function() {
                        btn.innerHTML = originalHTML;
                        btn.classList.remove('copied');
                    }, 1800);
                }).catch(function(err) {
                    console.error('Falha ao copiar:', err);
                });
            } catch (e) {
                console.error(e);
            }
        }
    </script>
</body>
</html>`;
}

