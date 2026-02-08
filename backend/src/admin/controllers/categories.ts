/**
 * Controller categorii admin
 * Categoriile folosesc doar iconițe emoji, nu imagini
 */

import { Request, Response } from 'express';
import { logError } from '../../utils/safeErrorLogger.js';
import * as CategoryModel from '../../models/Category.js';

/**
 * GET /admin/categories
 * Listează toate categoriile
 */
export async function getCategories(req: Request, res: Response): Promise<void> {
  try {
    const { includeInactive } = req.query;
    const categories = await CategoryModel.findAll(includeInactive === 'true');
    res.json(categories);
  } catch (error) {
    logError('listare categorii', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * GET /admin/categories/:id
 * Detalii categorie
 */
export async function getCategory(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const category = await CategoryModel.findById(id);
    
    if (!category) {
      res.status(404).json({ error: 'Categoria nu a fost găsită' });
      return;
    }
    
    res.json(category);
  } catch (error) {
    logError('detalii categorie', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * POST /admin/categories
 * Creează o categorie nouă
 */
export async function createCategory(req: Request, res: Response): Promise<void> {
  try {
    const { name, displayName, description, icon, sortOrder } = req.body;
    
    if (!name || !displayName) {
      res.status(400).json({ error: 'Nume și nume afișat sunt obligatorii' });
      return;
    }
    
    // Verifică dacă numele există deja
    const existing = await CategoryModel.findByName(name);
    if (existing) {
      res.status(400).json({ error: 'O categorie cu acest nume există deja' });
      return;
    }
    
    const category = await CategoryModel.create({
      name,
      displayName,
      description,
      icon,
      sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : undefined,
    });
    
    res.status(201).json(category);
  } catch (error) {
    logError('creare categorie', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * PUT /admin/categories/:id
 * Actualizează o categorie
 */
export async function updateCategory(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, displayName, description, icon, sortOrder, isActive } = req.body;
    
    const category = await CategoryModel.update(id, {
      name,
      displayName,
      description,
      icon,
      sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : undefined,
      isActive,
    });
    
    if (!category) {
      res.status(404).json({ error: 'Categoria nu a fost găsită' });
      return;
    }
    
    res.json(category);
  } catch (error) {
    logError('actualizare categorie', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * PUT /admin/categories/order
 * Reordonează categoriile
 */
export async function reorderCategories(req: Request, res: Response): Promise<void> {
  try {
    const { categoryIds } = req.body;
    
    if (!Array.isArray(categoryIds)) {
      res.status(400).json({ error: 'Lista de ID-uri categorii este obligatorie' });
      return;
    }
    
    await CategoryModel.reorder(categoryIds);
    res.json({ success: true });
  } catch (error) {
    logError('reordonare categorii', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * DELETE /admin/categories/:id
 * Șterge o categorie
 */
export async function deleteCategory(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    await CategoryModel.deleteCategory(id);
    res.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Eroare internă server';
    logError('ștergere categorie', error);
    res.status(400).json({ error: errorMessage });
  }
}
