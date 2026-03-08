/**
 * Componentă pentru gestionarea notificărilor push din profil
 */

import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from '@/hooks/use-toast';

export function NotificationSettings() {
  const {
    isSupported,
    permission,
    isSubscribed,
    preferences,
    loading,
    subscribe,
    unsubscribe,
    updatePreferences,
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BellOff className="h-4 w-4" />
            Notificări
          </CardTitle>
          <CardDescription>
            Browserul tău nu suportă notificări push.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleEnable = async () => {
    const success = await subscribe({
      notifyOrderStatus: true,
      notifyPromotions: true,
      notifyStreakReminders: true,
    });

    if (success) {
      toast({ title: 'Notificări activate!', description: 'Vei primi notificări pe acest dispozitiv.' });
    } else if (permission === 'denied') {
      toast({
        title: 'Notificări blocate',
        description: 'Permite notificările din setările browserului.',
        variant: 'destructive',
      });
    }
  };

  const handleDisable = async () => {
    await unsubscribe();
    toast({ title: 'Notificări dezactivate' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4" />
          Notificări Push
        </CardTitle>
        <CardDescription>
          Primește notificări direct pe telefon sau în browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isSubscribed ? (
          <Button onClick={handleEnable} disabled={loading} className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
            Activează notificările
          </Button>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="notify-order" className="text-sm">
                  Status comandă
                </Label>
                <Switch
                  id="notify-order"
                  checked={preferences?.notifyOrderStatus ?? true}
                  onCheckedChange={(checked) =>
                    updatePreferences({ notifyOrderStatus: checked })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground -mt-1">
                Primește notificări când comanda ta e confirmată, în livrare sau livrată.
              </p>

              <div className="flex items-center justify-between">
                <Label htmlFor="notify-promo" className="text-sm">
                  Promoții & oferte
                </Label>
                <Switch
                  id="notify-promo"
                  checked={preferences?.notifyPromotions ?? false}
                  onCheckedChange={(checked) =>
                    updatePreferences({ notifyPromotions: checked })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground -mt-1">
                Oferte speciale, reduceri și noutăți din meniu.
              </p>

              <div className="flex items-center justify-between">
                <Label htmlFor="notify-streak" className="text-sm">
                  Reminder streak
                </Label>
                <Switch
                  id="notify-streak"
                  checked={preferences?.notifyStreakReminders ?? false}
                  onCheckedChange={(checked) =>
                    updatePreferences({ notifyStreakReminders: checked })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground -mt-1">
                Nu uita să comanzi azi pentru a-ți menține streak-ul!
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDisable}
              disabled={loading}
              className="w-full text-muted-foreground"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BellOff className="mr-2 h-4 w-4" />}
              Dezactivează notificările
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
