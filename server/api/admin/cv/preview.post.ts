import { createError, defineEventHandler, readMultipartFormData } from 'h3';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { requireAdmin } from '~/server/utils/auth';

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MAX_TEXT_LENGTH = 40000;
const MAX_PDF_PAGES = 30;
const require = createRequire(import.meta.url);
const pdfjsModulePath = require.resolve('pdfjs-dist/legacy/build/pdf.mjs');
const standardFontDataUrl = `${pathToFileURL(resolve(dirname(pdfjsModulePath), '..', '..', 'standard_fonts')).href}/`;

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const parts = await readMultipartFormData(event);
  const file = parts?.find((part) => part.name === 'file' && part.data);
  if (!file || !file.filename) throw createError({ statusCode: 400, statusMessage: 'Sélectionne un CV PDF ou DOCX.' });
  if (file.data.length > MAX_FILE_SIZE) throw createError({ statusCode: 413, statusMessage: 'Le CV doit faire 8 Mo maximum.' });

  const extension = file.filename.toLowerCase().split('.').pop();
  let text = '';
  try {
    if (extension === 'pdf' && file.type === 'application/pdf') {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(file.data),
        disableFontFace: true,
        standardFontDataUrl,
      });
      const document = await loadingTask.promise;
      if (document.numPages > MAX_PDF_PAGES) {
        await loadingTask.destroy();
        throw createError({ statusCode: 413, statusMessage: `Le PDF dépasse la limite de ${MAX_PDF_PAGES} pages.` });
      }
      const pages: string[] = [];
      for (let pageNumber = 1; pageNumber <= document.numPages && text.length < MAX_TEXT_LENGTH; pageNumber++) {
        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent();
        const pageText = content.items.map((item) => 'str' in item ? item.str : '').join(' ');
        pages.push(pageText);
        text += `${pageText}\n`;
      }
      await loadingTask.destroy();
      text = pages.join('\n');
    } else if (extension === 'docx' && file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer: file.data });
      text = result.value.slice(0, MAX_TEXT_LENGTH);
    } else {
      throw createError({ statusCode: 415, statusMessage: 'Format refusé : sélectionne un fichier PDF ou DOCX valide.' });
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error;
    console.warn('[CV preview] Document extraction failed.', error);
    throw createError({ statusCode: 422, statusMessage: 'Le document n’a pas pu être lu. Vérifie son intégrité et son format.' });
  }

  const extractedText = text.replace(/\u0000/g, '').trim().slice(0, MAX_TEXT_LENGTH);
  if (!extractedText) throw createError({ statusCode: 422, statusMessage: 'Aucun texte exploitable détecté. Les PDF scannés nécessitent un OCR, qui n’est pas activé.' });
  return { filename: file.filename, text: extractedText, truncated: text.length > MAX_TEXT_LENGTH };
});
