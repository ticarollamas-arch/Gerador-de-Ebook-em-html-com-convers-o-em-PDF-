// @ts-ignore
import html2pdf from 'html2pdf.js';

export async function exportToPdf(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Elemento do e-book não encontrado para exportação.');
  }

  // Clone element to prevent UI flicker during render
  const opt: any = {
    margin: [10, 10, 12, 10], // top, left, bottom, right in mm
    filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2, // High resolution crisp rendering
      useCORS: true,
      letterRendering: true,
      logging: false,
      allowTaint: true,
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
      compress: true,
    },
    pagebreak: {
      mode: ['css', 'legacy'],
      before: '.page-break-before',
      after: '.page-break-after',
      avoid: ['tr', 'blockquote', '.keep-together'],
    },
  };

  try {
    await html2pdf().set(opt).from(element).save();
  } catch (err: any) {
    console.error('HTML2PDF Error, falling back to print:', err);
    // Fallback to browser print if html2pdf runs into memory limits on 50k word documents
    window.print();
  }
}
