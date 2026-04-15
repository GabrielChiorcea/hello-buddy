/**
 * Utilitar pentru URL-uri complete ale imaginilor
 * Convertește path-urile relative (/storage/products/xxx.webp) în URL-uri absolute cu domeniu
 */

import { resolveViteApiBaseUrl } from '@/config/runtimeApi';

const API_BASE = resolveViteApiBaseUrl();

/**
 * Returnează URL-ul complet pentru o imagine
 * @param path - Path relativ (/storage/products/xxx.webp) sau URL complet
 * @returns URL-ul complet cu domeniu
 */
export function getImageUrl(path: string | null | undefined): string {
  if (!path) return '/placeholder.svg';
  
  // Dacă e deja URL complet, returnează-l
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Path-uri din storage - adaugă domeniul API
  if (path.startsWith('/storage/')) {
    const base = API_BASE.replace(/\/$/, ''); // Elimină trailing slash
    return `${base}${path}`;
  }
  
  return path;
}
