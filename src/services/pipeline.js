import { extractTextFromPdf } from './pdfParser';
import { analyzeContract } from './geminiAnalyzer';
import { updateDocumentInDb } from './dbHelper';

export async function processAndAnalyzeDocument(docId, fileObject, apiKey, existingContent = '') {
  try {
    let text = existingContent || '';

    if (!text) {
      if (fileObject) {
        await updateDocumentInDb(docId, { status: 'pending' });
        text = await extractTextFromPdf(fileObject);
        await updateDocumentInDb(docId, { content: text, status: 'processed' });
      } else {
        throw new Error('Nenhum arquivo ou conteúdo existente foi fornecido para processamento.');
      }
    }

    await updateDocumentInDb(docId, { status: 'analyzing' });
    const analysis = await analyzeContract(text, apiKey);

    await updateDocumentInDb(docId, {
      analysis,
      status: 'analyzed',
      errorMessage: null
    });
  } catch (error) {
    console.error('Falha no processamento do documento:', error);
    await updateDocumentInDb(docId, {
      status: 'failed',
      errorMessage: error.message || 'Ocorreu um erro inesperado durante o processamento.'
    });
    throw error;
  }
}
