/**
 * =============================================================================
 * PAGINA SETĂRI ADMIN
 * =============================================================================
 */

import { useEffect, useState } from 'react';
import { useAdminApi } from '@/admin/hooks/useAdminApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Save, Loader2 } from 'lucide-react';
import { AppSettings } from '@/types/admin';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

// Date mock
const mockSettings: AppSettings = {
  deliveryFee: 10,
  minOrderAmount: 30,
  openingHours: '10:00',
  closingHours: '22:00',
  isOpen: true,
  maintenanceMode: false,
  contactEmail: 'contact@foodorder.com',
  contactPhone: '0800 123 456',
};

export default function AdminSettings() {
  const { getSettings, updateSettings } = useAdminApi();
  const { toast } = useToast();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setSettings(mockSettings);
    } catch (error) {
      console.error('Eroare la încărcarea setărilor:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setIsSaving(true);
    try {
      // În producție: await updateSettings(settings);
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log('Salvare setări:', settings);
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

      {/* Setări livrare */}
      <Card>
        <CardHeader>
          <CardTitle>Livrare</CardTitle>
          <CardDescription>
            Configurează taxele și condițiile de livrare
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="deliveryFee">Taxă livrare (RON)</Label>
              <Input
                id="deliveryFee"
                type="number"
                value={settings.deliveryFee}
                onChange={(e) =>
                  setSettings((prev) =>
                    prev ? { ...prev, deliveryFee: Number(e.target.value) } : prev
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minOrder">Comandă minimă (RON)</Label>
              <Input
                id="minOrder"
                type="number"
                value={settings.minOrderAmount}
                onChange={(e) =>
                  setSettings((prev) =>
                    prev ? { ...prev, minOrderAmount: Number(e.target.value) } : prev
                  )
                }
              />
            </div>
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
              <Label htmlFor="openingHours">Ora deschidere</Label>
              <Input
                id="openingHours"
                type="time"
                value={settings.openingHours}
                onChange={(e) =>
                  setSettings((prev) =>
                    prev ? { ...prev, openingHours: e.target.value } : prev
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="closingHours">Ora închidere</Label>
              <Input
                id="closingHours"
                type="time"
                value={settings.closingHours}
                onChange={(e) =>
                  setSettings((prev) =>
                    prev ? { ...prev, closingHours: e.target.value } : prev
                  )
                }
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Restaurantul este deschis</Label>
              <p className="text-sm text-muted-foreground">
                Dezactivează pentru a opri temporar comenzile
              </p>
            </div>
            <Switch
              checked={settings.isOpen}
              onCheckedChange={(checked) =>
                setSettings((prev) =>
                  prev ? { ...prev, isOpen: checked } : prev
                )
              }
            />
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
                value={settings.contactEmail}
                onChange={(e) =>
                  setSettings((prev) =>
                    prev ? { ...prev, contactEmail: e.target.value } : prev
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Telefon contact</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={settings.contactPhone}
                onChange={(e) =>
                  setSettings((prev) =>
                    prev ? { ...prev, contactPhone: e.target.value } : prev
                  )
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mod întreținere */}
      <Card>
        <CardHeader>
          <CardTitle>Mentenanță</CardTitle>
          <CardDescription>
            Opțiuni pentru modul de întreținere
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label>Mod întreținere</Label>
              <p className="text-sm text-muted-foreground">
                Activează pentru a afișa o pagină de mentenanță utilizatorilor
              </p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) =>
                setSettings((prev) =>
                  prev ? { ...prev, maintenanceMode: checked } : prev
                )
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
