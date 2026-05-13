import { useEffect, useMemo, useRef, useState } from 'react';
import { useAdminApi } from '@/admin/hooks/useAdminApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getImageUrl } from '@/lib/imageUrl';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ToastType = 'points' | 'coupons_active' | 'streak' | 'text_simple';

interface GamificationToastItem {
  id: string;
  type: ToastType;
  text: string;
  couponsActiveTitle?: string;
  couponsInactiveTitle?: string;
  image?: string;
  streakInactiveText?: string;
  pointsLoggedOutText?: string;
  couponsLoggedOutText?: string;
  streakLoggedOutText?: string;
  textSimpleLoggedOutText?: string;
  intervalMs: number;
  durationMs: number;
  isActive: boolean;
  createdAt: string;
}

interface CreateFormState {
  type: ToastType;
  text: string;
  couponsActiveTitle: string;
  couponsInactiveTitle: string;
  image: string;
  streakInactiveText: string;
  pointsLoggedOutText: string;
  couponsLoggedOutText: string;
  streakLoggedOutText: string;
  textSimpleLoggedOutText: string;
  intervalMs: string;
  durationMs: string;
}

const DEFAULT_TEXT = 'Ai {puncte_amount} foloseste si ia reduceri';
const DEFAULT_STREAK_TEXT = 'Continua streak-ul si castiga bonusuri';
const DEFAULT_POINTS_LOGGED_OUT_TEXT = 'Logheaza-te si castiga puncte la fiecare comanda';
const DEFAULT_COUPONS_LOGGED_OUT_TEXT = 'Logheaza-te ca sa primesti cupoane personalizate';
const DEFAULT_STREAK_LOGGED_OUT_TEXT = 'Logheaza-te si incepe streak-ul pentru bonusuri';
const DEFAULT_TEXT_SIMPLE_LOGGED_OUT_TEXT = '';
const DEFAULT_COUPONS_ACTIVE_TITLE = 'Cupoanele tale active';
const DEFAULT_COUPONS_INACTIVE_TITLE = 'Activeaza primul tau cupon';

function parseToastItems(raw: unknown): GamificationToastItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => item && typeof item === 'object')
    .map((item) => {
      const entry = item as Record<string, unknown>;
      return {
        id: typeof entry.id === 'string' ? entry.id : `toast-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        type: (entry.type ?? 'points') as ToastType,
        text:
          typeof entry.text === 'string'
            ? entry.text
            : entry.type === 'text_simple'
              ? 'Mesaj toast'
              : entry.type === 'streak'
                ? ''
                : DEFAULT_TEXT,
        couponsActiveTitle:
          typeof entry.couponsActiveTitle === 'string' ? entry.couponsActiveTitle : DEFAULT_COUPONS_ACTIVE_TITLE,
        couponsInactiveTitle:
          typeof entry.couponsInactiveTitle === 'string' ? entry.couponsInactiveTitle : DEFAULT_COUPONS_INACTIVE_TITLE,
        image: typeof entry.image === 'string' ? entry.image : '',
        streakInactiveText: typeof entry.streakInactiveText === 'string' ? entry.streakInactiveText : '',
        pointsLoggedOutText:
          typeof entry.pointsLoggedOutText === 'string' ? entry.pointsLoggedOutText : '',
        couponsLoggedOutText:
          typeof entry.couponsLoggedOutText === 'string' ? entry.couponsLoggedOutText : '',
        streakLoggedOutText:
          typeof entry.streakLoggedOutText === 'string' ? entry.streakLoggedOutText : '',
        textSimpleLoggedOutText:
          typeof entry.textSimpleLoggedOutText === 'string' ? entry.textSimpleLoggedOutText : '',
        intervalMs: Number.isFinite(Number(entry.intervalMs)) ? Number(entry.intervalMs) : 120000,
        durationMs: Number.isFinite(Number(entry.durationMs)) ? Number(entry.durationMs) : 5000,
        isActive: entry.isActive !== false,
        createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : new Date().toISOString(),
      };
    });
}

function makeToastId(): string {
  return `toast-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function getInitialForm(): CreateFormState {
  return {
    type: 'points',
    text: DEFAULT_TEXT,
    couponsActiveTitle: DEFAULT_COUPONS_ACTIVE_TITLE,
    couponsInactiveTitle: DEFAULT_COUPONS_INACTIVE_TITLE,
    image: '',
    streakInactiveText: DEFAULT_STREAK_TEXT,
    pointsLoggedOutText: DEFAULT_POINTS_LOGGED_OUT_TEXT,
    couponsLoggedOutText: DEFAULT_COUPONS_LOGGED_OUT_TEXT,
    streakLoggedOutText: DEFAULT_STREAK_LOGGED_OUT_TEXT,
    textSimpleLoggedOutText: DEFAULT_TEXT_SIMPLE_LOGGED_OUT_TEXT,
    intervalMs: '120000',
    durationMs: '5000',
  };
}

export default function AdminGamificationToasts() {
  const { getGamificationToasts, updateGamificationToasts, uploadImage } = useAdminApi();
  const { toast } = useToast();

  const [items, setItems] = useState<GamificationToastItem[]>([]);
  const [createForm, setCreateForm] = useState<CreateFormState>(getInitialForm());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getGamificationToasts();
        const nextItems = parseToastItems(data.items ?? []);
        setItems(nextItems);
      } catch {
        toast({
          title: 'Eroare',
          description: 'Nu s-au putut incarca setarile pentru gamification toasts.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [getGamificationToasts, toast]);

  const persistItems = async (nextItems: GamificationToastItem[]) => {
    await updateGamificationToasts(nextItems);
    setItems(nextItems);
  };

  const handleUploadForCreate = async (file?: File) => {
    if (!file) return;
    try {
      setIsUploading(true);
      const imageUrl = await uploadImage(file);
      setCreateForm((prev) => ({ ...prev, image: imageUrl }));
      toast({ title: 'Imagine incarcata' });
    } catch (error) {
      toast({
        title: 'Eroare',
        description: error instanceof Error ? error.message : 'Nu s-a putut incarca imaginea.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreate = async () => {
    const intervalMs = parseInt(createForm.intervalMs, 10);
    const durationMs = parseInt(createForm.durationMs, 10);
    if (Number.isNaN(intervalMs) || intervalMs <= 0 || Number.isNaN(durationMs) || durationMs <= 0) {
      toast({
        title: 'Date invalide',
        description: 'Intervalul si durata trebuie sa fie numere intregi mai mari ca 0.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const nextItems = [
        {
          id: makeToastId(),
          type: createForm.type,
          text:
            createForm.type === 'points'
              ? createForm.text.trim() || DEFAULT_TEXT
              : createForm.type === 'text_simple'
                ? createForm.text.trim() || 'Mesaj toast'
                : '',
          couponsActiveTitle:
            createForm.type === 'coupons_active'
              ? createForm.couponsActiveTitle.trim() || DEFAULT_COUPONS_ACTIVE_TITLE
              : '',
          couponsInactiveTitle:
            createForm.type === 'coupons_active'
              ? createForm.couponsInactiveTitle.trim() || DEFAULT_COUPONS_INACTIVE_TITLE
              : '',
          image: createForm.image,
          streakInactiveText:
            createForm.type === 'streak' ? (createForm.streakInactiveText.trim() || DEFAULT_STREAK_TEXT) : '',
          pointsLoggedOutText:
            createForm.type === 'points' ? createForm.pointsLoggedOutText.trim() : '',
          couponsLoggedOutText:
            createForm.type === 'coupons_active' ? createForm.couponsLoggedOutText.trim() : '',
          streakLoggedOutText:
            createForm.type === 'streak' ? createForm.streakLoggedOutText.trim() : '',
          textSimpleLoggedOutText: '',
          intervalMs,
          durationMs,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        ...items,
      ];
      await persistItems(nextItems);
      setCreateForm(getInitialForm());
      toast({
        title: 'Toast creat',
        description: 'Toast-ul a fost adaugat in lista de toast-uri active.',
      });
      setActiveTab('list');
    } catch (error) {
      toast({
        title: 'Eroare',
        description: error instanceof Error ? error.message : 'Nu s-au putut salva setarile.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const activeCount = useMemo(() => items.filter((item) => item.isActive).length, [items]);

  const toggleItem = async (id: string, isActive: boolean) => {
    const nextItems = items.map((item) => (item.id === id ? { ...item, isActive } : item));
    setIsSaving(true);
    try {
      await persistItems(nextItems);
      toast({ title: isActive ? 'Toast activat' : 'Toast dezactivat' });
    } catch (error) {
      toast({
        title: 'Eroare',
        description: error instanceof Error ? error.message : 'Nu s-a putut actualiza starea toast-ului.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    const nextItems = items.filter((item) => item.id !== id);
    setIsSaving(true);
    try {
      await persistItems(nextItems);
      toast({ title: 'Toast sters' });
    } catch (error) {
      toast({
        title: 'Eroare',
        description: error instanceof Error ? error.message : 'Nu s-a putut sterge toast-ul.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="py-10 text-sm text-muted-foreground">Se incarca setarile...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gamification Toasts</h1>
          <p className="text-muted-foreground">Creeaza toast-uri points, cupoane active, streak si text simplu.</p>
        </div>
        <div className="text-sm text-muted-foreground">
          Active: <span className="font-medium text-foreground">{activeCount}</span> / {items.length}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'create' | 'list')}>
        <TabsList>
          <TabsTrigger value="create">Creare Toast</TabsTrigger>
          <TabsTrigger value="list">Toast-uri active</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Toast nou</CardTitle>
              <CardDescription>Tipurile dinamice folosesc datele user-ului din frontend.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="toast-type">Tip toast</Label>
                <select
                  id="toast-type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={createForm.type}
                  onChange={(e) => {
                    const nextType = e.target.value as ToastType;
                    setCreateForm((prev) => ({
                      ...prev,
                      type: nextType,
                      text:
                        nextType === 'points'
                          ? DEFAULT_TEXT
                          : nextType === 'text_simple'
                            ? ''
                            : prev.text,
                    }));
                  }}
                >
                  <option value="points">Puncte</option>
                  <option value="coupons_active">Cupoane active</option>
                  <option value="streak">Streak</option>
                  <option value="text_simple">Text simplu</option>
                </select>
              </div>

              {createForm.type === 'points' && (
                <div className="space-y-2">
                  <Label htmlFor="toast-text">Text template</Label>
                  <Input
                    id="toast-text"
                    value={createForm.text}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, text: e.target.value }))}
                    placeholder="Ai {puncte_amount} foloseste si ia reduceri"
                  />
                </div>
              )}

              {createForm.type === 'points' && (
                <div className="space-y-2">
                  <Label htmlFor="points-logged-out-text">Text pentru user nelogat</Label>
                  <Input
                    id="points-logged-out-text"
                    value={createForm.pointsLoggedOutText}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, pointsLoggedOutText: e.target.value }))}
                    placeholder={DEFAULT_POINTS_LOGGED_OUT_TEXT}
                  />
                  <p className="text-xs text-muted-foreground">Daca este gol, toast-ul nu apare userilor nelogati.</p>
                </div>
              )}

              {createForm.type === 'coupons_active' && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="coupons-active-title">Titlu cand userul are cupoane</Label>
                      <Input
                        id="coupons-active-title"
                        value={createForm.couponsActiveTitle}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, couponsActiveTitle: e.target.value }))}
                        placeholder={DEFAULT_COUPONS_ACTIVE_TITLE}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="coupons-inactive-title">Titlu cand userul nu are cupoane</Label>
                      <Input
                        id="coupons-inactive-title"
                        value={createForm.couponsInactiveTitle}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, couponsInactiveTitle: e.target.value }))}
                        placeholder={DEFAULT_COUPONS_INACTIVE_TITLE}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coupons-logged-out-text">Text pentru user nelogat</Label>
                    <Input
                      id="coupons-logged-out-text"
                      value={createForm.couponsLoggedOutText}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, couponsLoggedOutText: e.target.value }))}
                      placeholder={DEFAULT_COUPONS_LOGGED_OUT_TEXT}
                    />
                    <p className="text-xs text-muted-foreground">Daca este gol, toast-ul nu apare userilor nelogati.</p>
                  </div>
                </>
              )}

              {createForm.type === 'streak' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="streak-inactive-text">Text streak inactiv (user logat)</Label>
                    <Input
                      id="streak-inactive-text"
                      value={createForm.streakInactiveText}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, streakInactiveText: e.target.value }))}
                      placeholder="Incepe un streak pentru bonusuri"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="streak-logged-out-text">Text pentru user nelogat</Label>
                    <Input
                      id="streak-logged-out-text"
                      value={createForm.streakLoggedOutText}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, streakLoggedOutText: e.target.value }))}
                      placeholder={DEFAULT_STREAK_LOGGED_OUT_TEXT}
                    />
                  </div>
                </div>
              )}

              {createForm.type === 'text_simple' && (
                <div className="space-y-2">
                  <Label htmlFor="text-simple-text">Text</Label>
                  <Input
                    id="text-simple-text"
                    value={createForm.text}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, text: e.target.value }))}
                    placeholder="Mesaj toast"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Imagine reprezentativa</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void handleUploadForCreate(e.target.files?.[0])}
                />
                <div className="flex items-center gap-4">
                  <div className="h-24 w-40 overflow-hidden rounded-md border bg-muted">
                    {createForm.image ? (
                      <img
                        src={getImageUrl(createForm.image)}
                        alt={
                          createForm.type === 'coupons_active'
                            ? 'Preview toast cupoane'
                            : createForm.type === 'streak'
                              ? 'Preview toast streak'
                              : createForm.type === 'text_simple'
                                ? 'Preview toast text simplu'
                                : 'Preview toast puncte'
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">Fara imagine</div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                      {isUploading ? 'Se incarca...' : 'Incarca imagine'}
                    </Button>
                    {createForm.image && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setCreateForm((prev) => ({ ...prev, image: '' }))}
                      >
                        Sterge imaginea
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="toast-interval">Apare la fiecare (ms)</Label>
                  <Input
                    id="toast-interval"
                    type="number"
                    min={1}
                    step={1}
                    value={createForm.intervalMs}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, intervalMs: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toast-duration">Sta afisat (ms)</Label>
                  <Input
                    id="toast-duration"
                    type="number"
                    min={1}
                    step={1}
                    value={createForm.durationMs}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, durationMs: e.target.value }))}
                  />
                </div>
              </div>

              <Button onClick={handleCreate} disabled={isSaving}>
                {isSaving ? 'Se salveaza...' : 'Creeaza Toast'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Lista Toast-uri</CardTitle>
              <CardDescription>Activeaza, dezactiveaza sau sterge toast-urile create.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nu exista toast-uri create inca.</p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3">
                        <div className="h-14 w-20 overflow-hidden rounded border bg-muted">
                          {item.image ? <img src={getImageUrl(item.image)} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full" />}
                        </div>
                        <div className="space-y-1">
                          {(item.type === 'points' || item.type === 'text_simple') && (
                            <p className="text-sm font-medium">{item.text}</p>
                          )}
                          {item.type === 'points' && (
                            <p className="text-xs text-muted-foreground">
                              Text nelogat: {item.pointsLoggedOutText
                                ? item.pointsLoggedOutText
                                : <span className="italic">(necompletat - toast ascuns userilor nelogati)</span>}
                            </p>
                          )}
                          {item.type === 'streak' && (
                            <>
                              <p className="text-xs text-muted-foreground">
                                Text inactiv (logat): {item.streakInactiveText || DEFAULT_STREAK_TEXT}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Text nelogat: {item.streakLoggedOutText
                                  ? item.streakLoggedOutText
                                  : <span className="italic">(necompletat - toast ascuns userilor nelogati)</span>}
                              </p>
                            </>
                          )}
                          {item.type === 'coupons_active' && (
                            <>
                              <p className="text-xs text-muted-foreground">
                                Titluri: "{item.couponsActiveTitle || DEFAULT_COUPONS_ACTIVE_TITLE}" / "
                                {item.couponsInactiveTitle || DEFAULT_COUPONS_INACTIVE_TITLE}"
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Text nelogat: {item.couponsLoggedOutText
                                  ? item.couponsLoggedOutText
                                  : <span className="italic">(necompletat - toast ascuns userilor nelogati)</span>}
                              </p>
                            </>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Tip: {item.type} | Interval: {item.intervalMs}ms | Durata: {item.durationMs}ms
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={item.isActive} onCheckedChange={(checked) => void toggleItem(item.id, checked)} disabled={isSaving} />
                        <Button variant="destructive" size="sm" onClick={() => void deleteItem(item.id)} disabled={isSaving}>
                          Sterge
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
