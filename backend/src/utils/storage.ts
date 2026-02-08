/**
 * Utilitar pentru salvarea fișierelor (imagini produse)
 * Salvează fișierele pe disk și returnează URL-ul public
 */

import fs from 'fs';
import { logError } from './safeErrorLogger.js';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Directorul pentru storage
const STORAGE_DIR = path.join(process.cwd(), 'storage');
const PRODUCTS_DIR = path.join(STORAGE_DIR, 'products');

// Asigură existența directoarelor
function ensureDirectories() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
  if (!fs.existsSync(PRODUCTS_DIR)) {
    fs.mkdirSync(PRODUCTS_DIR, { recursive: true });
  }
}

// Inițializează directoarele la import
ensureDirectories();

/**
 * Extrage extensia din base64 data URI
 */
function getExtensionFromBase64(base64: string): string {
  const match = base64.match(/^data:image\/(\w+);base64,/);
  if (match) {
    const ext = match[1].toLowerCase();
    if (ext === 'jpeg') return 'jpg';
    return ext;
  }
  return 'png';
}

/**
 * Verifică dacă un string este base64 data URI
 */
export function isBase64Image(str: string): boolean {
  return str.startsWith('data:image/');
}

/**
 * Salvează o imagine base64 pe disk
 * @returns path-ul relativ pentru URL (/storage/products/xxx.jpg)
 */
export async function saveProductImage(base64Data: string): Promise<string> {
  ensureDirectories();
  
  const extension = getExtensionFromBase64(base64Data);
  const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
  
  const filename = `${uuidv4()}.${extension}`;
  const filePath = path.join(PRODUCTS_DIR, filename);
  
  const buffer = Buffer.from(base64Content, 'base64');
  await fs.promises.writeFile(filePath, buffer);
  
  return `/storage/products/${filename}`;
}

/**
 * Șterge o imagine din storage
 */
export async function deleteProductImage(imagePath: string): Promise<void> {
  if (!imagePath || !imagePath.startsWith('/storage/products/')) {
    return;
  }
  
  const fullPath = path.join(process.cwd(), imagePath);
  
  try {
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
  } catch (error) {
    logError('ștergere imagine', error);
  }
}

/**
 * Procesează imaginea produsului - dacă e base64, o salvează; altfel returnează URL-ul existent
 */
export async function processProductImage(
  imageData: string | undefined | null,
  oldImagePath?: string | null
): Promise<string | null> {
  if (!imageData) {
    return oldImagePath || null;
  }
  
  // Dacă e deja un URL valid, nu facem nimic
  if (imageData.startsWith('/storage/') || imageData.startsWith('http')) {
    return imageData;
  }
  
  // Dacă e base64, salvăm imaginea
  if (isBase64Image(imageData)) {
    // Șterge imaginea veche dacă există
    if (oldImagePath) {
      await deleteProductImage(oldImagePath);
    }
    
    return saveProductImage(imageData);
  }
  
  return imageData;
}
