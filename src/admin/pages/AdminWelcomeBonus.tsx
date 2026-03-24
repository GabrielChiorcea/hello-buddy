/**
 * Admin – plugin bonus bun venit: număr de puncte la înregistrare.
 */

import { useCallback, useEffect, useState } from 'react';
import { useAdminApi } from '@/admin/hooks/useAdminApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfettiIcon } from '@/admin/components/ConfettiIcon';

interface SettingsMap {
  [key: string]: { value: string; description: string | null };
}

export default function AdminWelcomeBonus() {
  const { getSettings, updateSettings } = useAdminApi();
  const { toast } = useToast();
  const [pointsWelcomeBonus, setPointsWelcomeBonus] = useState('5');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSettings();
      const map: SettingsMap = (data as { settings?: SettingsMap })?.settings ?? (data as SettingsMap);
      setPointsWelcomeBonus(map.points_welcome_bonus?.value ?? '5');
    } catch {
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca setările.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [getSettings, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({ points_welcome_bonus: pointsWelcomeBonus });
      toast({
        title: 'Salvat',
        description: 'Punctele la bun venit au fost actualizate.',
      });
    } catch {
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut salva.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <ConfettiIcon className="h-6 w-6 text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Bonus bun venit</h1>
            <p className="text-muted-foreground">
              Câte puncte primește un utilizator nou la înregistrare (popup + credit în cont).
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="shrink-0">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Se salvează...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvează
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Puncte cadou</CardTitle>
          <CardDescription>
            Valoarea este folosită doar dacă sunt activate pluginurile <strong>Puncte loialitate</strong> și{' '}
            <strong>Puncte cadou la prima autentificare</strong> în Setări. 0 = fără puncte și fără popup.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="welcomePoints">Număr puncte</Label>
          <Input
            id="welcomePoints"
            type="number"
            min={0}
            step={1}
            className="max-w-[12rem]"
            value={pointsWelcomeBonus}
            onChange={(e) => setPointsWelcomeBonus(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">Exemplu: 5, 10 sau 25.</p>
        </CardContent>
      </Card>
    </div>
  );
}
