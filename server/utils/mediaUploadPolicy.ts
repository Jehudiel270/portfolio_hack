import { createError } from 'h3';

const imageSignatures: Record<string, (data: Uint8Array) => boolean> = {
  'image/jpeg': (data) => data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff,
  'image/png': (data) => data.length >= 8 && data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47 && data[4] === 0x0d && data[5] === 0x0a && data[6] === 0x1a && data[7] === 0x0a,
  'image/webp': (data) => data.length >= 12 && String.fromCharCode(...data.slice(0, 4)) === 'RIFF' && String.fromCharCode(...data.slice(8, 12)) === 'WEBP',
};

const documentFolders = new Set(['journey', 'educations', 'certifications']);

export function resolveMediaUploadPolicy(folder: string, mimeType: string, data: Uint8Array) {
  if (!['profile', 'projects', 'journey', 'educations', 'certifications'].includes(folder)) {
    throw createError({ statusCode: 400, statusMessage: 'Dossier de destination invalide.' });
  }

  if (mimeType === 'application/pdf') {
    if (!documentFolders.has(folder)) {
      throw createError({ statusCode: 415, statusMessage: 'Les justificatifs PDF sont réservés aux expériences, formations et certifications.' });
    }
    if (data.length < 5 || String.fromCharCode(...data.slice(0, 5)) !== '%PDF-') {
      throw createError({ statusCode: 415, statusMessage: 'Le fichier sélectionné ne semble pas être un PDF valide.' });
    }
    return { kind: 'pdf' as const, resourceType: 'raw' as const, maxBytes: 10 * 1024 * 1024, allowedFormats: ['pdf'] };
  }

  const isMatchingImage = imageSignatures[mimeType]?.(data) ?? false;
  if (!isMatchingImage) {
    throw createError({ statusCode: 415, statusMessage: 'Format accepté : JPEG, PNG ou WebP valide; PDF pour les justificatifs.' });
  }

  return {
    kind: 'image' as const,
    resourceType: 'image' as const,
    maxBytes: 8 * 1024 * 1024,
    allowedFormats: ['jpg', 'png', 'webp'],
  };
}
