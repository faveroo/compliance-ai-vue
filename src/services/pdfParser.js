import * as pdfjsLib from 'pdfjs-dist';

// Configure PDFJS worker path
try {
  const workerUrl = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
} catch (e) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.370/pdf.worker.min.mjs';
}

export async function extractTextFromPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map(item => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }

  return fullText.trim();
}
