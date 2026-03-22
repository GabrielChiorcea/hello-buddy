/**
 * Admin page for streak campaigns V2 — motor de reguli complet
 * Plugin: plugins/streak
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAdminApi } from '@/admin/hooks/useAdminApi';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Flame, Plus, Pencil, Trash2, Loader2, Users, Gift, Clock, Shield, ImageIcon, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { StreakCampaign, RecurrenceType, RewardType, ResetType, RewardStep } from '../types';

const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  consecutive: 'Zile consecutive (Streak clasic)',
  rolling: 'Fereastră mobilă (Rolling)',
};

const REWARD_LABELS: Record<RewardType, string> = {
  single: 'Prag unic (All or Nothing)',
  steps: 'Praguri incrementale (Scăriță)',
  multiplier: 'Multiplicator de streak',
};

const RESET_LABELS: Record<ResetType, string> = {
  hard: 'Hard Reset (la 0)',
  soft_decay: 'Soft Decay (pierde 1 nivel)',
};

function isCampaignActive(c: StreakCampaign): boolean {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const start = String(c.startDate).slice(0, 10);
  const end = String(c.endDate).slice(0, 10);
  return start <= today && end >= today;
}

interface FormData {
  name: string;
  recurrenceType: RecurrenceType;
  rollingWindowDays: number;
  ordersRequired: number;
  bonusPoints: number;
  rewardType: RewardType;
  baseMultiplier: number;
  multiplierIncrement: number;
  customText: string;
  startDate: string;
  endDate: string;
  resetType: ResetType;
  minOrderValue: number;
  rewardSteps: RewardStep[];
}

const defaultForm: FormData = {
  name: '',
  recurrenceType: 'consecutive',
  rollingWindowDays: 7,
  ordersRequired: 3,
  bonusPoints: 50,
  rewardType: 'single',
  baseMultiplier: 1,
  multiplierIncrement: 0.5,
  customText: '',
  startDate: '',
  endDate: '',
  resetType: 'hard',
  minOrderValue: 0,
  rewardSteps: [],
};

export default function AdminStreakCampaigns() {
  const { enabled: streakEnabled, loading: flagLoading } = usePluginEnabled('streak');
  const {
    getStreakCampaigns,
    createStreakCampaign,
    updateStreakCampaign,
    deleteStreakCampaign,
    getStreakCampaignEnrollments,
    getSettings,
    updateSettings,
    uploadImage,
  } = useAdminApi();

  const [campaigns, setCampaigns] = useState<StreakCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<StreakCampaign | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<StreakCampaign | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<FormData>(defaultForm);

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<Array<{
    id: string;
    userId: string;
    campaignId: string;
    joinedAt: string;
    currentStreakCount: number;
    currentLevel: number;
    completedAt: string | null;
    userName: string;
    userEmail: string;
  }>>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);

  // Home card image config
  const [homeCardImage, setHomeCardImage] = useState<string>('');
  const [homeCardImageSaving, setHomeCardImageSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getStreakCampaigns();
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({ title: 'Eroare', description: 'Nu s-au putut încărca campaniile', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [getStreakCampaigns]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Fetch home card image from settings
  useEffect(() => {
    (async () => {
      try {
        const settings = await getSettings() as Record<string, { value: string }>;
        const img = settings?.streak_home_card_image?.value;
        if (img) setHomeCardImage(img);
      } catch { /* ignore */ }
    })();
  }, [getSettings]);

  const handleHomeCardImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHomeCardImageSaving(true);
    try {
      const url = await uploadImage(file);
      await updateSettings({ streak_home_card_image: url });
      setHomeCardImage(url);
      toast({ title: 'Imagine salvată' });
    } catch {
      toast({ title: 'Eroare', description: 'Nu s-a putut salva imaginea', variant: 'destructive' });
    } finally {
      setHomeCardImageSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [uploadImage, updateSettings]);

  const fetchEnrollments = useCallback(
    async (campaignId: string) => {
      setEnrollmentsLoading(true);
      try {
        const data = await getStreakCampaignEnrollments(campaignId);
        setEnrollments(Array.isArray(data) ? data : []);
      } catch {
        toast({ title: 'Eroare', description: 'Nu s-au putut încărca înscrierile', variant: 'destructive' });
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
      recurrenceType: c.recurrenceType,
      rollingWindowDays: c.rollingWindowDays,
      ordersRequired: c.ordersRequired,
      bonusPoints: c.bonusPoints,
      rewardType: c.rewardType,
      baseMultiplier: c.baseMultiplier,
      multiplierIncrement: c.multiplierIncrement,
      customText: c.customText ?? '',
      startDate: c.startDate,
      endDate: c.endDate,
      resetType: c.resetType,
      minOrderValue: c.minOrderValue,
      rewardSteps: c.rewardSteps ?? [],
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

  // Reward steps helpers
  const addRewardStep = () => {
    const nextStep = formData.rewardSteps.length + 1;
    setFormData((p) => ({
      ...p,
      rewardSteps: [...p.rewardSteps, { stepNumber: nextStep, pointsAwarded: 10, label: null }],
    }));
  };

  const updateRewardStep = (index: number, field: keyof RewardStep, value: any) => {
    setFormData((p) => ({
      ...p,
      rewardSteps: p.rewardSteps.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }));
  };

  const removeRewardStep = (index: number) => {
    setFormData((p) => ({
      ...p,
      rewardSteps: p.rewardSteps.filter((_, i) => i !== index).map((s, i) => ({ ...s, stepNumber: i + 1 })),
    }));
  };

  if (flagLoading) return null;
  if (!streakEnabled) return <Navigate to="/admin" replace />;

  const isActive = !!editingCampaign && isCampaignActive(editingCampaign);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flame className="h-7 w-7 text-primary" />
            Campanii Streak V2
          </h1>
          <p className="text-muted-foreground">Motor de gamificare complet: recurență, praguri, validare, resetare</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Campanie nouă
        </Button>
      </div>

      {/* Campaign list */}
      <Card>
        <CardHeader>
          <CardTitle>Campanii</CardTitle>
          <CardDescription>Campaniile active nu pot fi editate sau șterse.</CardDescription>
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
                    <div className="text-sm text-muted-foreground flex flex-wrap gap-x-2 gap-y-1">
                      <span>{RECURRENCE_LABELS[c.recurrenceType]}</span>
                      <span>· {c.ordersRequired} comenzi</span>
                      <span>· {c.bonusPoints} puncte</span>
                      <span>· {REWARD_LABELS[c.rewardType]}</span>
                      <span>· {c.startDate} – {c.endDate}</span>
                      {c.minOrderValue > 0 && <span>· Min. {c.minOrderValue} RON</span>}
                      
                      {c.resetType === 'soft_decay' && <span className="text-blue-500">· Soft Decay</span>}
                      {isCampaignActive(c) && (
                        <span className="text-primary font-medium">· Activă</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(c)}
                      disabled={isCampaignActive(c)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteConfirm(c)}
                      disabled={isCampaignActive(c)}
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

      {/* Home Card Image Config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Imagine card Home
          </CardTitle>
          <CardDescription>
            Imaginea afișată pe cardul streak din pagina Home. Recomandare: 400×200px, format landscape.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {homeCardImage ? (
              <div className="relative w-40 h-20 rounded-lg overflow-hidden border bg-muted">
                <img src={homeCardImage} alt="Streak card" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-40 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/50">
                <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
              </div>
            )}
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleHomeCardImageUpload}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={homeCardImageSaving}
              >
                {homeCardImageSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                {homeCardImage ? 'Schimbă imaginea' : 'Încarcă imagine'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enrollments */}
      {selectedCampaignId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Înscrieri
            </CardTitle>
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
                      <th className="text-right py-2">Nivel</th>
                      <th className="text-left py-2">Completat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((e) => (
                      <tr key={e.id} className="border-b">
                        <td className="py-2">{e.userName || '—'}</td>
                        <td className="py-2">{e.userEmail || '—'}</td>
                        <td className="text-right py-2">{e.currentStreakCount}</td>
                        <td className="text-right py-2">{e.currentLevel}</td>
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

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCampaign ? 'Editează campania' : 'Campanie nouă'}</DialogTitle>
            <DialogDescription>
              Configurează motorul de reguli: recurență, praguri, validare și resetare.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            {/* ─── Basic info ─── */}
            <div>
              <Label>Nume</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="ex: Streak Marathon Martie"
                disabled={isActive}
              />
            </div>
            <div>
              <Label>Text afișat clientului (opțional)</Label>
              <Textarea
                value={formData.customText}
                onChange={(e) => setFormData((p) => ({ ...p, customText: e.target.value }))}
                placeholder="ex: Comandă de 3 ori la rând și primești 50 puncte bonus"
                rows={2}
                disabled={isActive}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data start</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))}
                  disabled={isActive}
                />
              </div>
              <div>
                <Label>Data sfârșit</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  min={formData.startDate || new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))}
                  disabled={isActive}
                />
              </div>
            </div>

            {/* ─── 1. Recurență ─── */}
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                1. Recurență — Când se întâmplă?
              </h3>
              <div>
                <Label>Tip recurență</Label>
                <Select
                  value={formData.recurrenceType}
                  onValueChange={(v) => setFormData((p) => ({ ...p, recurrenceType: v as RecurrenceType }))}
                  disabled={isActive}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['consecutive', 'rolling'] as const).map((t) => (
                      <SelectItem key={t} value={t}>
                        {RECURRENCE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.recurrenceType === 'rolling' && (
                <div>
                  <Label>Fereastră (zile)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formData.rollingWindowDays}
                    onChange={(e) => setFormData((p) => ({ ...p, rollingWindowDays: parseInt(e.target.value, 10) || 7 }))}
                    disabled={isActive}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Sistemul se uită în ultimele N zile de la data curentă
                  </p>
                </div>
              )}
              <div>
                <Label>Comenzi necesare</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.ordersRequired}
                  onChange={(e) => setFormData((p) => ({ ...p, ordersRequired: parseInt(e.target.value, 10) || 1 }))}
                  disabled={isActive}
                />
              </div>
            </div>

            {/* ─── 2. Praguri / Recompense ─── */}
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                2. Praguri — Cât primește?
              </h3>
              <div>
                <Label>Tip recompensă</Label>
                <Select
                  value={formData.rewardType}
                  onValueChange={(v) => setFormData((p) => ({ ...p, rewardType: v as RewardType }))}
                  disabled={isActive}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['single', 'steps', 'multiplier'] as const).map((t) => (
                      <SelectItem key={t} value={t}>
                        {REWARD_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Puncte bonus la completare</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.bonusPoints}
                  onChange={(e) => setFormData((p) => ({ ...p, bonusPoints: parseInt(e.target.value, 10) || 0 }))}
                  disabled={isActive}
                />
              </div>

              {/* Steps */}
              {formData.rewardType === 'steps' && (
                <div className="space-y-2">
                  <Label>Pași intermediari</Label>
                  {formData.rewardSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-10">#{step.stepNumber}</span>
                      <Input
                        type="number"
                        min={0}
                        value={step.pointsAwarded}
                        onChange={(e) => updateRewardStep(i, 'pointsAwarded', parseInt(e.target.value, 10) || 0)}
                        placeholder="Puncte"
                        className="w-24"
                        disabled={isActive}
                      />
                      <Input
                        value={step.label ?? ''}
                        onChange={(e) => updateRewardStep(i, 'label', e.target.value || null)}
                        placeholder="Label (opțional)"
                        className="flex-1"
                        disabled={isActive}
                      />
                      <Button variant="ghost" size="sm" onClick={() => removeRewardStep(i)} disabled={isActive}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addRewardStep} disabled={isActive}>
                    <Plus className="h-3 w-3 mr-1" /> Adaugă pas
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    La completare se acordă și punctele bonus de mai sus. Pașii sunt recompense intermediare.
                  </p>
                </div>
              )}

              {/* Multiplier */}
              {formData.rewardType === 'multiplier' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Multiplicator bază</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min={0.1}
                      value={formData.baseMultiplier}
                      onChange={(e) => setFormData((p) => ({ ...p, baseMultiplier: parseFloat(e.target.value) || 1 }))}
                      disabled={isActive}
                    />
                  </div>
                  <div>
                    <Label>Increment per pas</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min={0}
                      value={formData.multiplierIncrement}
                      onChange={(e) => setFormData((p) => ({ ...p, multiplierIncrement: parseFloat(e.target.value) || 0 }))}
                      disabled={isActive}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground col-span-2">
                    Punctele per pas = bonusPoints × (bază + (pas-1) × increment).
                    Ex: bază 1×, increment 0.5×, pas 3 → 1+1=2× puncte
                  </p>
                </div>
              )}
            </div>

            {/* ─── 3. Validare ─── */}
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                3. Validare — Ce contează ca comandă?
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Valoare minimă comandă (RON)</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={formData.minOrderValue}
                    onChange={(e) => setFormData((p) => ({ ...p, minOrderValue: parseFloat(e.target.value) || 0 }))}
                    disabled={isActive}
                  />
                  <p className="text-xs text-muted-foreground mt-1">0 = fără limită</p>
                </div>
              </div>
            </div>

            {/* ─── 4. Resetare ─── */}
            <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Flame className="h-4 w-4 text-primary" />
                4. Resetare — Ce se întâmplă la eșec?
              </h3>
              <div>
                <Label>Tip resetare</Label>
                <Select
                  value={formData.resetType}
                  onValueChange={(v) => setFormData((p) => ({ ...p, resetType: v as ResetType }))}
                  disabled={isActive}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['hard', 'soft_decay'] as const).map((t) => (
                      <SelectItem key={t} value={t}>
                        {RESET_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.resetType === 'hard'
                    ? 'Userul pierde tot progresul dacă ratează o zi/săptămână.'
                    : 'Userul pierde doar un nivel (pas) — mai blând, menține engagement-ul.'}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Anulare
            </Button>
            <Button onClick={handleSave} disabled={isSaving || isActive}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Șterge campania?</DialogTitle>
            <DialogDescription>
              Campania „{deleteConfirm?.name}" va fi ștearsă permanent.
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
