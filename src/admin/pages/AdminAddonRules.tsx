/**
 * =============================================================================
 * PAGINA ADMIN – Add-ons (Basic + Avansat)
 * =============================================================================
 * Tab Basic: afișează produsele marcate isAddon (lista globală).
 * Tab Avansat: reguli „rețete” – trigger categorii, produse sugerate, interval orar, prioritate (drag/ordine).
 */

import { useEffect, useState, useCallback } from 'react';
import { useAdminApi } from '@/admin/hooks/useAdminApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save, Package, Plus, Trash2, ChevronUp, ChevronDown, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getImageUrl } from '@/lib/imageUrl';

interface AdminCategory {
  id: string;
  name: string;
  displayName: string;
}

interface AdminProduct {
  id: string;
  name: string;
  price: number;
  image?: string;
  isAddon: boolean;
  categoryId: string;
  categoryName?: string;
}

// ─── Basic Tab ───────────────────────────────────────────────────────

function BasicTab({ addonProducts }: { addonProducts: AdminProduct[] }) {
  if (addonProducts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Nu există produse marcate ca add-on. Mergi la{' '}
            <strong>Produse</strong> și marchează produsele dorite ca „Add-on la coș".
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group by category
  const grouped = new Map<string, AdminProduct[]>();
  for (const p of addonProducts) {
    const key = p.categoryName || 'Fără categorie';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(p);
  }

  return (
    <div className="space-y-6">
      <Card className="border-dashed">
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Aceste produse sunt afișate global în secțiunea „Adaugă la comandă" din coș.
              Pentru a adăuga sau elimina produse din această listă, mergi la <strong>Produse</strong> și modifică flag-ul „Add-on la coș".
            </span>
          </p>
        </CardContent>
      </Card>

      {Array.from(grouped.entries()).map(([categoryName, products]) => (
        <Card key={categoryName}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{categoryName}</CardTitle>
            <CardDescription className="text-xs">
              {products.length} {products.length === 1 ? 'produs' : 'produse'} add-on
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border"
                >
                  {product.image && (
                    <img
                      src={getImageUrl(product.image)}
                      alt={product.name}
                      className="h-10 w-10 rounded-md object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {product.price} RON
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    Add-on
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Tip pentru o regulă avansată (rețetă)
interface AdvancedRuleRow {
  id?: number;
  categoryId: string;
  addonProductId: string;
  priority: number;
  timeStart: string | null;
  timeEnd: string | null;
}

// ─── Advanced Tab (Rule Builder) ───────────────────────────────────────────

function AdvancedTab({
  categories,
  addonProducts,
  rulesFull,
  setRulesFull,
  onSave,
  saving,
  hasChanges,
  setHasChanges,
}: {
  categories: AdminCategory[];
  addonProducts: AdminProduct[];
  rulesFull: AdvancedRuleRow[];
  setRulesFull: React.Dispatch<React.SetStateAction<AdvancedRuleRow[]>>;
  onSave: () => void;
  saving: boolean;
  hasChanges: boolean;
  setHasChanges: (v: boolean) => void;
}) {
  const updateRow = useCallback(
    (index: number, patch: Partial<AdvancedRuleRow>) => {
      setRulesFull((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], ...patch };
        return next;
      });
      setHasChanges(true);
    },
    [setRulesFull, setHasChanges]
  );

  const addRule = useCallback(() => {
    const firstCat = categories[0]?.id ?? '';
    const firstProd = addonProducts[0]?.id ?? '';
    setRulesFull((prev) => [
      ...prev,
      {
        categoryId: firstCat,
        addonProductId: firstProd,
        priority: prev.length,
        timeStart: null,
        timeEnd: null,
      },
    ]);
    setHasChanges(true);
  }, [categories, addonProducts, setRulesFull, setHasChanges]);

  const removeRule = useCallback(
    (index: number) => {
      setRulesFull((prev) => prev.filter((_, i) => i !== index));
      setHasChanges(true);
    },
    [setRulesFull, setHasChanges]
  );

  const moveRule = useCallback(
    (index: number, dir: 'up' | 'down') => {
      setRulesFull((prev) => {
        const next = [...prev];
        const target = dir === 'up' ? index - 1 : index + 1;
        if (target < 0 || target >= next.length) return prev;
        [next[index], next[target]] = [next[target], next[index]];
        return next;
      });
      setHasChanges(true);
    },
    [setRulesFull, setHasChanges]
  );

  if (addonProducts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Nu există produse marcate ca add-on. Mergi la{' '}
            <strong>Produse</strong> și marchează produsele dorite ca „Add-on la coș".
          </p>
        </CardContent>
      </Card>
    );
  }

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Nu există categorii. Adaugă mai întâi categorii.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {hasChanges && (
        <div className="flex justify-end gap-2">
          <Button onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvează regulile
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rețete add-on</CardTitle>
          <CardDescription className="text-xs">
            Trigger: dacă coșul conține produse din categoria X, condiții opționale (interval orar),
            acțiune: sugerează produsul ales. Ordinea determină prioritatea (primul = cel mai important).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rulesFull.map((row, index) => (
            <div
              key={row.id ?? `new-${index}`}
              className="flex flex-wrap items-end gap-3 p-3 rounded-lg border border-border bg-muted/30"
            >
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => moveRule(index, 'up')}
                  disabled={index === 0}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => moveRule(index, 'down')}
                  disabled={index === rulesFull.length - 1}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1 min-w-0">
                <div className="space-y-1.5">
                  <Label className="text-xs">Categorie trigger</Label>
                  <Select
                    value={row.categoryId}
                    onValueChange={(v) => updateRow(index, { categoryId: v })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Categorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Sugerează produs</Label>
                  <Select
                    value={row.addonProductId}
                    onValueChange={(v) => updateRow(index, { addonProductId: v })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Produs" />
                    </SelectTrigger>
                    <SelectContent>
                      {addonProducts.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.price} RON)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Ora start</Label>
                  <Input
                    type="time"
                    className="h-9"
                    value={row.timeStart ?? ''}
                    onChange={(e) => updateRow(index, { timeStart: e.target.value || null })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Ora sfârșit</Label>
                  <Input
                    type="time"
                    className="h-9"
                    value={row.timeEnd ?? ''}
                    onChange={(e) => updateRow(index, { timeEnd: e.target.value || null })}
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                onClick={() => removeRule(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={addRule} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Adaugă regulă
          </Button>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              <strong>Fallback:</strong> Dacă o categorie din coș nu are reguli aici, se afișează add-on-urile globale.
              Pentru a dezactiva sugestiile pentru o categorie, nu adăuga nici o regulă cu acea categorie trigger (sau șterge regulile existente).
              Interval orar este opțional; lăsat gol, regula se aplică mereu.
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────

export default function AdminAddonRules() {
  const { getCategories, getProducts, getAddonRules, getAddonRulesFull, updateAddonRulesFull } =
    useAdminApi();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [addonProducts, setAddonProducts] = useState<AdminProduct[]>([]);
  const [rules, setRules] = useState<Record<string, string[]>>({});
  const [rulesFull, setRulesFull] = useState<AdvancedRuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [catRes, prodRes, rulesRes, rulesFullRes] = await Promise.all([
          getCategories(),
          getProducts('limit=500'),
          getAddonRules(),
          getAddonRulesFull().catch(() => ({ success: true, data: [] })),
        ]);

        const catsRaw: { categories?: AdminCategory[] } | AdminCategory[] = catRes as any;
        const cats: AdminCategory[] =
          (catsRaw && Array.isArray((catsRaw as any).categories) && (catsRaw as any).categories) ||
          (Array.isArray(catsRaw) ? (catsRaw as AdminCategory[]) : []);
        setCategories(Array.isArray(cats) ? cats : []);

        const allProducts: AdminProduct[] = (prodRes as any)?.products || [];
        const addonCandidates = allProducts.filter((p) => p.isAddon);
        setAddonProducts(addonCandidates);

        setRules((rulesRes as any)?.data || {});

        const full = (rulesFullRes as any)?.data || [];
        const sorted: AdvancedRuleRow[] = [...full]
          .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
          .map((r: any) => ({
            id: r.id,
            categoryId: r.categoryId,
            addonProductId: r.addonProductId,
            priority: r.priority ?? 0,
            timeStart: r.timeStart ?? null,
            timeEnd: r.timeEnd ?? null,
          }));
        setRulesFull(sorted);
      } catch (error) {
        console.error('Error loading addon rules data:', error);
        toast({ title: 'Eroare la încărcarea datelor', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSaveAdvanced = async () => {
    setSaving(true);
    try {
      // Ordinea din listă = prioritate (primul = cel mai mare număr)
      const payload = rulesFull.map((row, index) => ({
        categoryId: row.categoryId,
        addonProductId: row.addonProductId,
        priority: rulesFull.length - 1 - index,
        timeStart: row.timeStart ?? null,
        timeEnd: row.timeEnd ?? null,
      }));
      const result = await updateAddonRulesFull(payload);
      const dataFull = (result as any)?.dataFull;
      if (Array.isArray(dataFull) && dataFull.length > 0) {
        const sorted: AdvancedRuleRow[] = [...dataFull]
          .sort((a: any, b: any) => (b.priority ?? 0) - (a.priority ?? 0))
          .map((r: any) => ({
            id: r.id,
            categoryId: r.categoryId,
            addonProductId: r.addonProductId,
            priority: r.priority ?? 0,
            timeStart: r.timeStart ?? null,
            timeEnd: r.timeEnd ?? null,
          }));
        setRulesFull(sorted);
      }
      setHasChanges(false);
      toast({ title: 'Regulile au fost salvate' });
    } catch (error) {
      console.error('Error saving addon rules:', error);
      toast({ title: 'Eroare la salvare', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Add-ons</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configurează produsele add-on afișate în secțiunea „Adaugă la comandă" din coș.
        </p>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList>
          <TabsTrigger value="basic">
            Basic
            <Badge variant="secondary" className="ml-2 text-xs">
              {addonProducts.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="advanced">Avansat</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-6">
          <BasicTab addonProducts={addonProducts} />
        </TabsContent>

        <TabsContent value="advanced" className="mt-6">
          <AdvancedTab
            categories={categories}
            addonProducts={addonProducts}
            rulesFull={rulesFull}
            setRulesFull={setRulesFull}
            onSave={handleSaveAdvanced}
            saving={saving}
            hasChanges={hasChanges}
            setHasChanges={setHasChanges}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
