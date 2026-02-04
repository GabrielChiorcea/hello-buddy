/**
 * Controller produse admin - CRUD complet
 */

import { Request, Response } from 'express';
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
    console.error('Eroare listare produse:', error);
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
    console.error('Eroare detalii produs:', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * POST /admin/products
 * Creează un produs nou
 */
export async function createProduct(req: Request, res: Response): Promise<void> {
  try {
    const { name, description, price, image, categoryId, preparationTime, ingredients } = req.body;
    
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
      image: imagePath,
      categoryId,
      preparationTime: preparationTime ? parseInt(preparationTime) : undefined,
      ingredients,
    });
    
    res.status(201).json(product);
  } catch (error) {
    console.error('Eroare creare produs:', error);
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
    const { name, description, price, image, categoryId, isAvailable, preparationTime, ingredients } = req.body;
    
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
      image: imagePath,
      categoryId,
      isAvailable,
      preparationTime: preparationTime !== undefined ? parseInt(preparationTime) : undefined,
      ingredients,
    });
    
    res.json(product);
  } catch (error) {
    console.error('Eroare actualizare produs:', error);
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
      await ProductModel.hardDelete(id);
    } else {
      await ProductModel.softDelete(id);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Eroare ștergere produs:', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}
