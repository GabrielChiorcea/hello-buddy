import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminApi } from '@/admin/hooks/useAdminApi';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Gift,
  Crown,
  ShoppingBag,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { texts } from '@/config/texts';

interface FreeProductCampaign {
  id: string;
  name: string;
  tierId: string;
  startDate: string;
  endDate: string;
  customText: string | null;
  productIds: string[];
}

interface SimpleProduct {
  id: string;
  name: string;
}

interface SimpleTier {
  id: string;
  name: string;
}

interface FormData {
  id?: string;
  name: string;
  tierId: string;
  startDate: string;
  endDate: string;
  customText: string;
  productIds: string[];
}

const defaultForm: FormData = {
  name: '',
  tierId: '',
  startDate: '',
  endDate: '',
  customText: '',
  productIds: [],
};

export default function AdminFreeProductCampaigns() {
  const { enabled: freeProductsEnabled, loading: flagLoading } = usePluginEnabled('free_products');
  const {
    getFreeProductCampaigns,
    createFreeProductCampaign,
    updateFreeProductCampaign,
    deleteFreeProductCampaign,
    getTiers,
    getProducts,
  } = useAdminApi();

  const [campaigns, setCampaigns] = useState<FreeProductCampaign[]>([]);
  const [tiers, setTiers] = useState<SimpleTier[]>([]);
  const [products, setProducts] = useState<SimpleProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<FreeProductCampaign | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultForm);

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [campaignsData, tiersData, productsData] = await Promise.all([
        getFreeProductCampaigns(),
        getTiers(),
        getProducts('limit=500'),
      ]);
      setCampaigns(Array.isArray(campaignsData) ? campaignsData : []);
      setTiers(
        Array.isArray(tiersData)
          ? tiersData.map((t: any) => ({ id: t.id, name: t.name }))
          : []
      );
      setProducts(
        Array.isArray(productsData?.products)
          ? productsData.products.map((p: any) => ({ id: p.id, name: p.name }))
          : []
      );
    } catch (error) {
      toast({
        title: texts.common.error,
        description: texts.freeProducts.toastLoadError,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [getFreeProductCampaigns, getTiers, getProducts]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const openCreate = () => {
    setFormData({
      ...defaultForm,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
    });
    setShowDialog(true);
  };

  const openEdit = (c: FreeProductCampaign) => {
    setFormData({
      id: c.id,
      name: c.name,
      tierId: c.tierId,
      startDate: c.startDate.slice(0, 10),
      endDate: c.endDate.slice(0, 10),
      customText: c.customText ?? '',
      productIds: c.productIds ?? [],
    });
    setShowDialog(true);
  };

  const handleToggleProduct = (productId: string) => {
    setFormData((prev) => {
      const exists = prev.productIds.includes(productId);
      return {
        ...prev,
        productIds: exists
          ? prev.productIds.filter((id) => id !== productId)
          : [...prev.productIds, productId],
      };
    });
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast({
        title: texts.common.error,
        description: texts.freeProducts.validationNameRequired,
        variant: 'destructive',
      });
      return false;
    }
    if (!formData.tierId) {
      toast({
        title: texts.common.error,
        description: texts.freeProducts.validationTierRequired,
        variant: 'destructive',
      });
      return false;
    }
    if (!formData.startDate || !formData.endDate) {
      toast({
        title: texts.common.error,
        description: texts.freeProducts.validationDatesRequired,
        variant: 'destructive',
      });
      return false;
    }
    if (formData.startDate > formData.endDate) {
      toast({
        title: texts.common.error,
        description: texts.freeProducts.validationDatesOrder,
        variant: 'destructive',
      });
      return false;
    }
    if (formData.productIds.length === 0) {
      toast({
        title: texts.common.error,
        description: texts.freeProducts.warnNoProducts,
      });
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        tierId: formData.tierId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        minOrderValue: formData.minOrderValue,
        customText: formData.customText || null,
        productIds: formData.productIds,
      };
      if (formData.id) {
        await updateFreeProductCampaign(formData.id, payload);
        toast({ title: texts.freeProducts.toastUpdated });
      } else {
        await createFreeProductCampaign(payload);
        toast({ title: texts.freeProducts.toastCreated });
      }
      setShowDialog(false);
      fetchInitialData();
    } catch (error) {
      toast({
        title: texts.common.error,
        description:
          error instanceof Error ? error.message : texts.freeProducts.toastSaveError,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await deleteFreeProductCampaign(deleteConfirm.id);
      toast({ title: texts.freeProducts.toastDeleted });
      setDeleteConfirm(null);
      fetchInitialData();
    } catch (error) {
      toast({
        title: texts.common.error,
        description:
          error instanceof Error ? error.message : texts.freeProducts.toastDeleteError,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const tierNameById = useMemo(
    () =>
      new Map<string, string>(
        tiers.map((t) => [
          t.id,
          t.name,
        ])
      ),
    [tiers]
  );

  if (flagLoading) return null;
  if (!freeProductsEnabled) return <Navigate to="/admin" replace />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="h-7 w-7 text-primary" />
            {texts.freeProducts.adminTitle}
          </h1>
          <p className="text-muted-foreground">
            {texts.freeProducts.adminSubtitle}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Campanie nouă
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{texts.freeProducts.listTitle}</CardTitle>
          <CardDescription>
            {texts.freeProducts.listDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground">{texts.freeProducts.loading}</div>
          ) : campaigns.length === 0 ? (
            <div className="text-muted-foreground py-8">
              {texts.freeProducts.listEmpty}
            </div>
          ) : (
            <div className="space-y-2">
              {campaigns.map((c) => {
                const today = new Date().toISOString().slice(0, 10);
                const active = c.startDate.slice(0, 10) <= today && c.endDate.slice(0, 10) >= today;
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {c.name}
                        {active && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            Activă
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground flex flex-wrap gap-x-2 gap-y-1 mt-1">
                        <span className="flex items-center gap-1">
                          <Crown className="h-3 w-3" />
                          {tierNameById.get(c.tierId) || 'Tier necunoscut'}
                        </span>
                        <span>· {c.startDate.slice(0, 10)} – {c.endDate.slice(0, 10)}</span>
                        <span className="flex items-center gap-1">
                          <ShoppingBag className="h-3 w-3" />
                          {texts.freeProducts.productsCount.replace(
                            '{count}',
                            String(c.productIds?.length || 0)
                          )}
                        </span>
                      </div>
                      {c.customText && (
                        <div className="text-xs text-muted-foreground mt-1 italic">
                          „{c.customText}”
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirm(c)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formData.id
                ? texts.freeProducts.editDialogTitle
                : texts.freeProducts.createDialogTitle}
            </DialogTitle>
            <DialogDescription>
              {texts.freeProducts.dialogSubtitle}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>{texts.freeProducts.nameLabel}</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder={texts.freeProducts.namePlaceholder}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{texts.freeProducts.tierLabel}</Label>
                <Select
                  value={formData.tierId}
                  onValueChange={(value) => setFormData((p) => ({ ...p, tierId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={texts.freeProducts.tierPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {tiers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{texts.freeProducts.customTextLabel}</Label>
                <Textarea
                  value={formData.customText}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, customText: e.target.value }))
                  }
                  rows={2}
                  placeholder={texts.freeProducts.customTextPlaceholder}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{texts.freeProducts.startDateLabel}</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, startDate: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>{texts.freeProducts.endDateLabel}</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, endDate: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <Label>{texts.freeProducts.minOrderValueLabel}</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={formData.minOrderValue ?? 0}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    minOrderValue: Number(e.target.value) || 0,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                {texts.freeProducts.minOrderValueHelp}
              </p>
            </div>
            <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
              <Label>{texts.freeProducts.productsLabel}</Label>
              <p className="text-xs text-muted-foreground">
                {texts.freeProducts.productsHelp}
              </p>
              <div className="max-h-64 overflow-y-auto border rounded-md p-2 bg-background">
                {products.length === 0 ? (
                  <div className="text-xs text-muted-foreground">
                    {texts.freeProducts.productsEmpty}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm">
                    {products.map((p) => {
                      const checked = formData.productIds.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-muted/60"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={checked}
                            onChange={() => handleToggleProduct(p.id)}
                          />
                          <span className="truncate">{p.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              {texts.freeProducts.cancel}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {texts.freeProducts.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{texts.freeProducts.deleteTitle}</DialogTitle>
            <DialogDescription>
              {texts.freeProducts.deleteDescription.replace(
                '{name}',
                deleteConfirm?.name || ''
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              {texts.freeProducts.cancel}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {texts.freeProducts.deleteConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

