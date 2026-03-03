/**
 * Admin page for streak campaigns - CRUD + enrollments
 * Plugin: plugins/streak
 */

import { useEffect, useState, useCallback } from 'react';
import { useAdminApi } from '@/admin/hooks/useAdminApi';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Flame, Plus, Pencil, Trash2, Loader2, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { StreakCampaign, StreakType } from '../types';

const STREAK_TYPE_LABELS: Record<StreakType, string> = {
  consecutive_days: 'Zile consecutive',
  days_per_week: 'Zile pe săptămână',
  working_days: 'Zile lucrătoare',
};

function isCampaignActive(c: StreakCampaign): boolean {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const start = String(c.startDate).slice(0, 10);
  const end = String(c.endDate).slice(0, 10);
  return start <= today && end >= today;
}

const defaultForm = {
  name: '',
  streakType: 'consecutive_days' as StreakType,
  ordersRequired: 3,
  bonusPoints: 50,
  customText: '',
  startDate: '',
  endDate: '',
  resetOnMiss: true,
  pointsExpireAfterCampaign: false,
};

export default function AdminStreakCampaigns() {
  const { enabled: streakEnabled, loading: flagLoading } = usePluginEnabled('streak');
  const {
    getStreakCampaigns,
    createStreakCampaign,
    updateStreakCampaign,
    deleteStreakCampaign,
    getStreakCampaignEnrollments,
  } = useAdminApi();

  const [campaigns, setCampaigns] = useState<StreakCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<StreakCampaign | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<StreakCampaign | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState(defaultForm);

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<Array<{
    id: string;
    userId: string;
    campaignId: string;
    joinedAt: string;
    currentStreakCount: number;
    completedAt: string | null;
    userName: string;
    userEmail: string;
  }>>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getStreakCampaigns();
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Eroare la încărcarea campaniilor:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca campaniile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [getStreakCampaigns]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const fetchEnrollments = useCallback(
    async (campaignId: string) => {
      setEnrollmentsLoading(true);
      try {
        const data = await getStreakCampaignEnrollments(campaignId);
        setEnrollments(Array.isArray(data) ? data : []);
      } catch (error) {
        toast({
          title: 'Eroare',
          description: 'Nu s-au putut încărca înscrierile',
          variant: 'destructive',
        });
      } finally {
        setEnrollmentsLoading(false);
      }
    },
    [getStreakCampaignEnrollments]
  );

  useEffect(() => {
    if (selectedCampaignId) fetchEnrollments(selectedCampaignId);
    else setEnrollments([]);
  }, [selectedCampaignId, fetchEnrollments]);

  const openCreate = () => {
    setEditingCampaign(null);
    setFormData(defaultForm);
    setShowDialog(true);
  };

  const openEdit = (c: StreakCampaign) => {
    setEditingCampaign(c);
    setFormData({
      name: c.name,
      streakType: c.streakType,
      ordersRequired: c.ordersRequired,
      bonusPoints: c.bonusPoints,
      customText: c.customText ?? '',
      startDate: c.startDate,
      endDate: c.endDate,
      resetOnMiss: c.resetOnMiss,
      pointsExpireAfterCampaign: c.pointsExpireAfterCampaign,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Eroare', description: 'Numele este obligatoriu', variant: 'destructive' });
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      toast({ title: 'Eroare', description: 'Datele de start și sfârșit sunt obligatorii', variant: 'destructive' });
      return;
    }
    if (formData.ordersRequired < 1) {
      toast({ title: 'Eroare', description: 'Numărul de zile trebuie să fie >= 1', variant: 'destructive' });
      return;
    }
    if (formData.startDate > formData.endDate) {
      toast({ title: 'Eroare', description: 'Data de start trebuie să fie înainte de data de sfârșit', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      if (editingCampaign) {
        await updateStreakCampaign(editingCampaign.id, formData);
        toast({ title: 'Campanie actualizată' });
      } else {
        await createStreakCampaign(formData);
        toast({ title: 'Campanie creată' });
      }
      setShowDialog(false);
      fetchCampaigns();
    } catch (error) {
      toast({
        title: 'Eroare',
        description: error instanceof Error ? error.message : 'Eroare la salvare',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await deleteStreakCampaign(deleteConfirm.id);
      toast({ title: 'Campanie ștearsă' });
      setDeleteConfirm(null);
      if (selectedCampaignId === deleteConfirm.id) setSelectedCampaignId(null);
      fetchCampaigns();
    } catch (error) {
      toast({
        title: 'Eroare',
        description: error instanceof Error ? error.message : 'Eroare la ștergere',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (flagLoading) return null;
  if (!streakEnabled) return <Navigate to="/admin" replace />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flame className="h-7 w-7 text-primary" />
            Campanii Streak
          </h1>
          <p className="text-muted-foreground">Creează și gestionează campaniile de tip streak</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Campanie nouă
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campanii</CardTitle>
          <CardDescription>Lista campaniilor. Campaniile active nu pot fi editate.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground">Se încarcă...</div>
          ) : campaigns.length === 0 ? (
            <div className="text-muted-foreground py-8">Nicio campanie. Creează una nouă.</div>
          ) : (
            <div className="space-y-2">
              {campaigns.map((c) => (
                <div
                  key={c.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    selectedCampaignId === c.id ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => setSelectedCampaignId(selectedCampaignId === c.id ? null : c.id)}
                  >
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {STREAK_TYPE_LABELS[c.streakType]} · {c.ordersRequired} zile · {c.bonusPoints} puncte ·{' '}
                      {c.startDate} – {c.endDate}
                      {isCampaignActive(c) && (
                        <span className="ml-2 text-primary font-medium">Activă</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(c)}
                      disabled={isCampaignActive(c)}
                      title={isCampaignActive(c) ? 'Campania activă nu poate fi editată' : 'Editează'}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteConfirm(c)}
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

      {selectedCampaignId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Înscrieri
            </CardTitle>
            <CardDescription>
              Utilizatori înscriși la campania selectată și progresul lor
            </CardDescription>
          </CardHeader>
          <CardContent>
            {enrollmentsLoading ? (
              <div className="text-muted-foreground">Se încarcă...</div>
            ) : enrollments.length === 0 ? (
              <div className="text-muted-foreground py-4">Nicio înscriere.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Utilizator</th>
                      <th className="text-left py-2">Email</th>
                      <th className="text-right py-2">Progres</th>
                      <th className="text-left py-2">Completat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((e) => (
                      <tr key={e.id} className="border-b">
                        <td className="py-2">{e.userName || '—'}</td>
                        <td className="py-2">{e.userEmail || '—'}</td>
                        <td className="text-right py-2">{e.currentStreakCount}</td>
                        <td className="py-2">{e.completedAt ? new Date(e.completedAt).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCampaign ? 'Editează campania' : 'Campanie nouă'}</DialogTitle>
            <DialogDescription>
              {editingCampaign && isCampaignActive(editingCampaign)
                ? 'Campania activă nu poate fi editată.'
                : 'Completează setările campaniei.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Nume</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="ex: Streak săptămâna asta"
                disabled={!!editingCampaign && isCampaignActive(editingCampaign!)}
              />
            </div>
            <div>
              <Label>Tip streak</Label>
              <Select
                value={formData.streakType}
                onValueChange={(v) => setFormData((p) => ({ ...p, streakType: v as StreakType }))}
                disabled={!!editingCampaign && isCampaignActive(editingCampaign!)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['consecutive_days', 'days_per_week', 'working_days'] as const).map((t) => (
                    <SelectItem key={t} value={t}>
                      {STREAK_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Număr zile necesare</Label>
              <Input
                type="number"
                min={1}
                value={formData.ordersRequired}
                onChange={(e) => setFormData((p) => ({ ...p, ordersRequired: parseInt(e.target.value, 10) || 1 }))}
                disabled={!!editingCampaign && isCampaignActive(editingCampaign!)}
              />
            </div>
            <div>
              <Label>Puncte bonus la completare</Label>
              <Input
                type="number"
                min={0}
                value={formData.bonusPoints}
                onChange={(e) => setFormData((p) => ({ ...p, bonusPoints: parseInt(e.target.value, 10) || 0 }))}
                disabled={!!editingCampaign && isCampaignActive(editingCampaign!)}
              />
            </div>
            <div>
              <Label>Text afișat clientului (opțional)</Label>
              <Textarea
                value={formData.customText}
                onChange={(e) => setFormData((p) => ({ ...p, customText: e.target.value }))}
                placeholder="ex: Comandă de 3 ori la rând și primești 50 puncte bonus"
                rows={2}
                disabled={!!editingCampaign && isCampaignActive(editingCampaign!)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data start</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))}
                  disabled={!!editingCampaign && isCampaignActive(editingCampaign!)}
                />
              </div>
              <div>
                <Label>Data sfârșit</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))}
                  disabled={!!editingCampaign && isCampaignActive(editingCampaign!)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Resetează la o zi ratată</Label>
              <Switch
                checked={formData.resetOnMiss}
                onCheckedChange={(v) => setFormData((p) => ({ ...p, resetOnMiss: v }))}
                disabled={!!editingCampaign && isCampaignActive(editingCampaign!)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Puncte expiră după campanie (viitor)</Label>
              <Switch
                checked={formData.pointsExpireAfterCampaign}
                onCheckedChange={(v) => setFormData((p) => ({ ...p, pointsExpireAfterCampaign: v }))}
                disabled={!!editingCampaign && isCampaignActive(editingCampaign!)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Anulare
            </Button>
            <Button onClick={handleSave} disabled={isSaving || (!!editingCampaign && isCampaignActive(editingCampaign!))}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Șterge campania?</DialogTitle>
            <DialogDescription>
              Campania &quot;{deleteConfirm?.name}&quot; va fi ștearsă definitiv. Înscrierile și logurile vor fi șterse.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Anulare
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Șterge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
