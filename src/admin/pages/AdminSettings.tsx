/**
 * =============================================================================
 * PAGINA SETĂRI ADMIN
 * =============================================================================
 * Conectată la API-ul real GET/PUT /admin/settings
 */

import { useEffect, useState } from 'react';
import { useAdminApi } from '@/admin/hooks/useAdminApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Save, Loader2, Puzzle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Structura internă a setărilor primite de la API
 * API returnează Record<string, { value: string; description: string | null }>
 */
interface SettingsMap {
  [key: string]: { value: string; description: string | null };
}

/** Stare editabilă locală */
interface EditableSettings {
  delivery_fee: string;
  min_order_amount: string;
  free_delivery_threshold: string;
  opening_time: string;
  closing_time: string;
  contact_email: string;
  contact_phone: string;
  plugin_points_enabled: boolean;
  plugin_streak_enabled: boolean;
  plugin_welcome_bonus_enabled: boolean;
  plugin_addons_enabled: boolean;
  plugin_tiers_enabled: boolean;
  has_tables: boolean;
}

function parseSettings(map: SettingsMap): EditableSettings {
  return {
    delivery_fee: map.delivery_fee?.value ?? '10',
    min_order_amount: map.min_order_amount?.value ?? '30',
    free_delivery_threshold: map.free_delivery_threshold?.value ?? '0',
    opening_time: map.opening_time?.value ?? '10:00',
    closing_time: map.closing_time?.value ?? '22:00',
    contact_email: map.contact_email?.value ?? '',
    contact_phone: map.contact_phone?.value ?? '',
    plugin_points_enabled: (map.plugin_points_enabled?.value ?? 'true') === 'true',
    plugin_streak_enabled: (map.plugin_streak_enabled?.value ?? 'true') === 'true',
    plugin_welcome_bonus_enabled: (map.plugin_welcome_bonus_enabled?.value ?? 'true') === 'true',
    plugin_addons_enabled: (map.plugin_addons_enabled?.value ?? 'true') === 'true',
    plugin_tiers_enabled: (map.plugin_tiers_enabled?.value ?? 'true') === 'true',
    has_tables: (map.has_tables?.value ?? 'true') === 'true',
    component_style: (map.component_style?.value ?? 'gamified') as ComponentStyleName,
  };
}

export default function AdminSettings() {
  const { getSettings, updateSettings } = useAdminApi();
  const { toast } = useToast();
  const [settings, setSettings] = useState<EditableSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const data = await getSettings();
      // API returnează direct SettingsMap sau wrapped în { settings }
      const map: SettingsMap = (data as any)?.settings ?? data;
      setSettings(parseSettings(map as SettingsMap));
    } catch (error) {
      console.error('Eroare la încărcarea setărilor:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca setările.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      await updateSettings({
        delivery_fee: settings.delivery_fee,
        min_order_amount: settings.min_order_amount,
        free_delivery_threshold: settings.free_delivery_threshold,
        opening_time: settings.opening_time,
        closing_time: settings.closing_time,
        contact_email: settings.contact_email,
        contact_phone: settings.contact_phone,
        plugin_points_enabled: settings.plugin_points_enabled ? 'true' : 'false',
        plugin_streak_enabled: settings.plugin_streak_enabled ? 'true' : 'false',
        plugin_welcome_bonus_enabled: settings.plugin_welcome_bonus_enabled ? 'true' : 'false',
        plugin_addons_enabled: settings.plugin_addons_enabled ? 'true' : 'false',
        plugin_tiers_enabled: settings.plugin_tiers_enabled ? 'true' : 'false',
        has_tables: settings.has_tables ? 'true' : 'false',
        component_style: settings.component_style,
      });
      toast({
        title: 'Setări salvate',
        description: 'Modificările au fost aplicate cu succes.',
      });
    } catch (error) {
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut salva setările.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (key: keyof EditableSettings, value: string | boolean) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  if (isLoading || !settings) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Setări</h1>
          <p className="text-muted-foreground">
            Configurează opțiunile aplicației
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Se salvează...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvează modificările
            </>
          )}
        </Button>
      </div>

      {/* Setări livrare și comenzi în locație */}
      <Card>
        <CardHeader>
          <CardTitle>Livrare și comenzi în locație</CardTitle>
          <CardDescription>
            Configurează taxele, condițiile de livrare și opțiunile pentru comenzi ridicate în locație
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="deliveryFee">Taxă livrare (RON)</Label>
              <Input
                id="deliveryFee"
                type="number"
                min={0}
                value={settings.delivery_fee}
                onChange={(e) => updateField('delivery_fee', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minOrder">Comandă minimă (RON)</Label>
              <Input
                id="minOrder"
                type="number"
                min={0}
                value={settings.min_order_amount}
                onChange={(e) => updateField('min_order_amount', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="freeDelivery">Livrare gratuită de la (RON)</Label>
              <Input
                id="freeDelivery"
                type="number"
                min={0}
                value={settings.free_delivery_threshold}
                onChange={(e) => updateField('free_delivery_threshold', e.target.value)}
              />
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Locația are mese</Label>
              <p className="text-sm text-muted-foreground">
                Dacă este activat, în admin la comenzi în locație se afișează câmpul pentru număr de masă. Dezactivează pentru covrigării sau magazine fără mese.
              </p>
            </div>
            <Switch
              checked={settings.has_tables}
              onCheckedChange={(checked) => updateField('has_tables', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Program de funcționare */}
      <Card>
        <CardHeader>
          <CardTitle>Program de funcționare</CardTitle>
          <CardDescription>
            Setează orele de deschidere și închidere
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="openingTime">Ora deschidere</Label>
              <Input
                id="openingTime"
                type="time"
                value={settings.opening_time}
                onChange={(e) => updateField('opening_time', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="closingTime">Ora închidere</Label>
              <Input
                id="closingTime"
                type="time"
                value={settings.closing_time}
                onChange={(e) => updateField('closing_time', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Informații de contact</CardTitle>
          <CardDescription>
            Date de contact afișate în aplicație
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email contact</Label>
              <Input
                id="contactEmail"
                type="email"
                value={settings.contact_email}
                onChange={(e) => updateField('contact_email', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Telefon contact</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={settings.contact_phone}
                onChange={(e) => updateField('contact_phone', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stil componente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Stil componente
          </CardTitle>
          <CardDescription>
            Alege stilul vizual pentru componentele de gamificare (streak, puncte, recompense)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label>Stil vizual</Label>
            <Select value={settings.component_style} onValueChange={(v) => updateField('component_style', v)}>
              <SelectTrigger className="w-full md:w-80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(COMPONENT_STYLE_LABELS) as [ComponentStyleName, { label: string; description: string }][]).map(([key, { label, description }]) => (
                  <SelectItem key={key} value={key}>
                    <div>
                      <span className="font-medium">{label}</span>
                      <span className="text-muted-foreground ml-2 text-xs">— {description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Notă: Schimbarea stilului necesită actualizarea valorii <code className="bg-muted px-1 rounded">DEFAULT_COMPONENT_STYLE</code> în cod sau implementarea unui sistem dinamic.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Plugin-uri */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Puzzle className="h-5 w-5" />
            Plugin-uri
          </CardTitle>
          <CardDescription>
            Activează sau dezactivează module suplimentare
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label>Puncte loialitate</Label>
              <p className="text-sm text-muted-foreground">
                Permite utilizatorilor să câștige și să folosească puncte pentru reduceri la checkout
              </p>
            </div>
            <Switch
              checked={settings.plugin_points_enabled}
              onCheckedChange={(checked) => updateField('plugin_points_enabled', checked)}
            />
          </div>
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <Label>Campanii streak</Label>
              <p className="text-sm text-muted-foreground">
                Campanii de tip streak (consecutive days, days per week, working days) cu bonus puncte
              </p>
            </div>
            <Switch
              checked={settings.plugin_streak_enabled}
              onCheckedChange={(checked) => updateField('plugin_streak_enabled', checked)}
            />
          </div>
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <Label>Puncte cadou la prima autentificare</Label>
              <p className="text-sm text-muted-foreground">
                Popup „Ai câștigat X puncte” și alocare puncte la înregistrare (folosește setarea puncte cadou din plugin Puncte)
              </p>
            </div>
            <Switch
              checked={settings.plugin_welcome_bonus_enabled}
              onCheckedChange={(checked) => updateField('plugin_welcome_bonus_enabled', checked)}
            />
          </div>
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <Label>Add-on la coș</Label>
              <p className="text-sm text-muted-foreground">
                Secțiunea «Adaugă la comandă» în coș – sosuri, băuturi, desert, garnituri; pe viitor reguli per produs
              </p>
            </div>
            <Switch
              checked={settings.plugin_addons_enabled}
              onCheckedChange={(checked) => updateField('plugin_addons_enabled', checked)}
            />
          </div>
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <Label>Plugin niveluri (tiers)</Label>
              <p className="text-sm text-muted-foreground">
                Sistem de level-up bazat pe XP și multiplicator de puncte per nivel. Setările detaliate sunt pe pagina Niveluri.
              </p>
            </div>
            <Switch
              checked={settings.plugin_tiers_enabled}
              onCheckedChange={(checked) => updateField('plugin_tiers_enabled', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
