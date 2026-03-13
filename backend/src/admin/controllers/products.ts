/**
 * Controller produse admin - CRUD complet
 */

import { Request, Response } from 'express';
import { logError } from '../../utils/safeErrorLogger.js';
import * as ProductModel from '../../models/Product.js';
import { processProductImage } from '../../utils/storage.js';

/**
 * GET /admin/products
 * Listează toate produsele cu filtre și paginare
 */
export async function getProducts(req: Request, res: Response): Promise<void> {
  try {
    const {
      page = '1',
      limit = '20',
      categoryId,
      isAvailable,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = req.query;
    
    const { products, total } = await ProductModel.findAll({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      categoryId: categoryId as string,
      isAvailable: isAvailable ? isAvailable === 'true' : undefined,
      search: search as string,
      sortBy: sortBy as 'name' | 'price' | 'created_at',
      sortOrder: sortOrder as 'ASC' | 'DESC',
    });
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    res.json({
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logError('listare produse', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * GET /admin/products/:id
 * Detalii produs
 */
export async function getProduct(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const product = await ProductModel.findById(id);
    
    if (!product) {
      res.status(404).json({ error: 'Produsul nu a fost găsit' });
      return;
    }
    
    res.json(product);
  } catch (error) {
    logError('detalii produs', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * POST /admin/products
 * Creează un produs nou
 */
export async function createProduct(req: Request, res: Response): Promise<void> {
  try {
    const {
      name,
      description,
      price,
      image,
      categoryId,
      preparationTime,
      isAddon,
      ingredients,
      minVisibilityTierId,
      isRecommended,
      recommendedOrder,
    } = req.body;
    
    // Validare
    if (!name || !price || !categoryId) {
      res.status(400).json({ error: 'Nume, preț și categorie sunt obligatorii' });
      return;
    }
    
    // Procesează imaginea (salvează base64 ca fișier)
    const imagePath = await processProductImage(image);
    
    const product = await ProductModel.create({
      name,
      description,
      price: parseFloat(price),
      image: imagePath ?? undefined,
      categoryId,
      preparationTime: preparationTime ? parseInt(preparationTime) : undefined,
      isAddon: Boolean(isAddon),
      minVisibilityTierId: minVisibilityTierId ?? null,
      isRecommended: Boolean(isRecommended),
      recommendedOrder: recommendedOrder != null ? parseInt(recommendedOrder, 10) : undefined,
      ingredients,
    });
    
    res.status(201).json(product);
  } catch (error) {
    logError('creare produs', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * PUT /admin/products/:id
 * Actualizează un produs
 */
export async function updateProduct(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      image,
      categoryId,
      isAvailable,
      isAddon,
      preparationTime,
      ingredients,
      minVisibilityTierId,
      isRecommended,
      recommendedOrder,
    } = req.body;
    
    // Obține produsul existent pentru imaginea veche
    const existingProduct = await ProductModel.findById(id);
    if (!existingProduct) {
      res.status(404).json({ error: 'Produsul nu a fost găsit' });
      return;
    }
    
    // Procesează imaginea (salvează base64 ca fișier, șterge vechea)
    const imagePath = await processProductImage(image, existingProduct.image);
    
    const product = await ProductModel.update(id, {
      name,
      description,
      price: price !== undefined ? parseFloat(price) : undefined,
      image: imagePath ?? undefined,
      categoryId,
      isAvailable,
      isAddon: isAddon !== undefined ? Boolean(isAddon) : undefined,
      preparationTime: preparationTime !== undefined ? parseInt(preparationTime) : undefined,
      minVisibilityTierId: minVisibilityTierId ?? null,
      isRecommended: isRecommended !== undefined ? Boolean(isRecommended) : undefined,
      recommendedOrder: recommendedOrder !== undefined ? (recommendedOrder != null ? parseInt(recommendedOrder, 10) : null) : undefined,
      ingredients,
    });
    
    res.json(product);
  } catch (error) {
    logError('actualizare produs', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * DELETE /admin/products/:id
 * Șterge un produs (soft delete - marchează ca indisponibil)
 */
export async function deleteProduct(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { hard } = req.query;
    
    if (hard === 'true') {
      try {
        await ProductModel.hardDelete(id);
      } catch (err) {
        if (err instanceof Error && err.message === 'PRODUCT_HAS_ORDERS') {
          // Produsul apare în comenzi - fallback la soft delete
          await ProductModel.softDelete(id);
          res.json({
            success: true,
            softDeleted: true,
            message: 'Produs marcat ca indisponibil (nu poate fi șters definitiv - apare în comenzi)',
          });
          return;
        }
        throw err;
      }
    } else {
      await ProductModel.softDelete(id);
    }
    
    res.json({ success: true });
  } catch (error) {
    logError('ștergere produs', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}
