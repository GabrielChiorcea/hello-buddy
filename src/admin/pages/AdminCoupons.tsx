import { useEffect, useRef, useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
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
import { cn } from '@/lib/utils';

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

function ImageUploadField({
  label,
  imageUrl,
  isUploading,
  onSelectFile,
  onClear,
  boxClassName,
  hint,
  alt,
  layout = 'inline',
}: {
  label?: string;
  imageUrl?: string;
  isUploading: boolean;
  onSelectFile: (file?: File) => void | Promise<void>;
  onClear?: () => void;
  boxClassName: string;
  hint: string;
  alt: string;
  layout?: 'inline' | 'stack';
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    if (!isUploading) inputRef.current?.click();
  };

  const uploadBox = (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/30 shrink-0 cursor-pointer transition-colors hover:border-primary hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        boxClassName,
        isUploading && 'pointer-events-none opacity-70',
      )}
      onClick={openPicker}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openPicker();
        }
      }}
    >
      {isUploading ? (
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      ) : imageUrl ? (
        <>
          <img src={getImageUrl(imageUrl)} alt={alt} className="h-full w-full object-cover" />
          {onClear ? (
            <button
              type="button"
              className="absolute top-1.5 right-1.5 rounded-full bg-background/95 p-1 shadow-sm ring-1 ring-border hover:bg-background"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              aria-label="Elimină imaginea"
            >
              <X className="h-3 w-3" />
            </button>
          ) : null}
        </>
      ) : (
        <div className="flex flex-col items-center gap-1.5 px-3 text-center text-muted-foreground">
          <Upload className="h-7 w-7" />
          <span className="text-[11px] font-medium leading-tight">Click pentru încărcare</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-2">
      {label ? <Label>{label}</Label> : null}
      <div className={cn(
        layout === 'stack' ? 'space-y-2' : 'flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4',
      )}>
        {uploadBox}
        <p
          className={cn(
            'text-sm text-muted-foreground leading-relaxed',
            layout === 'inline' && 'pt-1',
            layout === 'stack' && 'max-w-sm',
          )}
        >
          {hint}
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          void onSelectFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}

export default function AdminCoupons() {
  const {
    getCouponsAdmin,
    createCouponAdmin,
    updateCouponAdmin,
    deleteCouponAdmin,
    getTiers,
    getProducts,
    uploadImage,
    getSettings,
    updateSettings,
  } = useAdminApi();
  const { toast } = useToast();
  const [items, setItems] = useState<AdminCoupon[]>([]);
  const [form, setForm] = useState(initialForm);
  const [tiers, setTiers] = useState<TierOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [homeCardImage, setHomeCardImage] = useState('');
  const [isUploadingHomeCardImage, setIsUploadingHomeCardImage] = useState(false);

  const load = async () => {
    try {
      const [list, tiersData, productsData] = await Promise.all([
        getCouponsAdmin(true),
        getTiers(),
        getProducts('limit=500'),
      ]);
      setItems((list as AdminCoupon[]) ?? []);
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
    }
  };

  const clearHomeCardImage = async () => {
    try {
      await updateSettings({ coupons_home_card_image: '' });
      setHomeCardImage('');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Nu s-a putut elimina imaginea';
      toast({ title: texts.common.error, description: message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{texts.adminCoupons.pageTitle}</h1>
      <Card>
        <CardHeader><CardTitle>{texts.adminCoupons.createCardTitle}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-5">
          <div className="space-y-2">
            <Label>{texts.adminCoupons.titleLabel}</Label>
            <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          </div>
          <div className="space-y-2">
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
          <div className="space-y-2">
            <Label>{texts.adminCoupons.discountLabel}</Label>
            <Input type="number" value={form.discountPercent} onChange={(e) => setForm((p) => ({ ...p, discountPercent: Number(e.target.value) }))} />
          </div>
          <div className="space-y-2">
            <Label>{texts.adminCoupons.pointsCostLabel}</Label>
            <Input type="number" value={form.pointsCost} onChange={(e) => setForm((p) => ({ ...p, pointsCost: Number(e.target.value) }))} />
          </div>
          <div className="space-y-2">
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
            <ImageUploadField
              label={texts.adminCoupons.imageLabel}
              imageUrl={form.imageUrl || undefined}
              isUploading={isUploadingImage}
              onSelectFile={handleImageUpload}
              onClear={() => setForm((p) => ({ ...p, imageUrl: '' }))}
              boxClassName="h-24 w-24"
              alt={texts.adminCoupons.imagePreviewAlt}
              hint="Format pătrat (ex. 256×256 px), JPG, PNG sau WebP."
              layout="stack"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>{texts.adminCoupons.descriptionLabel}</Label>
            <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="flex items-center gap-2 md:col-span-2">
            <Switch checked={form.isActive} onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))} />
            <Label>{texts.adminCoupons.activeLabel}</Label>
          </div>
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
        <CardContent>
          <ImageUploadField
            imageUrl={homeCardImage || undefined}
            isUploading={isUploadingHomeCardImage}
            onSelectFile={handleHomeCardImageUpload}
            onClear={() => void clearHomeCardImage()}
            boxClassName="h-28 w-52"
            alt="Imagine card cupoane"
            hint="Format landscape recomandat (ex. 400×200 px). Apare în cardul de promovare cupoane de pe pagina principală."
            layout="inline"
          />
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

