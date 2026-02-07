/**
 * Controller utilizatori admin
 */

import { Request, Response } from 'express';
import * as UserModel from '../../models/User.js';
import * as UserRoleModel from '../../models/UserRole.js';
import * as OrderModel from '../../models/Order.js';
import { query } from '../../config/database.js';

/**
 * GET /admin/users
 * Listează utilizatorii
 */
export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const {
      page = '1',
      limit = '20',
      search,
      role,
    } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    const { users, total } = await UserModel.findAll(
      pageNum,
      limitNum,
      search as string
    );
    
    // Obține rolurile pentru fiecare utilizator
    const usersWithRoles = await Promise.all(
      users.map(async (user) => {
        const roles = await UserRoleModel.getUserRoles(user.id);
        
        // Statistici comenzi
        const orderStats = await query<{ count: number; total: string }[]>(
          `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total
           FROM orders WHERE user_id = ? AND status != 'cancelled'`,
          [user.id]
        );
        
        const { email, phone, ...safeUser } = user;
        return {
          ...safeUser,
          roles,
          ordersCount: orderStats[0]?.count || 0,
          totalSpent: parseFloat(orderStats[0]?.total || '0'),
        };
      })
    );
    
    // Filtrare după rol dacă este specificat
    let filteredUsers = usersWithRoles;
    if (role) {
      filteredUsers = usersWithRoles.filter(u => u.roles.includes(role as UserRoleModel.AppRole));
    }
    
    res.json({
      users: filteredUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: role ? filteredUsers.length : total,
        pages: Math.ceil((role ? filteredUsers.length : total) / limitNum),
      },
    });
  } catch (error) {
    console.error('Eroare listare utilizatori:', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * GET /admin/users/:id
 * Detalii utilizator
 */
export async function getUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id);
    
    if (!user) {
      res.status(404).json({ error: 'Utilizatorul nu a fost găsit' });
      return;
    }
    
    // Roluri
    const roles = await UserRoleModel.getUserRoles(id);
    
    // Istoric comenzi
    const orders = await OrderModel.findByUserId(id);
    
    // Statistici
    const stats = {
      ordersCount: orders.length,
      totalSpent: orders.reduce((sum, o) => sum + o.total, 0),
      averageOrderValue: orders.length > 0
        ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length
        : 0,
    };
    
    res.json({
      ...user,
      roles,
      stats,
      recentOrders: orders.slice(0, 10),
    });
  } catch (error) {
    console.error('Eroare detalii utilizator:', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * PUT /admin/users/:id/role
 * Actualizează rolurile utilizatorului
 */
export async function updateUserRole(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { roles } = req.body;
    
    if (!Array.isArray(roles)) {
      res.status(400).json({ error: 'Lista de roluri este obligatorie' });
      return;
    }
    
    // Verifică că rolurile sunt valide
    const validRoles: UserRoleModel.AppRole[] = ['admin', 'moderator', 'user'];
    const invalidRoles = roles.filter(r => !validRoles.includes(r));
    
    if (invalidRoles.length > 0) {
      res.status(400).json({ error: `Roluri invalide: ${invalidRoles.join(', ')}` });
      return;
    }
    
    // Nu permite eliminarea propriului rol de admin
    if (req.user?.id === id && !roles.includes('admin')) {
      res.status(400).json({ error: 'Nu vă puteți elimina propriul rol de admin' });
      return;
    }
    
    await UserRoleModel.setRoles(id, roles);
    
    const user = await UserModel.findById(id);
    const updatedRoles = await UserRoleModel.getUserRoles(id);
    
    res.json({
      ...user,
      roles: updatedRoles,
    });
  } catch (error) {
    console.error('Eroare actualizare rol utilizator:', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}

/**
 * PUT /admin/users/:id/block
 * Blochează/deblochează un utilizator
 */
export async function toggleBlockUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { blocked } = req.body;
    
    if (typeof blocked !== 'boolean') {
      res.status(400).json({ error: 'Parametrul blocked este obligatoriu' });
      return;
    }
    
    // Nu permite blocarea propriului cont
    if (req.user?.id === id) {
      res.status(400).json({ error: 'Nu vă puteți bloca propriul cont' });
      return;
    }
    
    await UserModel.setBlocked(id, blocked);
    const user = await UserModel.findById(id);
    
    if (!user) {
      res.status(404).json({ error: 'Utilizatorul nu a fost găsit' });
      return;
    }
    
    res.json(user);
  } catch (error) {
    console.error('Eroare blocare utilizator:', error);
    res.status(500).json({ error: 'Eroare internă server' });
  }
}
