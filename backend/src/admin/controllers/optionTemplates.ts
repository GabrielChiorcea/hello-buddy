import type { Request, Response } from 'express';
import { logError } from '../../utils/safeErrorLogger.js';
import * as CategoryOptionTemplateModel from '../../models/CategoryOptionTemplate.js';
import * as ProductModel from '../../models/Product.js';
import { beginTransaction } from '../../config/database.js';

export async function getTemplatesForCategory(req: Request, res: Response): Promise<void> {
  try {
    const { id: categoryId } = req.params;
    if (!categoryId) {
      res.status(400).json({ error: 'categoryId este obligatoriu' });
      return;
    }
    const templates = await CategoryOptionTemplateModel.findByCategoryId(categoryId);
    res.json({ templates });
  } catch (error) {
    logError('listare template-uri opțiuni categorie', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

export async function createTemplate(req: Request, res: Response): Promise<void> {
  try {
    const { categoryId, name, groups } = req.body;
    if (!categoryId || !name) {
      res.status(400).json({ error: 'categoryId și name sunt obligatorii' });
      return;
    }
    const template = await CategoryOptionTemplateModel.create({
      categoryId,
      name,
      groups: groups || [],
    });
    res.status(201).json(template);
  } catch (error) {
    logError('creare template opțiuni categorie', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

export async function updateTemplate(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const templateId = parseInt(id, 10);
    if (Number.isNaN(templateId)) {
      res.status(400).json({ error: 'ID template invalid' });
      return;
    }
    const { name, groups } = req.body;
    const updated = await CategoryOptionTemplateModel.updateTemplate(templateId, {
      name,
      groups: groups || [],
    });
    if (!updated) {
      res.status(404).json({ error: 'Template-ul nu a fost găsit' });
      return;
    }

    // Live sync: actualizează automat produsele care urmăresc acest template
    let synced = 0;
    const connection = await beginTransaction();
    try {
      synced = await ProductModel.syncProductsForTemplate(connection, templateId, updated);
      await connection.commit();
      connection.release();
    } catch (err) {
      await connection.rollback();
      connection.release();
      // Log but don't fail the template update itself
      logError('auto-sync after template update', err);
    }

    res.json({ ...updated, syncedProducts: synced });
  } catch (error) {
    logError('actualizare template opțiuni categorie', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

export async function deleteTemplate(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const templateId = parseInt(id, 10);
    if (Number.isNaN(templateId)) {
      res.status(400).json({ error: 'ID template invalid' });
      return;
    }

    // Detach products from template but keep their local options
    await ProductModel.detachProductsFromTemplate(templateId);
    await CategoryOptionTemplateModel.remove(templateId);

    res.json({ success: true });
  } catch (error) {
    logError('ștergere template opțiuni categorie', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

export async function applyTemplate(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const templateId = parseInt(id, 10);
    if (Number.isNaN(templateId)) {
      res.status(400).json({ error: 'ID template invalid' });
      return;
    }
    const { productIds, setFollowsTemplate } = req.body as {
      productIds: string[];
      setFollowsTemplate?: boolean;
    };
    if (!Array.isArray(productIds) || productIds.length === 0) {
      res.status(400).json({ error: 'productIds este obligatoriu și trebuie să conțină cel puțin un ID' });
      return;
    }

    const connection = await beginTransaction();
    try {
      const template = await CategoryOptionTemplateModel.findById(templateId);
      if (!template) {
        await connection.rollback();
        connection.release();
        res.status(404).json({ error: 'Template-ul nu a fost găsit' });
        return;
      }

      let affected = 0;
      for (const productId of productIds) {
        const ok = await ProductModel.applyTemplateToProduct(
          connection,
          productId,
          template,
          Boolean(setFollowsTemplate)
        );
        if (ok) affected += 1;
      }

      await connection.commit();
      connection.release();
      res.json({ success: true, affected });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (error) {
    logError('aplicare template opțiuni categorie', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

export async function syncTemplate(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const templateId = parseInt(id, 10);
    if (Number.isNaN(templateId)) {
      res.status(400).json({ error: 'ID template invalid' });
      return;
    }

    const connection = await beginTransaction();
    try {
      const template = await CategoryOptionTemplateModel.findById(templateId);
      if (!template) {
        await connection.rollback();
        connection.release();
        res.status(404).json({ error: 'Template-ul nu a fost găsit' });
        return;
      }

      const affected = await ProductModel.syncProductsForTemplate(connection, templateId, template);
      await connection.commit();
      connection.release();
      res.json({ success: true, affected });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (error) {
    logError('sync template opțiuni categorie', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

