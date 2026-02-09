/**
 * =============================================================================
 * PAGINA UTILIZATORI ADMIN - INTEGRAT CU BACKEND
 * =============================================================================
 */

import { useEffect, useState, useCallback } from 'react';
import { useAdminApi } from '@/admin/hooks/useAdminApi';
import { DataTable, Column } from '@/admin/components/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MoreHorizontal, Shield, ShieldOff, Eye, Loader2 } from 'lucide-react';
import { PointsBalance } from '@/plugins/points';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { AdminRole, Pagination } from '@/types/admin';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

interface AdminUser {
  id: string;
  name: string;
  createdAt: string;
  roles: AdminRole[];
  isBlocked: boolean;
  ordersCount?: number;
  pointsBalance?: number;
}

const roleLabels: Record<AdminRole, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  admin: { label: 'Admin', variant: 'default' },
  moderator: { label: 'Moderator', variant: 'secondary' },
  user: { label: 'Utilizator', variant: 'outline' },
};

export default function AdminUsers() {
  const { getUsers, updateUserRole, toggleBlockUser } = useAdminApi();
  const { enabled: pointsEnabled } = usePluginEnabled('points');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [blockConfirm, setBlockConfirm] = useState<AdminUser | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      if (search) params.append('search', search);

      const result = await getUsers(params.toString());
      setUsers(result.users || []);
      setPagination((prev) => ({
        ...prev,
        total: result.pagination?.total || 0,
        pages: result.pagination?.pages || 0,
      }));
    } catch (error) {
      console.error('Eroare la încărcarea utilizatorilor:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca utilizatorii',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, getUsers]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: AdminRole) => {
    setIsUpdating(userId);
    try {
      await updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, roles: [newRole] } : u))
      );
      toast({
        title: 'Succes',
        description: `Rol actualizat la "${roleLabels[newRole].label}"`,
      });
    } catch (error) {
      console.error('Eroare la actualizarea rolului:', error);
      toast({
        title: 'Eroare',
        description: error instanceof Error ? error.message : 'Eroare la actualizarea rolului',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleToggleBlock = async () => {
    if (!blockConfirm) return;
    
    setIsUpdating(blockConfirm.id);
    try {
      await toggleBlockUser(blockConfirm.id, blockConfirm.isBlocked);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === blockConfirm.id ? { ...u, isBlocked: !u.isBlocked } : u
        )
      );
      toast({
        title: 'Succes',
        description: blockConfirm.isBlocked 
          ? 'Utilizator deblocat cu succes' 
          : 'Utilizator blocat cu succes',
      });
      setBlockConfirm(null);
    } catch (error) {
      console.error('Eroare la blocarea utilizatorului:', error);
      toast({
        title: 'Eroare',
        description: error instanceof Error ? error.message : 'Eroare la blocarea utilizatorului',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(null);
    }
  };

  const columns: Column<AdminUser>[] = [
    {
      key: 'name',
      header: 'Utilizator',
      cell: (user) => (
        <p className="font-medium text-foreground">{user.name}</p>
      ),
    },
    {
      key: 'orders',
      header: 'Comenzi',
      cell: (user) => (
        <span className="font-medium">{user.ordersCount ?? '-'}</span>
      ),
    },
    {
      key: 'role',
      header: 'Rol',
      cell: (user) => {
        // Afișează primul rol sau 'user' ca fallback
        const primaryRole = user.roles?.[0] || 'user';
        return (
          <Badge variant={roleLabels[primaryRole]?.variant || 'outline'}>
            {roleLabels[primaryRole]?.label || primaryRole}
          </Badge>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      cell: (user) => (
        <Badge variant={user.isBlocked ? 'destructive' : 'secondary'}>
          {user.isBlocked ? 'Blocat' : 'Activ'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Înregistrat',
      cell: (user) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: ro })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      cell: (user) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isUpdating === user.id}>
              {isUpdating === user.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoreHorizontal className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectedUser(user)}>
              <Eye className="mr-2 h-4 w-4" />
              Vizualizează
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleRoleChange(user.id, 'admin')}
              disabled={user.roles?.includes('admin')}
            >
              <Shield className="mr-2 h-4 w-4" />
              Fă admin
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleRoleChange(user.id, 'moderator')}
              disabled={user.roles?.includes('moderator')}
            >
              Fă moderator
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleRoleChange(user.id, 'user')}
              disabled={user.roles?.length === 1 && user.roles[0] === 'user'}
            >
              Fă utilizator
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className={user.isBlocked ? '' : 'text-destructive'}
              onClick={() => setBlockConfirm(user)}
            >
              {user.isBlocked ? (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Deblochează
                </>
              ) : (
                <>
                  <ShieldOff className="mr-2 h-4 w-4" />
                  Blochează
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Utilizatori</h1>
        <p className="text-muted-foreground">
          Gestionează utilizatorii și permisiunile
        </p>
      </div>

      {/* Tabel */}
      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        searchPlaceholder="Caută după nume sau email..."
        searchValue={search}
        onSearchChange={setSearch}
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        onLimitChange={(limit) =>
          setPagination((prev) => ({ ...prev, limit, page: 1 }))
        }
        emptyMessage="Nu există utilizatori"
      />

      {/* Dialog detalii utilizator */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalii utilizator</DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nume</p>
                  <p className="font-medium">{selectedUser.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Înregistrat</p>
                  <p className="font-medium">
                    {format(new Date(selectedUser.createdAt), 'dd MMMM yyyy', {
                      locale: ro,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rol</p>
                  {(() => {
                    const primaryRole = selectedUser.roles?.[0] || 'user';
                    return (
                      <Badge variant={roleLabels[primaryRole]?.variant || 'outline'}>
                        {roleLabels[primaryRole]?.label || primaryRole}
                      </Badge>
                    );
                  })()}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    variant={selectedUser.isBlocked ? 'destructive' : 'secondary'}
                  >
                    {selectedUser.isBlocked ? 'Blocat' : 'Activ'}
                  </Badge>
                </div>
              </div>

              {selectedUser.ordersCount !== undefined && (
                <div className="rounded-lg border border-border p-4">
                  <p className="text-sm text-muted-foreground">Total comenzi</p>
                  <p className="text-2xl font-bold">{selectedUser.ordersCount}</p>
                </div>
              )}
              {selectedUser.pointsBalance !== undefined && (
                <PointsBalance points={selectedUser.pointsBalance} />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog confirmare blocare */}
      <Dialog open={!!blockConfirm} onOpenChange={() => setBlockConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {blockConfirm?.isBlocked ? 'Deblochează utilizator' : 'Blochează utilizator'}
            </DialogTitle>
            <DialogDescription>
              {blockConfirm?.isBlocked
                ? `Ești sigur că vrei să deblochezi utilizatorul "${blockConfirm?.name}"?`
                : `Ești sigur că vrei să blochezi utilizatorul "${blockConfirm?.name}"? Nu va mai putea accesa contul.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockConfirm(null)} disabled={!!isUpdating}>
              Anulează
            </Button>
            <Button
              variant={blockConfirm?.isBlocked ? 'default' : 'destructive'}
              onClick={handleToggleBlock}
              disabled={!!isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se procesează...
                </>
              ) : (
                blockConfirm?.isBlocked ? 'Deblochează' : 'Blochează'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
