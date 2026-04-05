import { useEffect, useRef, useState } from 'react';
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
import { texts } from '@/config/texts';
import { getImageUrl } from '@/lib/imageUrl';

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
    getSettings,
    updateSettings,
  } = useAdminApi();
  const { toast } = useToast();
  const [items, setItems] = useState<AdminCoupon[]>([]);
  const [form, setForm] = useState(initialForm);
  const [analytics, setAnalytics] = useState<CouponsAnalytics | null>(null);
  const [tiers, setTiers] = useState<TierOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [homeCardImage, setHomeCardImage] = useState('');
  const [isUploadingHomeCardImage, setIsUploadingHomeCardImage] = useState(false);
  const homeCardFileInputRef = useRef<HTMLInputElement>(null);

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
      const message = e instanceof Error ? e.message : texts.adminCoupons.loadError;
      toast({ title: texts.common.error, description: message, variant: 'destructive' });
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    (async () => {
      try {
        const settings = (await getSettings()) as Record<string, { value: string }>;
        const image = settings?.coupons_home_card_image?.value ?? '';
        setHomeCardImage(image);
      } catch {
        // Ignore settings load errors here; page remains usable.
      }
    })();
  }, [getSettings]);

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
      toast({ title: texts.adminCoupons.imageUploaded });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : texts.adminCoupons.imageUploadError;
      toast({ title: texts.adminCoupons.imageUploadErrorTitle, description: message, variant: 'destructive' });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const create = async () => {
    if (!form.targetProductId) {
      toast({
        title: texts.adminCoupons.missingProductTitle,
        description: texts.adminCoupons.missingProductDescription,
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
      toast({ title: texts.adminCoupons.created });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : texts.adminCoupons.createError;
      toast({ title: texts.common.error, description: message, variant: 'destructive' });
    }
  };

  const handleHomeCardImageUpload = async (file?: File) => {
    if (!file) return;
    try {
      setIsUploadingHomeCardImage(true);
      const uploadedUrl = await uploadImage(file);
      await updateSettings({ coupons_home_card_image: uploadedUrl });
      setHomeCardImage(uploadedUrl);
      toast({ title: 'Imagine card cupoane salvata' });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Nu s-a putut salva imaginea';
      toast({ title: texts.common.error, description: message, variant: 'destructive' });
    } finally {
      setIsUploadingHomeCardImage(false);
      if (homeCardFileInputRef.current) homeCardFileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{texts.adminCoupons.pageTitle}</h1>
      <Card>
        <CardHeader><CardTitle>{texts.adminCoupons.createCardTitle}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>{texts.adminCoupons.titleLabel}</Label><Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></div>
          <div>
            <Label>{texts.adminCoupons.targetProductLabel}</Label>
            <Select value={form.targetProductId} onValueChange={(value) => setForm((p) => ({ ...p, targetProductId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder={texts.adminCoupons.targetProductPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>{texts.adminCoupons.discountLabel}</Label><Input type="number" value={form.discountPercent} onChange={(e) => setForm((p) => ({ ...p, discountPercent: Number(e.target.value) }))} /></div>
          <div><Label>{texts.adminCoupons.pointsCostLabel}</Label><Input type="number" value={form.pointsCost} onChange={(e) => setForm((p) => ({ ...p, pointsCost: Number(e.target.value) }))} /></div>
          <div>
            <Label>{texts.adminCoupons.requiredTierLabel}</Label>
            <Select value={form.requiredTierId || '__none__'} onValueChange={(value) => setForm((p) => ({ ...p, requiredTierId: value === '__none__' ? '' : value }))}>
              <SelectTrigger>
                <SelectValue placeholder={texts.adminCoupons.requiredTierPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{texts.adminCoupons.noTierRequired}</SelectItem>
                {tiers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{texts.adminCoupons.imageLabel}</Label>
            <Input type="file" accept="image/*" onChange={(e) => void handleImageUpload(e.target.files?.[0])} />
            {isUploadingImage && <p className="text-xs text-muted-foreground">{texts.adminCoupons.imageUploading}</p>}
            {form.imageUrl && <img src={form.imageUrl} alt={texts.adminCoupons.imagePreviewAlt} className="h-16 w-16 object-cover rounded border" />}
          </div>
          <div className="md:col-span-2"><Label>{texts.adminCoupons.descriptionLabel}</Label><Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></div>
          <div className="flex items-center gap-2"><Switch checked={form.isActive} onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))} /><Label>{texts.adminCoupons.activeLabel}</Label></div>
          <div className="md:col-span-2">
            <Button onClick={create} disabled={!form.targetProductId || isUploadingImage}>
              {texts.admin.create}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Imagine card cupoane Home</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={homeCardFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleHomeCardImageUpload(e.target.files?.[0])}
          />
          <div className="flex items-center gap-4">
            <div className="h-20 w-40 overflow-hidden rounded-lg border bg-muted">
              {homeCardImage ? (
                <img
                  src={getImageUrl(homeCardImage)}
                  alt="Imagine card cupoane"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  Fara imagine
                </div>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => homeCardFileInputRef.current?.click()}
              disabled={isUploadingHomeCardImage}
            >
              {isUploadingHomeCardImage ? 'Se incarca...' : homeCardImage ? 'Schimba imaginea' : 'Incarca imagine'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Recomandare: format landscape (ex: 400x200), folosita in cardul de cupoane de pe Home.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{texts.adminCoupons.analyticsTitle}</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1">
          <p>{texts.adminCoupons.totalDiscountLabel}: {Number(analytics?.totalDiscount ?? 0).toFixed(2)} {texts.common.currency}</p>
          <p>{texts.adminCoupons.totalActivatedLabel}: {analytics?.totalActivated ?? 0}</p>
          <p>{texts.adminCoupons.totalUsedLabel}: {analytics?.totalUsed ?? 0}</p>
          <p>{texts.adminCoupons.usageRateLabel}: {(((analytics?.usageRate ?? 0) as number) * 100).toFixed(1)}%</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{texts.adminCoupons.listTitle}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {items.map((c) => (
            <div key={c.id} className="border rounded-md p-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{c.title}</p>
                <p className="text-xs text-muted-foreground">-{c.discountPercent}% · {c.pointsCost} {texts.adminCoupons.pointsLabel} · {texts.adminCoupons.targetShort} {c.targetProductId}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={async () => { await updateCouponAdmin(c.id, { isActive: !c.isActive }); await load(); }}>
                  {c.isActive ? texts.adminCoupons.deactivate : texts.adminCoupons.activate}
                </Button>
                <Button variant="destructive" onClick={async () => { await deleteCouponAdmin(c.id); await load(); }}>
                  {texts.admin.delete}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

