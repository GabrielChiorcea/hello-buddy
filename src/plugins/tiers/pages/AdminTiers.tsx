/**
 * Pagina Admin - Niveluri de loialitate (Tiers)
 * Include setările generale (XP, notificări) și lista de niveluri.
 */

import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminApi } from '@/admin/hooks/useAdminApi';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Loader2, Plus, Edit2, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TIER_BADGE_ICONS, getTierBadgeIcon } from '@/config/tierIcons';
import { cn } from '@/lib/utils';

interface TiersGlobalSettings {
  tiers_xp_per_ron: string;
  tiers_notify_on_level_up: boolean;
  tiers_notify_message: string;
}

const defaultTiersSettings: TiersGlobalSettings = {
  tiers_xp_per_ron: '1',
  tiers_notify_on_level_up: true,
  tiers_notify_message:
    'Felicitări! Ai ajuns la nivelul [Nume Nivel]. De acum câștigi cu [X]% mai multe puncte!',
};

function parseTiersSettings(map: Record<string, { value: string } | undefined>): TiersGlobalSettings {
  return {
    tiers_xp_per_ron: map.tiers_xp_per_ron?.value ?? defaultTiersSettings.tiers_xp_per_ron,
    tiers_notify_on_level_up:
      (map.tiers_notify_on_level_up?.value ?? 'true') === 'true',
    tiers_notify_message:
      map.tiers_notify_message?.value ?? defaultTiersSettings.tiers_notify_message,
  };
}

interface LoyaltyTier {
  id: string;
  name: string;
  xpThreshold: number;
  pointsMultiplier: number;
  badgeIcon?: string | null;
  sortOrder: number;
  benefitDescription?: string | null;
}

const emptyForm: Omit<LoyaltyTier, 'id'> = {
  name: '',
  xpThreshold: 0,
  pointsMultiplier: 1,
  badgeIcon: '',
  sortOrder: 0,
  benefitDescription: '',
};

export default function AdminTiers() {
  const { enabled: tiersEnabled, loading: flagLoading } = usePluginEnabled('tiers');
  const { getTiers, createTier, updateTier, deleteTier, getSettings, updateSettings } =
    useAdminApi();
  const { toast } = useToast();

  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<LoyaltyTier, 'id'>>(emptyForm);

  const [tiersSettings, setTiersSettings] = useState<TiersGlobalSettings>(defaultTiersSettings);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);

  useEffect(() => {
    loadTiers();
    loadTiersSettings();
  }, []);

  const loadTiersSettings = async () => {
    setSettingsLoading(true);
    try {
      const data = await getSettings();
      const map = (data as { settings?: Record<string, { value: string }> })?.settings ?? data;
      setTiersSettings(parseTiersSettings(map as Record<string, { value: string }>));
    } catch (error) {
      console.error(error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca setările de niveluri.',
        variant: 'destructive',
      });
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      await updateSettings({
        tiers_xp_per_ron: tiersSettings.tiers_xp_per_ron,
        tiers_notify_on_level_up: tiersSettings.tiers_notify_on_level_up ? 'true' : 'false',
        tiers_notify_message: tiersSettings.tiers_notify_message,
      });
      toast({ title: 'Setări salvate', description: 'Setările de niveluri au fost actualizate.' });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut salva setările.',
        variant: 'destructive',
      });
    } finally {
      setSettingsSaving(false);
    }
  };

  const loadTiers = async () => {
    setLoading(true);
    try {
      const data = await getTiers();
      setTiers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca nivelurile de loialitate.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleEdit = (tier: LoyaltyTier) => {
    setEditingId(tier.id);
    setFormData({
      name: tier.name,
      xpThreshold: tier.xpThreshold,
      pointsMultiplier: tier.pointsMultiplier,
      badgeIcon: tier.badgeIcon ?? '',
      sortOrder: tier.sortOrder,
      benefitDescription: tier.benefitDescription ?? '',
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Sigur vrei să ștergi acest nivel?')) return;
    try {
      await deleteTier(id);
      toast({ title: 'Nivel șters' });
      await loadTiers();
      if (editingId === id) resetForm();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut șterge nivelul.',
        variant: 'destructive',
      });
    }
  };

  if (flagLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tiersEnabled) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        xpThreshold: Number(formData.xpThreshold) || 0,
        pointsMultiplier: Number(formData.pointsMultiplier) || 1,
        badgeIcon: formData.badgeIcon || null,
        sortOrder:
          formData.sortOrder !== undefined && formData.sortOrder !== null && Number(formData.sortOrder) >= 0
            ? Number(formData.sortOrder)
            : Number(formData.xpThreshold) || 0,
        benefitDescription: formData.benefitDescription || null,
      };

      if (editingId) {
        await updateTier(editingId, payload);
        toast({ title: 'Nivel actualizat' });
      } else {
        await createTier(payload);
        toast({ title: 'Nivel creat' });
      }
      await loadTiers();
      resetForm();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut salva modificările.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Niveluri de loialitate</h1>
          <p className="text-muted-foreground">
            Setări generale, economie XP și lista de niveluri (praguri + multiplicatori).
          </p>
        </div>
      </div>

      {/* Setări generale - economie XP și notificări */}
      <Card>
        <CardHeader>
          <CardTitle>Setări generale</CardTitle>
          <CardDescription>
            Cum se câștigă XP la livrare (în funcție de RON cheltuiți) și notificări la level-up.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {settingsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="tiersXpPerRon">1 XP la fiecare X RON</Label>
                <Input
                  id="tiersXpPerRon"
                  type="number"
                  min={0}
                  value={tiersSettings.tiers_xp_per_ron}
                  onChange={(e) =>
                    setTiersSettings((p) => ({ ...p, tiers_xp_per_ron: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Utilizatorul primește 1 XP la fiecare X RON cheltuiți (ex: 5 = 1 XP la 5 RON). 0 = dezactivat.
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Notificare automată la level-up</Label>
                  <p className="text-sm text-muted-foreground">
                    Trimite un mesaj (email/log) când utilizatorul crește în nivel.
                  </p>
                </div>
                <Switch
                  checked={tiersSettings.tiers_notify_on_level_up}
                  onCheckedChange={(checked) =>
                    setTiersSettings((p) => ({ ...p, tiers_notify_on_level_up: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tiersNotifyMessage">Mesaj notificare level-up</Label>
                <Input
                  id="tiersNotifyMessage"
                  type="text"
                  value={tiersSettings.tiers_notify_message}
                  onChange={(e) =>
                    setTiersSettings((p) => ({ ...p, tiers_notify_message: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Variabile: [Nume Nivel], [X]%
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={settingsSaving}>
                  {settingsSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Se salvează...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvează setările
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr,1.4fr]">
        <Card>
          <CardHeader>
            <CardTitle>Lista nivelurilor</CardTitle>
            <CardDescription>
              Nivelurile sunt aplicate în funcție de XP total al utilizatorului (xpThreshold).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : tiers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Încă nu există niveluri definite. Adaugă primul nivel din formularul din dreapta.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-6 gap-2 text-xs font-medium text-muted-foreground pb-1 border-b">
                  <span>Nume</span>
                  <span>XP minim</span>
                  <span>Multiplicator</span>
                  <span>Badge</span>
                  <span>Ordine</span>
                  <span className="text-right">Acțiuni</span>
                </div>
                {tiers.map((tier) => (
                  <div
                    key={tier.id}
                    className="grid grid-cols-6 gap-2 items-center py-2 border-b last:border-b-0 text-sm"
                  >
                    <span className="font-medium">{tier.name}</span>
                    <span>{tier.xpThreshold}</span>
                    <span>x{tier.pointsMultiplier.toFixed(2)}</span>
                    <span>{getTierBadgeIcon(tier.badgeIcon)}</span>
                    <span>{tier.sortOrder}</span>
                    <span className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(tier)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(tier.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? 'Editează nivelul' : 'Adaugă nivel nou'}
            </CardTitle>
            <CardDescription>
              Setează pragul de XP și multiplicatorul pentru acest nivel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="tierName">Nume nivel</Label>
                <Input
                  id="tierName"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ex: Silver, Gold, Gourmet"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="xpThreshold">Prag XP</Label>
                  <Input
                    id="xpThreshold"
                    type="number"
                    min={0}
                    value={formData.xpThreshold}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        xpThreshold: Number(e.target.value),
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pointsMultiplier">Multiplicator puncte</Label>
                  <Input
                    id="pointsMultiplier"
                    type="number"
                    step="0.01"
                    min={1}
                    value={formData.pointsMultiplier}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        pointsMultiplier: Number(e.target.value),
                      }))
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Exemplu: 1.20 = +20% puncte față de baza globală.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Badge / Icon</Label>
                <div className="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                  {TIER_BADGE_ICONS.map((icon) => (
                    <button
                      key={icon.id}
                      type="button"
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-colors hover:bg-muted',
                        (formData.badgeIcon ?? '') === icon.id &&
                          'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                      )}
                      onClick={() => setFormData((prev) => ({ ...prev, badgeIcon: icon.id }))}
                      title={icon.label}
                    >
                      {icon.emoji}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="badgeIconCustom" className="text-xs text-muted-foreground shrink-0">
                    Sau custom (emoji sau id):
                  </Label>
                  <Input
                    id="badgeIconCustom"
                    className="h-8 max-w-[8rem]"
                    value={
                      formData.badgeIcon && !TIER_BADGE_ICONS.some((i) => i.id === (formData.badgeIcon ?? ''))
                        ? (formData.badgeIcon ?? '')
                        : ''
                    }
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, badgeIcon: e.target.value || undefined }))
                    }
                    placeholder="Ex: 🥇 sau crown-gold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortOrder">Ordine afișare (opțional)</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      sortOrder: Number(e.target.value),
                    }))
                  }
                  placeholder="Implicit se folosește pragul de XP"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="benefitDescription">Beneficiu afișat în timeline</Label>
                <Input
                  id="benefitDescription"
                  value={formData.benefitDescription ?? ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      benefitDescription: e.target.value,
                    }))
                  }
                  placeholder="Ex: Puncte x1.2"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingId !== null}
                    onCheckedChange={(checked) => {
                      if (!checked) resetForm();
                    }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {editingId ? 'Mod editare activ' : 'Creare nivel nou'}
                  </span>
                </div>
                <div className="flex gap-2">
                  {editingId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      disabled={saving}
                    >
                      Reset
                    </Button>
                  )}
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Se salvează...
                      </>
                    ) : (
                      <>
                        {editingId ? (
                          <>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Actualizează
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Adaugă nivel
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

