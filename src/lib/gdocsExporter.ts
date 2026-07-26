import { Ebook } from '../types';

export interface GDocsExportResult {
  success: boolean;
  documentId?: string;
  documentUrl?: string;
  error?: string;
}

export async function exportToGoogleDocs(
  ebook: Ebook,
  accessToken: string
): Promise<GDocsExportResult> {
  try {
    // 1. Create a new Google Doc
    const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: ebook.metadata.title,
      }),
    });

    if (!createRes.ok) {
      const errJson = await createRes.json();
      throw new Error(errJson.error?.message || 'Falha ao criar documento no Google Docs.');
    }

    const docData = await createRes.json();
    const documentId = docData.documentId;
    const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;

    // 2. Prepare batch updates to populate document content
    const requests: any[] = [];
    let currentIndex = 1;

    // Helper to insert text at index
    const insertText = (text: string) => {
      requests.push({
        insertText: {
          location: { index: currentIndex },
          text: text,
        },
      });
      const len = text.length;
      const startIndex = currentIndex;
      currentIndex += len;
      return { startIndex, endIndex: currentIndex };
    };

    // Insert Document Title
    const titleRange = insertText(`${ebook.metadata.title}\n`);
    requests.push({
      updateParagraphStyle: {
        range: { startIndex: titleRange.startIndex, endIndex: titleRange.endIndex },
        paragraphStyle: { namedStyleType: 'TITLE', alignment: 'CENTER' },
        fields: 'namedStyleType,alignment',
      },
    });

    // Subtitle
    if (ebook.metadata.subtitle) {
      const subRange = insertText(`${ebook.metadata.subtitle}\n\n`);
      requests.push({
        updateParagraphStyle: {
          range: { startIndex: subRange.startIndex, endIndex: subRange.endIndex },
          paragraphStyle: { namedStyleType: 'SUBTITLE', alignment: 'CENTER' },
          fields: 'namedStyleType,alignment',
        },
      });
    }

    // Author
    if (ebook.metadata.author) {
      const authRange = insertText(`Por: ${ebook.metadata.author}\n\n`);
      requests.push({
        updateParagraphStyle: {
          range: { startIndex: authRange.startIndex, endIndex: authRange.endIndex },
          paragraphStyle: { namedStyleType: 'NORMAL_TEXT', alignment: 'CENTER' },
          fields: 'namedStyleType,alignment',
        },
      });
    }

    // Insert Page Break after Cover info
    requests.push({
      insertPageBreak: {
        location: { index: currentIndex },
      },
    });
    currentIndex += 1;

    // Table of Contents Heading
    const tocHeadingRange = insertText('Sumário\n\n');
    requests.push({
      updateParagraphStyle: {
        range: { startIndex: tocHeadingRange.startIndex, endIndex: tocHeadingRange.endIndex },
        paragraphStyle: { namedStyleType: 'HEADING_1' },
        fields: 'namedStyleType',
      },
    });

    // List of chapters in TOC
    ebook.chapters.forEach((ch) => {
      insertText(`Capítulo ${ch.number}: ${ch.title}\n`);
    });
    insertText('\n');

    requests.push({
      insertPageBreak: {
        location: { index: currentIndex },
      },
    });
    currentIndex += 1;

    // Insert Chapters
    for (const chapter of ebook.chapters) {
      // Chapter Heading
      const chHeadingRange = insertText(`Capítulo ${chapter.number}: ${chapter.title}\n`);
      requests.push({
        updateParagraphStyle: {
          range: { startIndex: chHeadingRange.startIndex, endIndex: chHeadingRange.endIndex },
          paragraphStyle: { namedStyleType: 'HEADING_1' },
          fields: 'namedStyleType',
        },
      });

      if (chapter.subtitle) {
        const chSubRange = insertText(`${chapter.subtitle}\n\n`);
        requests.push({
          updateParagraphStyle: {
            range: { startIndex: chSubRange.startIndex, endIndex: chSubRange.endIndex },
            paragraphStyle: { namedStyleType: 'HEADING_2' },
            fields: 'namedStyleType',
          },
        });
      }

      // Sanitize Markdown text for Google Docs insertion
      const cleanContent = chapter.content
        .replace(/### (.*)/g, '$1')
        .replace(/## (.*)/g, '$1')
        .replace(/# (.*)/g, '$1')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`{1,3}(.*?)`{1,3}/g, '$1');

      insertText(`${cleanContent}\n\n`);

      requests.push({
        insertPageBreak: {
          location: { index: currentIndex },
        },
      });
      currentIndex += 1;
    }

    // Execute batch update
    const batchRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });

    if (!batchRes.ok) {
      const errJson = await batchRes.json();
      console.warn('Batch update notice:', errJson);
    }

    return {
      success: true,
      documentId,
      documentUrl,
    };
  } catch (error: any) {
    console.error('Error exporting to Google Docs:', error);
    return {
      success: false,
      error: error.message || 'Ocorreu um erro ao exportar para o Google Docs.',
    };
  }
}
