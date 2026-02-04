/**
 * Address Manager Component
 * Allows users to manage their delivery addresses
 */

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { MapPin, Plus, Edit2, Trash2, Star, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FormInput } from '@/components/common/FormInput';
import { Loader } from '@/components/common/Loader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { texts } from '@/config/texts';
import { DeliveryAddress } from '@/types';
import {
  fetchAddressesApi,
  saveAddressApi,
  updateAddressApi,
  deleteAddressApi,
  setDefaultAddressApi,
} from '@/api/api';

// Validation schema
const addressSchema = z.object({
  label: z.string().trim().min(1, 'Denumirea este obligatorie').max(50),
  address: z.string().trim().min(5, 'Adresa trebuie să aibă minim 5 caractere').max(200),
  city: z.string().trim().min(2, 'Orașul trebuie să aibă minim 2 caractere').max(100),
  phone: z
    .string()
    .trim()
    .min(10, texts.validation.invalidPhone)
    .max(15)
    .regex(/^[0-9+\s-]+$/, texts.validation.invalidPhone),
});

interface AddressFormData {
  label: string;
  address: string;
  city: string;
  phone: string;
  notes?: string;
  isDefault: boolean;
}

type FormErrors = Partial<Record<keyof AddressFormData, string>>;

export const AddressManager: React.FC = () => {
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<DeliveryAddress | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<AddressFormData>({
    label: '',
    address: '',
    city: '',
    phone: '',
    notes: '',
    isDefault: false,
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Fetch addresses on mount
  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setIsLoading(true);
    setError(null);
    
    const result = await fetchAddressesApi();
    
    if (result.success && result.data) {
      setAddresses(result.data);
    } else {
      setError(result.error || 'Eroare la încărcarea adreselor');
    }
    
    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData({
      label: '',
      address: '',
      city: '',
      phone: '',
      notes: '',
      isDefault: false,
    });
    setFormErrors({});
    setEditingAddress(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (address: DeliveryAddress) => {
    setEditingAddress(address);
    setFormData({
      label: address.label,
      address: address.address,
      city: address.city,
      phone: address.phone,
      notes: address.notes || '',
      isDefault: address.isDefault,
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value.replace(/[<>]/g, ''),
    }));
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    try {
      addressSchema.parse(formData);
      setFormErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        err.errors.forEach((error) => {
          const field = error.path[0] as keyof FormErrors;
          newErrors[field] = error.message;
        });
        setFormErrors(newErrors);
      }
      return false;
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    setError(null);

    try {
      if (editingAddress) {
        // Update existing address
        const result = await updateAddressApi(editingAddress.id, '', formData);
        
        if (result.success && result.data) {
          setAddresses((prev) =>
            prev.map((a) => (a.id === editingAddress.id ? result.data! : a))
          );
          toast({ title: texts.notifications.addressSaved });
          setIsDialogOpen(false);
          resetForm();
        } else {
          setError(result.error || 'Eroare la salvarea adresei');
        }
      } else {
        // Create new address
        const result = await saveAddressApi('', formData);
        
        if (result.success && result.data) {
          setAddresses((prev) => [...prev, result.data!]);
          toast({ title: texts.notifications.addressSaved });
          setIsDialogOpen(false);
          resetForm();
        } else {
          setError(result.error || 'Eroare la salvarea adresei');
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (addressId: string) => {
    const result = await deleteAddressApi(addressId);
    
    if (result.success) {
      setAddresses((prev) => prev.filter((a) => a.id !== addressId));
      toast({ title: texts.notifications.addressDeleted });
    } else {
      toast({
        title: texts.common.error,
        description: result.error,
        variant: 'destructive',
      });
    }
    
    setDeleteConfirmId(null);
  };

  const handleSetDefault = async (addressId: string) => {
    const result = await setDefaultAddressApi(addressId);
    
    if (result.success) {
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          isDefault: a.id === addressId,
        }))
      );
      toast({ title: texts.notifications.addressSaved });
    } else {
      toast({
        title: texts.common.error,
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{texts.profile.deliveryAddresses}</h3>
        <Button onClick={openAddDialog} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {texts.profile.addAddress}
        </Button>
      </div>

      {addresses.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          {texts.profile.noAddresses}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">{address.label}</CardTitle>
                  </div>
                  {address.isDefault && (
                    <Badge variant="secondary" className="text-xs">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      {texts.profile.defaultAddress}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">{address.address}</p>
                <p className="text-sm text-muted-foreground">{address.city}</p>
                <p className="text-sm text-muted-foreground">{address.phone}</p>
                {address.notes && (
                  <p className="text-sm text-muted-foreground italic">{address.notes}</p>
                )}
                
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(address)}
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    {texts.profile.editAddress}
                  </Button>
                  {!address.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(address.id)}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      {texts.profile.setAsDefault}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteConfirmId(address.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? texts.profile.editAddress : texts.profile.addAddress}
            </DialogTitle>
            <DialogDescription>
              Completează detaliile adresei de livrare
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <FormInput
              name="label"
              type="text"
              label={texts.profile.addressLabelField}
              placeholder={texts.profile.addressLabelPlaceholder}
              value={formData.label}
              onChange={handleChange}
              error={formErrors.label}
              disabled={isSaving}
            />
            <FormInput
              name="address"
              type="text"
              label={texts.profile.addressLabel}
              placeholder={texts.profile.addressPlaceholder}
              value={formData.address}
              onChange={handleChange}
              error={formErrors.address}
              disabled={isSaving}
            />
            <FormInput
              name="city"
              type="text"
              label={texts.profile.cityLabel}
              placeholder={texts.profile.cityPlaceholder}
              value={formData.city}
              onChange={handleChange}
              error={formErrors.city}
              disabled={isSaving}
            />
            <FormInput
              name="phone"
              type="tel"
              label={texts.auth.phoneLabel}
              placeholder={texts.auth.phonePlaceholder}
              value={formData.phone}
              onChange={handleChange}
              error={formErrors.phone}
              disabled={isSaving}
            />

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isDefault: checked === true }))
                }
                disabled={isSaving}
              />
              <Label htmlFor="isDefault" className="cursor-pointer">
                {texts.profile.setAsDefault}
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
              {texts.profile.cancel}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader size="sm" className="mr-2" />}
              {texts.profile.saveChanges}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{texts.profile.deleteAddress}</AlertDialogTitle>
            <AlertDialogDescription>
              Ești sigur că vrei să ștergi această adresă? Această acțiune nu poate fi anulată.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{texts.profile.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {texts.profile.deleteAddress}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
