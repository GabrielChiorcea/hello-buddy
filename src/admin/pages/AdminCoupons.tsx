import { useEffect, useState } from 'react';
import { useAdminApi } from '@/admin/hooks/useAdminApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface AdminCoupon {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  discountPercent: number;
  pointsCost: number;
  requiredTierId?: string | null;
  targetProductId: string;
  isActive: boolean;
}

interface CouponsAnalytics {
  totalDiscount: number;
  totalActivated: number;
  totalUsed: number;
  usageRate: number;
}

interface TierOption {
  id: string;
  name: string;
}

interface ProductOption {
  id: string;
  name: string;
}

const initialForm = {
  title: '',
  description: '',
  imageUrl: '',
  discountPercent: 10,
  pointsCost: 100,
  requiredTierId: '',
  targetProductId: '',
  isActive: true,
};

export default function AdminCoupons() {
  const {
    getCouponsAdmin,
    createCouponAdmin,
    updateCouponAdmin,
    deleteCouponAdmin,
    getCouponsAnalyticsAdmin,
    getTiers,
    getProducts,
    uploadImage,
  } = useAdminApi();
  const { toast } = useToast();
  const [items, setItems] = useState<AdminCoupon[]>([]);
  const [form, setForm] = useState(initialForm);
  const [analytics, setAnalytics] = useState<CouponsAnalytics | null>(null);
  const [tiers, setTiers] = useState<TierOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const load = async () => {
    try {
      const [list, stats, tiersData, productsData] = await Promise.all([
        getCouponsAdmin(true),
        getCouponsAnalyticsAdmin(),
        getTiers(),
        getProducts('limit=500'),
      ]);
      setItems((list as AdminCoupon[]) ?? []);
      setAnalytics((stats as CouponsAnalytics) ?? null);
      setTiers(
        Array.isArray(tiersData)
          ? (tiersData as Array<{ id: string; name: string }>).map((t) => ({ id: t.id, name: t.name }))
          : []
      );
      const productsList = (productsData as { products?: Array<{ id: string; name: string }> })?.products ?? [];
      setProducts(productsList.map((p) => ({ id: p.id, name: p.name })));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Nu s-au putut încărca cupoanele';
      toast({ title: 'Eroare', description: message, variant: 'destructive' });
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!form.targetProductId && products.length > 0) {
      setForm((prev) => ({ ...prev, targetProductId: products[0].id }));
    }
  }, [products, form.targetProductId]);

  const handleImageUpload = async (file?: File) => {
    if (!file) return;
    try {
      setIsUploadingImage(true);
      const imageUrl = await uploadImage(file);
      setForm((prev) => ({ ...prev, imageUrl }));
      toast({ title: 'Imagine încărcată' });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Nu s-a putut încărca imaginea';
      toast({ title: 'Eroare upload', description: message, variant: 'destructive' });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const create = async () => {
    if (!form.targetProductId) {
      toast({
        title: 'Produs lipsă',
        description: 'Selectează produsul țintă pentru cupon.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await createCouponAdmin({
        ...form,
        requiredTierId: form.requiredTierId || null,
        startsAt: null,
        expiresAt: null,
      });
      setForm(initialForm);
      await load();
      toast({ title: 'Cupon creat' });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Nu s-a putut crea cuponul';
      toast({ title: 'Eroare', description: message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Cupoane</h1>
      <Card>
        <CardHeader><CardTitle>Creează cupon</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Titlu</Label><Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></div>
          <div>
            <Label>Produs țintă</Label>
            <Select value={form.targetProductId} onValueChange={(value) => setForm((p) => ({ ...p, targetProductId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Alege produsul" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Reducere %</Label><Input type="number" value={form.discountPercent} onChange={(e) => setForm((p) => ({ ...p, discountPercent: Number(e.target.value) }))} /></div>
          <div><Label>Cost puncte</Label><Input type="number" value={form.pointsCost} onChange={(e) => setForm((p) => ({ ...p, pointsCost: Number(e.target.value) }))} /></div>
          <div>
            <Label>Rang minim necesar</Label>
            <Select value={form.requiredTierId || '__none__'} onValueChange={(value) => setForm((p) => ({ ...p, requiredTierId: value === '__none__' ? '' : value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Alege rang minim" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Fără rang minim</SelectItem>
                {tiers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Imagine cupon</Label>
            <Input type="file" accept="image/*" onChange={(e) => void handleImageUpload(e.target.files?.[0])} />
            {isUploadingImage && <p className="text-xs text-muted-foreground">Se încarcă imaginea...</p>}
            {form.imageUrl && <img src={form.imageUrl} alt="Coupon preview" className="h-16 w-16 object-cover rounded border" />}
          </div>
          <div className="md:col-span-2"><Label>Descriere</Label><Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></div>
          <div className="flex items-center gap-2"><Switch checked={form.isActive} onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))} /><Label>Activ</Label></div>
          <div className="md:col-span-2">
            <Button onClick={create} disabled={!form.targetProductId || isUploadingImage}>
              Creează
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Analitice cupoane</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1">
          <p>Reducere totală acordată: {Number(analytics?.totalDiscount ?? 0).toFixed(2)} RON</p>
          <p>Activate: {analytics?.totalActivated ?? 0}</p>
          <p>Folosite: {analytics?.totalUsed ?? 0}</p>
          <p>Rata utilizare: {(((analytics?.usageRate ?? 0) as number) * 100).toFixed(1)}%</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Lista cupoane</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {items.map((c) => (
            <div key={c.id} className="border rounded-md p-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{c.title}</p>
                <p className="text-xs text-muted-foreground">-{c.discountPercent}% · {c.pointsCost} puncte · target {c.targetProductId}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={async () => { await updateCouponAdmin(c.id, { isActive: !c.isActive }); await load(); }}>
                  {c.isActive ? 'Dezactivează' : 'Activează'}
                </Button>
                <Button variant="destructive" onClick={async () => { await deleteCouponAdmin(c.id); await load(); }}>
                  Șterge
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

