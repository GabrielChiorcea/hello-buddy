/**
 * Pagina Puncte loialitate - Admin
 * Configurare praguri puncte / reducere
 * Plugin: plugins/points
 */

import { useEffect, useState, useCallback } from 'react';
import { useAdminApi } from '@/admin/hooks/useAdminApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Gift, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { PointsReward } from '../types';

interface PointsRewardWithId extends PointsReward {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminPoints() {
  const { getPointsRewards, createPointsReward, updatePointsReward, deletePointsReward } =
    useAdminApi();
  const [rewards, setRewards] = useState<PointsRewardWithId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingReward, setEditingReward] = useState<PointsRewardWithId | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ pointsCost: 10, discountAmount: 5 });

  const fetchRewards = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPointsRewards(true);
      setRewards(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Eroare la încărcarea pragmatic:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca pragmatic de puncte',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [getPointsRewards]);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  const handleCreate = async () => {
    if (formData.pointsCost < 1 || formData.discountAmount < 0) {
      toast({
        title: 'Date invalide',
        description: 'Punctele și reducerea trebuie să fie numere pozitive.',
        variant: 'destructive',
      });
      return;
    }
    setIsSaving(true);
    try {
      await createPointsReward(formData);
      toast({ title: 'Prag creat cu succes' });
      setShowCreate(false);
      setFormData({ pointsCost: 10, discountAmount: 5 });
      fetchRewards();
    } catch (error) {
      toast({
        title: 'Eroare',
        description: error instanceof Error ? error.message : 'Nu s-a putut crea pragul',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingReward) return;
    if (formData.pointsCost < 1 || formData.discountAmount < 0) {
      toast({
        title: 'Date invalide',
        variant: 'destructive',
      });
      return;
    }
    setIsSaving(true);
    try {
      await updatePointsReward(editingReward.id, formData);
      toast({ title: 'Prag actualizat' });
      setEditingReward(null);
      fetchRewards();
    } catch (error) {
      toast({
        title: 'Eroare',
        description: error instanceof Error ? error.message : 'Nu s-a putut actualiza',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePointsReward(id);
      toast({ title: 'Prag dezactivat' });
      fetchRewards();
    } catch (error) {
      toast({
        title: 'Eroare',
        description: error instanceof Error ? error.message : 'Nu s-a putut dezactiva',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Puncte loialitate</h1>
          <p className="text-muted-foreground">
            Configurează pragmatic de puncte pentru reduceri la checkout
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Prag nou
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Praguri actuale
          </CardTitle>
          <CardDescription>
            Exemplu: 10 puncte = 5 RON reducere. Utilizatorii pot folosi punctele la checkout.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rewards.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              Nu există pragmatic configurate. Adaugă un prag nou.
            </p>
          ) : (
            <div className="space-y-3">
              {rewards.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-medium">
                      {r.pointsCost} puncte = {r.discountAmount} RON reducere
                    </span>
                    {!r.isActive && (
                      <span className="text-xs text-muted-foreground">(dezactivat)</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingReward(r);
                        setFormData({ pointsCost: r.pointsCost, discountAmount: r.discountAmount });
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(r.id)}
                      disabled={!r.isActive}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog creare */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prag nou</DialogTitle>
            <DialogDescription>
              Definește câte puncte costă și câtă reducere oferește
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Puncte necesare</Label>
              <Input
                type="number"
                min={1}
                value={formData.pointsCost}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, pointsCost: parseInt(e.target.value) || 0 }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Reducere (RON)</Label>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={formData.discountAmount}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, discountAmount: parseFloat(e.target.value) || 0 }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Anulează
            </Button>
            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Creează'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog editare */}
      <Dialog open={!!editingReward} onOpenChange={() => setEditingReward(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editează prag</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Puncte necesare</Label>
              <Input
                type="number"
                min={1}
                value={formData.pointsCost}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, pointsCost: parseInt(e.target.value) || 0 }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Reducere (RON)</Label>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={formData.discountAmount}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, discountAmount: parseFloat(e.target.value) || 0 }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingReward(null)}>
              Anulează
            </Button>
            <Button onClick={handleUpdate} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvează'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
