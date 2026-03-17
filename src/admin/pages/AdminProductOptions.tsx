/**
 * =============================================================================
 * PAGINA ADMIN – TEMPLATE-URI OPȚIUNI PRODUS (per categorie)
 * =============================================================================
 * Permite adminului să creeze/editeze template-uri de opțiuni la nivel de categorie,
 * să le aplice pe produse (în masă sau individual) și să sincronizeze automat
 * produsele care urmăresc un template.
 */

import { useEffect, useState, useCallback } from 'react';
import { useAdminApi } from '@/admin/hooks/useAdminApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  Pencil,
  RefreshCw,
  Copy,
  ChevronDown,
  ChevronRight,
  Settings2,
  Loader2,
  Link2,
  Unlink,
  GripVertical,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// ──── Types ─────────────────────────────────────────────────────────────────

interface TemplateOption {
  id?: number;
  name: string;
  priceDelta: number;
  isDefault: boolean;
  isMultiple: boolean;
  priority: number;
}

interface TemplateGroup {
  id?: number;
  name: string;
  minSelected: number;
  maxSelected: number;
  isRequired: boolean;
  position: number;
  options: TemplateOption[];
}

interface OptionTemplate {
  id: number;
  categoryId: string;
  name: string;
  groups: TemplateGroup[];
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  displayName: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  followsCategoryTemplate?: boolean;
  categoryTemplateId?: number | null;
}

// ──── Component ─────────────────────────────────────────────────────────────

export default function AdminProductOptions() {
  const api = useAdminApi();

  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [templates, setTemplates] = useState<OptionTemplate[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  // Template editor dialog
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OptionTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateGroups, setTemplateGroups] = useState<TemplateGroup[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Apply dialog
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyTemplateId, setApplyTemplateId] = useState<number | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [setFollows, setSetFollows] = useState(true);
  const [isApplying, setIsApplying] = useState(false);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<OptionTemplate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Expanded template cards
  const [expandedTemplates, setExpandedTemplates] = useState<Set<number>>(new Set());

  // ─── Load categories ────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await api.getCategories();
        setCategories(data.categories || []);
        if (data.categories?.length > 0) {
          setSelectedCategoryId(data.categories[0].id);
        }
      } catch {
        toast({ title: 'Eroare', description: 'Nu s-au putut încărca categoriile', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ─── Load templates + products when category changes ────────────────────
  const loadTemplatesAndProducts = useCallback(async () => {
    if (!selectedCategoryId) return;
    setIsLoadingTemplates(true);
    try {
      const [tplData, prodData] = await Promise.all([
        api.getOptionTemplatesForCategory(selectedCategoryId),
        api.getProducts(`categoryId=${selectedCategoryId}&limit=200`),
      ]);
      setTemplates(tplData.templates || []);
      setProducts(prodData.products || []);
    } catch {
      toast({ title: 'Eroare', description: 'Nu s-au putut încărca datele', variant: 'destructive' });
    } finally {
      setIsLoadingTemplates(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId]);

  useEffect(() => {
    loadTemplatesAndProducts();
  }, [loadTemplatesAndProducts]);

  // ─── Template editor helpers ────────────────────────────────────────────
  const openNewTemplate = () => {
    setEditingTemplate(null);
    setTemplateName('');
    setTemplateGroups([{
      name: '',
      minSelected: 0,
      maxSelected: 1,
      isRequired: false,
      position: 0,
      options: [{ name: '', priceDelta: 0, isDefault: false, isMultiple: false, priority: 0 }],
    }]);
    setEditorOpen(true);
  };

  const openEditTemplate = (tpl: OptionTemplate) => {
    setEditingTemplate(tpl);
    setTemplateName(tpl.name);
    setTemplateGroups(tpl.groups.map(g => ({
      ...g,
      options: g.options.length > 0 ? g.options : [{ name: '', priceDelta: 0, isDefault: false, isMultiple: false, priority: 0 }],
    })));
    setEditorOpen(true);
  };

  const addGroup = () => {
    setTemplateGroups(prev => [
      ...prev,
      {
        name: '',
        minSelected: 0,
        maxSelected: 1,
        isRequired: false,
        position: prev.length,
        options: [{ name: '', priceDelta: 0, isDefault: false, isMultiple: false, priority: 0 }],
      },
    ]);
  };

  const removeGroup = (idx: number) => {
    setTemplateGroups(prev => prev.filter((_, i) => i !== idx).map((g, i) => ({ ...g, position: i })));
  };

  const updateGroup = (idx: number, field: string, value: any) => {
    setTemplateGroups(prev => prev.map((g, i) => i === idx ? { ...g, [field]: value } : g));
  };

  const addOption = (groupIdx: number) => {
    setTemplateGroups(prev => prev.map((g, i) =>
      i === groupIdx
        ? { ...g, options: [...g.options, { name: '', priceDelta: 0, isDefault: false, isMultiple: false, priority: g.options.length }] }
        : g
    ));
  };

  const removeOption = (groupIdx: number, optIdx: number) => {
    setTemplateGroups(prev => prev.map((g, i) =>
      i === groupIdx
        ? { ...g, options: g.options.filter((_, j) => j !== optIdx).map((o, j) => ({ ...o, priority: j })) }
        : g
    ));
  };

  const updateOption = (groupIdx: number, optIdx: number, field: string, value: any) => {
    setTemplateGroups(prev => prev.map((g, i) =>
      i === groupIdx
        ? { ...g, options: g.options.map((o, j) => j === optIdx ? { ...o, [field]: value } : o) }
        : g
    ));
  };

  // ─── Save template ──────────────────────────────────────────────────────
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast({ title: 'Eroare', description: 'Numele template-ului este obligatoriu', variant: 'destructive' });
      return;
    }
    // Validate: each group needs a name and at least one named option
    for (const g of templateGroups) {
      if (!g.name.trim()) {
        toast({ title: 'Eroare', description: 'Fiecare grup trebuie să aibă un nume', variant: 'destructive' });
        return;
      }
      const validOpts = g.options.filter(o => o.name.trim());
      if (validOpts.length === 0) {
        toast({ title: 'Eroare', description: `Grupul "${g.name}" are nevoie de cel puțin o opțiune`, variant: 'destructive' });
        return;
      }
    }

    setIsSaving(true);
    try {
      const cleanGroups = templateGroups.map((g, gi) => ({
        name: g.name.trim(),
        minSelected: g.minSelected,
        maxSelected: g.maxSelected,
        isRequired: g.isRequired,
        position: gi,
        options: g.options.filter(o => o.name.trim()).map((o, oi) => ({
          name: o.name.trim(),
          priceDelta: o.priceDelta,
          isDefault: o.isDefault,
          isMultiple: o.isMultiple,
          priority: oi,
        })),
      }));

      if (editingTemplate) {
        await api.updateOptionTemplate(editingTemplate.id, { name: templateName.trim(), groups: cleanGroups });
        toast({ title: 'Succes', description: 'Template actualizat' });
      } else {
        await api.createOptionTemplate({ categoryId: selectedCategoryId, name: templateName.trim(), groups: cleanGroups });
        toast({ title: 'Succes', description: 'Template creat' });
      }

      setEditorOpen(false);
      await loadTemplatesAndProducts();
    } catch (err: any) {
      toast({ title: 'Eroare', description: err.message || 'Eroare la salvare', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Delete template ────────────────────────────────────────────────────
  const handleDeleteTemplate = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await api.deleteOptionTemplate(deleteConfirm.id);
      toast({ title: 'Succes', description: 'Template șters (produsele păstrează opțiunile locale)' });
      setDeleteConfirm(null);
      await loadTemplatesAndProducts();
    } catch (err: any) {
      toast({ title: 'Eroare', description: err.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Apply template ─────────────────────────────────────────────────────
  const openApplyDialog = (templateId: number) => {
    setApplyTemplateId(templateId);
    // Pre-select products not yet following this template
    const eligible = products.filter(p => p.categoryTemplateId !== templateId);
    setSelectedProductIds(eligible.map(p => p.id));
    setSetFollows(true);
    setApplyOpen(true);
  };

  const handleApply = async () => {
    if (!applyTemplateId || selectedProductIds.length === 0) return;
    setIsApplying(true);
    try {
      const result = await api.applyOptionTemplate(applyTemplateId, selectedProductIds, setFollows);
      toast({ title: 'Succes', description: `Template aplicat pe ${result.affected} produs(e)` });
      setApplyOpen(false);
      await loadTemplatesAndProducts();
    } catch (err: any) {
      toast({ title: 'Eroare', description: err.message, variant: 'destructive' });
    } finally {
      setIsApplying(false);
    }
  };

  // ─── Sync template ──────────────────────────────────────────────────────
  const handleSync = async (templateId: number) => {
    try {
      const result = await api.syncOptionTemplate(templateId);
      toast({ title: 'Sincronizat', description: `${result.affected} produs(e) actualizate` });
      await loadTemplatesAndProducts();
    } catch (err: any) {
      toast({ title: 'Eroare', description: err.message, variant: 'destructive' });
    }
  };

  // ─── Toggle expand ──────────────────────────────────────────────────────
  const toggleExpand = (id: number) => {
    setExpandedTemplates(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ─── Helpers ────────────────────────────────────────────────────────────
  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const followersCount = (tplId: number) => products.filter(p => p.categoryTemplateId === tplId && p.followsCategoryTemplate).length;

  // ─── Render ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Opțiuni produs</h1>
          <p className="text-sm text-muted-foreground">
            Definește template-uri de opțiuni per categorie și aplică-le pe produse
          </p>
        </div>
      </div>

      {/* Category selector */}
      <div className="flex items-center gap-4">
        <Label className="text-sm font-medium">Categorie:</Label>
        <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Alege o categorie" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.displayName || c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={openNewTemplate} disabled={!selectedCategoryId}>
          <Plus className="mr-2 h-4 w-4" />
          Template nou
        </Button>
      </div>

      {isLoadingTemplates ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Settings2 className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-lg font-medium text-muted-foreground">
              Niciun template de opțiuni pentru {selectedCategory?.displayName || 'această categorie'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              Creează un template pentru a defini opțiuni comune (ex: Mărime, Extra topping)
            </p>
            <Button className="mt-4" onClick={openNewTemplate}>
              <Plus className="mr-2 h-4 w-4" /> Creează template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {templates.map(tpl => {
            const isExpanded = expandedTemplates.has(tpl.id);
            const followers = followersCount(tpl.id);

            return (
              <Card key={tpl.id} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer pb-3"
                  onClick={() => toggleExpand(tpl.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      <div>
                        <CardTitle className="text-base">{tpl.name}</CardTitle>
                        <CardDescription className="mt-0.5">
                          {tpl.groups.length} grup(uri) · {followers} produs(e) sincronizate
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" title="Sincronizează produsele care urmăresc" onClick={() => handleSync(tpl.id)}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Aplică pe produse" onClick={() => openApplyDialog(tpl.id)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditTemplate(tpl)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteConfirm(tpl)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="border-t pt-4">
                    {/* Groups preview */}
                    <div className="space-y-3">
                      {tpl.groups.map(g => (
                        <div key={g.id} className="rounded-md border p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{g.name}</span>
                            {g.isRequired && <Badge variant="secondary" className="text-xs">Obligatoriu</Badge>}
                            <span className="text-xs text-muted-foreground">
                              (min: {g.minSelected}, max: {g.maxSelected})
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {g.options.map(o => (
                              <Badge key={o.id} variant="outline" className="text-xs">
                                {o.name}
                                {o.priceDelta !== 0 && (
                                  <span className="ml-1 text-muted-foreground">
                                    {o.priceDelta > 0 ? '+' : ''}{o.priceDelta.toFixed(2)}
                                  </span>
                                )}
                                {o.isDefault && <span className="ml-1 text-primary">★</span>}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Products following this template */}
                    <Separator className="my-4" />
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                        Produse care urmăresc acest template:
                      </h4>
                      {products.filter(p => p.categoryTemplateId === tpl.id).length === 0 ? (
                        <p className="text-xs text-muted-foreground/60">Niciun produs asociat</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {products.filter(p => p.categoryTemplateId === tpl.id).map(p => (
                            <Badge
                              key={p.id}
                              variant={p.followsCategoryTemplate ? 'default' : 'outline'}
                              className="text-xs"
                            >
                              {p.followsCategoryTemplate ? <Link2 className="mr-1 h-3 w-3" /> : <Unlink className="mr-1 h-3 w-3" />}
                              {p.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* ════════ Template editor dialog ════════ */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Editează template' : 'Template nou'}</DialogTitle>
            <DialogDescription>
              Definește grupuri de opțiuni (ex: Mărime, Sos) cu opțiunile aferente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nume template</Label>
              <Input
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                placeholder="ex: Opțiuni Pizza"
              />
            </div>

            <Separator />

            {templateGroups.map((group, gi) => (
              <Card key={gi} className="relative">
                <CardContent className="space-y-3 pt-4">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                    <Input
                      className="flex-1"
                      value={group.name}
                      onChange={e => updateGroup(gi, 'name', e.target.value)}
                      placeholder="Nume grup (ex: Mărime)"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => removeGroup(gi)}
                      disabled={templateGroups.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Min:</Label>
                      <Input
                        type="number"
                        min={0}
                        className="w-16"
                        value={group.minSelected}
                        onChange={e => updateGroup(gi, 'minSelected', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Max:</Label>
                      <Input
                        type="number"
                        min={1}
                        className="w-16"
                        value={group.maxSelected}
                        onChange={e => updateGroup(gi, 'maxSelected', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={group.isRequired}
                        onCheckedChange={v => updateGroup(gi, 'isRequired', v)}
                      />
                      <Label className="text-xs">Obligatoriu</Label>
                    </div>
                  </div>

                  <div className="space-y-2 pl-6">
                    {group.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <Input
                          className="flex-1"
                          value={opt.name}
                          onChange={e => updateOption(gi, oi, 'name', e.target.value)}
                          placeholder="Nume opțiune"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          className="w-24"
                          value={opt.priceDelta}
                          onChange={e => updateOption(gi, oi, 'priceDelta', parseFloat(e.target.value) || 0)}
                          placeholder="+preț"
                        />
                        <div className="flex items-center gap-1" title="Selectat implicit">
                          <Checkbox
                            checked={opt.isDefault}
                            onCheckedChange={v => updateOption(gi, oi, 'isDefault', v)}
                          />
                          <span className="text-xs text-muted-foreground">Def</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => removeOption(gi, oi)}
                          disabled={group.options.length <= 1}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" onClick={() => addOption(gi)}>
                      <Plus className="mr-1 h-3 w-3" /> Opțiune
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button variant="outline" onClick={addGroup} className="w-full">
              <Plus className="mr-2 h-4 w-4" /> Adaugă grup
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Anulează</Button>
            <Button onClick={handleSaveTemplate} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTemplate ? 'Salvează' : 'Creează'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════ Apply dialog ════════ */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="max-h-[70vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aplică template pe produse</DialogTitle>
            <DialogDescription>
              Selectează produsele pe care vrei să aplici template-ul.
              Opțiunile existente vor fi înlocuite.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Switch checked={setFollows} onCheckedChange={setSetFollows} />
              <Label className="text-sm">
                Produsele vor urmări template-ul (sync automat la modificări)
              </Label>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Produse ({selectedProductIds.length} selectate)</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setSelectedProductIds(
                      selectedProductIds.length === products.length
                        ? []
                        : products.map(p => p.id)
                    )
                  }
                >
                  {selectedProductIds.length === products.length ? 'Deselectează tot' : 'Selectează tot'}
                </Button>
              </div>
              {products.map(p => (
                <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded p-1.5 hover:bg-accent/50">
                  <Checkbox
                    checked={selectedProductIds.includes(p.id)}
                    onCheckedChange={v =>
                      setSelectedProductIds(prev =>
                        v ? [...prev, p.id] : prev.filter(id => id !== p.id)
                      )
                    }
                  />
                  <span className="text-sm">{p.name}</span>
                  <span className="text-xs text-muted-foreground">{p.price?.toFixed(2)} RON</span>
                  {p.followsCategoryTemplate && p.categoryTemplateId === applyTemplateId && (
                    <Badge variant="secondary" className="ml-auto text-xs">Deja sync</Badge>
                  )}
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyOpen(false)}>Anulează</Button>
            <Button onClick={handleApply} disabled={isApplying || selectedProductIds.length === 0}>
              {isApplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Aplică pe {selectedProductIds.length} produs(e)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════ Delete confirm ════════ */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Șterge template „{deleteConfirm?.name}"?</DialogTitle>
            <DialogDescription>
              Produsele asociate vor fi detașate dar vor păstra opțiunile locale.
              Această acțiune este ireversibilă.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Anulează</Button>
            <Button variant="destructive" onClick={handleDeleteTemplate} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Șterge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
