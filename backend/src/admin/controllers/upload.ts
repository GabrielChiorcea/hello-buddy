/**
 * POST /admin/upload — multipart imagine (câmpul `image`)
 */

import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env.js';
import { logError } from '../../utils/safeErrorLogger.js';

const ADMIN_UPLOADS_DIR = path.join(process.cwd(), 'storage', 'admin-uploads');

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

function ensureAdminUploadsDir() {
  if (!fs.existsSync(ADMIN_UPLOADS_DIR)) {
    fs.mkdirSync(ADMIN_UPLOADS_DIR, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureAdminUploadsDir();
    cb(null, ADMIN_UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = MIME_TO_EXT[file.mimetype] || '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: env.MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (MIME_TO_EXT[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error('Tip fișier neacceptat (folosiți JPEG, PNG, WebP sau GIF)'));
    }
  },
}).single('image');

export function postUpload(req: Request, res: Response): void {
  upload(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ error: 'Fișier prea mare' });
        return;
      }
      res.status(400).json({ error: 'Eroare la încărcare' });
      return;
    }
    if (err instanceof Error) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'Lipsește imaginea (câmpul image)' });
      return;
    }
    try {
      const url = `/storage/admin-uploads/${req.file.filename}`;
      res.json({ url });
    } catch (e) {
      logError('admin upload', e);
      res.status(500).json({ error: 'Eroare internă server' });
    }
  });
}
