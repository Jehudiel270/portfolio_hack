import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { createError } from 'h3';

export function isNonPublicAddress(address: string) {
  const version = isIP(address);
  if (version === 4) {
    const [first, second, third] = address.split('.').map(Number);
    return first === 0 || first === 10 || first === 127 || first >= 224
      || first === 169 && second === 254
      || first === 172 && second >= 16 && second <= 31
      || first === 192 && (second === 0 && (third === 0 || third === 2)
        || second === 168 || second === 88 && third === 99)
      || first === 198 && (second === 18 || second === 19 || second === 51 && third === 100)
      || first === 203 && second === 0 && third === 113
      || first === 100 && second >= 64 && second <= 127;
  }
  if (version === 6) {
    const normalized = address.toLowerCase();
    return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd')
      || normalized.startsWith('fe8') || normalized.startsWith('fe9')
      || normalized.startsWith('fea') || normalized.startsWith('feb')
      || normalized.startsWith('2001:db8:')
      || !/^2[0-9a-f]{3}:/u.test(normalized);
  }
  return true;
}

export async function validatePublicHttpsUrl(value: string) {
  let url: URL;
  try { url = new URL(value); } catch { throw createError({ statusCode: 400, statusMessage: 'Le lien du projet doit être une URL HTTPS valide.' }); }
  const hostname = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || url.port && url.port !== '443' || url.username || url.password
    || hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')
    || hostname.endsWith('.internal') || isIP(hostname)) {
    throw createError({ statusCode: 400, statusMessage: 'Seuls les liens HTTPS publics sont autorisés pour le contexte URL.' });
  }
  let addresses: Array<{ address: string }>;
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Le domaine du lien ne peut pas être vérifié.' });
  }
  if (!addresses.length || addresses.some(entry => isNonPublicAddress(entry.address))) {
    throw createError({ statusCode: 400, statusMessage: 'Le lien doit pointer uniquement vers une adresse publique.' });
  }
  url.hash = '';
  return url.toString();
}
