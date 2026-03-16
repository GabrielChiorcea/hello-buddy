/**
 * Checkout — shared hook, types & sub-components
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { z } from 'zod';
import { CreditCard, Banknote, MapPin, CheckCircle, Plus, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FormInput } from '@/components/common/FormInput';
import { Loader } from '@/components/common/Loader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { useAppDispatch, useAppSelector } from '@/store';
import { resetCart } from '@/store/slices/cartSlice';
import { fetchAddresses, fetchCurrentUser } from '@/store/slices/userSlice';
import { placeOrderApi, createPaymentSessionApi } from '@/api/api';
import { GET_ORDER_PREVIEW } from '@/graphql/queries';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import { toast } from '@/hooks/use-toast';
import { PaymentMethod, CheckoutData, DeliveryAddress, FulfillmentType } from '@/types';
import { cn } from '@/lib/utils';
import { PointsCheckoutSelector, usePointsRewards } from '@/plugins/points';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import type { StyleName } from '@/config/themes';

const createCheckoutSchema = (fulfillmentType: FulfillmentType) =>
  z.object({
    deliveryAddress: fulfillmentType === 'in_location'
      ? z.string().optional()
      : z.string().trim().min(5, 'Adresa trebuie să aibă minim 5 caractere').max(200),
    deliveryCity: fulfillmentType === 'in_location'
      ? z.string().optional()
      : z.string().trim().min(2, 'Orașul trebuie să aibă minim 2 caractere').max(100),
    phone: z.string().trim().min(10, texts.validation.invalidPhone).max(15).regex(/^[0-9+\s-]+$/, texts.validation.invalidPhone),
    paymentMethod: z.enum(['cash', 'card']),
  });

type FormErrors = Partial<Record<keyof CheckoutData, string>>;

export interface CheckoutDisplayData {
  formData: CheckoutData;
  errors: FormErrors;
  isLoading: boolean;
  isSuccess: boolean;
  isInLocation: boolean;
  isCartEmpty: boolean;
  savedAddresses: DeliveryAddress[];
  selectedAddressId: string | null;
  isLoadingAddresses: boolean;
  showManualForm: boolean;
  manualFormRef: React.RefObject<HTMLDivElement | null>;
  items: Array<{ product: any; quantity: number }>;
  subtotal: number;
  deliveryFee: number;
  effectiveDeliveryFee: number;
  displayTotal: number;
  discountFromPoints: number;
  discountFromFreeProducts: number;
  pointsEnabled: boolean;
  userPoints: number;
  pointsRewards: any[];
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleFulfillmentChange: (value: FulfillmentType) => void;
  handlePaymentChange: (value: PaymentMethod) => void;
  selectAddress: (address: DeliveryAddress) => void;
  handleManualEntry: () => void;
  setFormData: React.Dispatch<React.SetStateAction<CheckoutData>>;
  navigate: (path: string) => void;
}

export function useCheckoutData(): CheckoutDisplayData {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, addresses: savedAddresses, addressesLoading: isLoadingAddresses, addressesFetched } = useAppSelector((s) => s.user);
  const { items, subtotal, deliveryFee, total } = useAppSelector((s) => s.cart);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const manualFormRef = useRef<HTMLDivElement | null>(null);

  const [formData, setFormData] = useState<CheckoutData>({
    fulfillmentType: 'delivery',
    tableNumber: '',
    deliveryAddress: '',
    deliveryCity: '',
    phone: user?.phone || '',
    paymentMethod: 'cash',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess] = useState(false);

  // Query backend orderPreview for accurate totals (delivery fee, free products discount, etc.)
  const previewItems = items.map((i) => ({ productId: i.product.id, quantity: i.quantity }));
  const { data: previewData } = useQuery<{ orderPreview: { subtotal: number; deliveryFee: number; freeDeliveryThreshold: number; discountFromFreeProducts: number; discountFromPoints: number; total: number } }>(GET_ORDER_PREVIEW, {
    variables: { items: previewItems },
    skip: items.length === 0,
    fetchPolicy: 'cache-and-network',
  });
  const orderPreview = previewData?.orderPreview ?? null;

  const { enabled: pointsEnabled } = usePluginEnabled('points');
  const { pointsRewards } = usePointsRewards();
  const userPoints = pointsEnabled ? (user?.pointsBalance ?? 0) : 0;

  const selectedReward = formData.pointsToUse ? pointsRewards.find((r) => r.pointsCost === formData.pointsToUse) : null;
  const discountFromPoints = selectedReward?.discountAmount ?? 0;
  const isInLocation = formData.fulfillmentType === 'in_location';

  // Use backend preview values when available, fallback to local cart values
  const effectiveDeliveryFee = isInLocation ? 0 : (orderPreview?.deliveryFee ?? deliveryFee);
  const discountFromFreeProducts = orderPreview?.discountFromFreeProducts ?? 0;
  const displayTotal = Math.max(0, subtotal + effectiveDeliveryFee - discountFromPoints - discountFromFreeProducts);
  const isCartEmpty = items.length === 0;

  const selectAddress = useCallback((address: DeliveryAddress) => {
    setSelectedAddressId(address.id);
    setFormData((prev) => ({ ...prev, deliveryAddress: address.address, deliveryCity: address.city, phone: address.phone }));
    setShowManualForm(false);
    setErrors({});
  }, []);

  useEffect(() => { if (user && !addressesFetched) dispatch(fetchAddresses()); }, [user, addressesFetched, dispatch]);
  useEffect(() => { if (pointsEnabled && user) dispatch(fetchCurrentUser()); }, [pointsEnabled, user?.id, dispatch]);

  useEffect(() => {
    if (showManualForm) return;
    if (savedAddresses.length > 0 && !selectedAddressId) {
      const def = savedAddresses.find((a) => a.isDefault);
      if (def) selectAddress(def); else setShowManualForm(true);
    } else if (addressesFetched && savedAddresses.length === 0) {
      setShowManualForm(true);
    }
  }, [savedAddresses, isLoadingAddresses, addressesFetched, selectedAddressId, showManualForm, selectAddress]);

  const handleManualEntry = () => {
    queueMicrotask(() => {
      setSelectedAddressId(null);
      setShowManualForm(true);
      setFormData((prev) => ({ ...prev, deliveryAddress: '', deliveryCity: '', phone: user?.phone || '' }));
    });
    setTimeout(() => manualFormRef.current?.scrollIntoView({ behavior: 'smooth' }), 150);
  };

  const sanitizeInput = (v: string) => v.replace(/[<>]/g, '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: sanitizeInput(value) }));
    if (errors[name as keyof FormErrors]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handlePaymentChange = (value: PaymentMethod) => setFormData((prev) => ({ ...prev, paymentMethod: value }));

  const handleFulfillmentChange = (value: FulfillmentType) => {
    setFormData((prev) => ({
      ...prev, fulfillmentType: value,
      ...(value === 'in_location' ? { deliveryAddress: '', deliveryCity: '', tableNumber: prev.tableNumber ?? '' } : { tableNumber: '' }),
    }));
    setErrors({});
  };

  const validateForm = (): boolean => {
    try {
      createCheckoutSchema(formData.fulfillmentType ?? 'delivery').parse(formData);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const ne: FormErrors = {};
        err.errors.forEach((e) => { ne[e.path[0] as keyof FormErrors] = e.message; });
        setErrors(ne);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !user) return;
    setIsLoading(true);
    try {
      if (formData.paymentMethod === 'card') {
        const result = await createPaymentSessionApi(items, formData, displayTotal);
        if (result.success && result.data?.redirectUrl) { window.location.href = result.data.redirectUrl; return; }
        toast({ title: texts.common.error, description: result.error ?? 'Eroare la crearea sesiunii de plată', variant: 'destructive' });
        setIsLoading(false);
        return;
      }
      const result = await placeOrderApi(user.id, items, formData, subtotal, effectiveDeliveryFee, displayTotal);
      if (result.success) {
        dispatch(resetCart());
        dispatch(fetchCurrentUser());
        toast({ title: texts.notifications.orderPlaced });
        navigate(routes.checkoutSuccess);
      } else {
        toast({ title: texts.common.error, description: result.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: texts.common.error, description: texts.notifications.orderError, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (isCartEmpty && !isSuccess) navigate(routes.cart); }, [isCartEmpty, isSuccess, navigate]);

  return {
    formData, errors, isLoading, isSuccess, isInLocation, isCartEmpty,
    savedAddresses, selectedAddressId, isLoadingAddresses, showManualForm, manualFormRef,
    items, subtotal, deliveryFee, effectiveDeliveryFee, displayTotal, discountFromPoints,
    pointsEnabled, userPoints, pointsRewards,
    handleChange, handleSubmit, handleFulfillmentChange, handlePaymentChange,
    selectAddress, handleManualEntry, setFormData, navigate: (p: string) => navigate(p),
  };
}

/* ── Shared Sub-Components ── */

export const FulfillmentSelector: React.FC<{ data: CheckoutDisplayData; cardClass?: string }> = ({ data, cardClass }) => (
  <div className="space-y-2">
    <p className="text-sm font-medium text-muted-foreground">Cum dorești să primești comanda?</p>
    <div className="flex gap-4" role="radiogroup">
      {(['delivery', 'in_location'] as FulfillmentType[]).map((type) => (
        <div key={type} role="radio" aria-checked={data.formData.fulfillmentType === type} tabIndex={0}
          className={cn('flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors', cardClass, data.formData.fulfillmentType === type && 'border-primary bg-primary/5')}
          onClick={() => data.handleFulfillmentChange(type)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); data.handleFulfillmentChange(type); } }}>
          {type === 'delivery' ? <MapPin className="h-5 w-5 shrink-0" /> : <Store className="h-5 w-5 shrink-0" />}
          <div>
            <p className="font-medium">{type === 'delivery' ? 'Livrare la adresă' : 'În locație'}</p>
            <p className="text-xs text-muted-foreground">{type === 'delivery' ? 'Comandă livrată la adresa ta' : 'Ridici comanda din locație'}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const AddressContent: React.FC<{ data: CheckoutDisplayData; cardClass?: string }> = ({ data }) => {
  const { isInLocation, isLoadingAddresses, savedAddresses, showManualForm, selectedAddressId, selectAddress, handleManualEntry, formData, handleChange, errors, isLoading, manualFormRef } = data;

  if (isInLocation) return (
    <div ref={manualFormRef} className="space-y-4">
      <Alert><AlertDescription>Vei ridica comanda din locație.</AlertDescription></Alert>
      <FormInput name="phone" type="tel" label={texts.auth.phoneLabel} placeholder={texts.auth.phonePlaceholder} value={formData.phone} onChange={handleChange} error={errors.phone} required disabled={isLoading} />
      <FormInput name="tableNumber" type="text" label="Număr masă" placeholder="Ex: 5 (opțional)" value={formData.tableNumber ?? ''} onChange={handleChange} error={errors.tableNumber} disabled={isLoading} />
    </div>
  );

  return (
    <>
      {isLoadingAddresses ? (
        <div className="flex justify-center py-4"><Loader size="md" /></div>
      ) : savedAddresses.length > 0 && !showManualForm ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Selectează o adresă salvată sau introdu una nouă</p>
          <div className="space-y-2" role="radiogroup">
            {savedAddresses.map((address) => (
              <div key={address.id} role="radio" aria-checked={selectedAddressId === address.id} tabIndex={0}
                className={cn('flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-colors', selectedAddressId === address.id && 'border-primary bg-primary/5')}
                onClick={() => selectAddress(address)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectAddress(address); } }}>
                <div className={cn('mt-1 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center', selectedAddressId === address.id ? 'border-primary bg-primary' : 'border-muted-foreground')}>
                  {selectedAddressId === address.id && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{address.label}</div>
                  <div className="text-sm text-muted-foreground">{address.address}, {address.city}</div>
                  <div className="text-sm text-muted-foreground">{address.phone}</div>
                </div>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={handleManualEntry} className="mt-2">
            <Plus className="h-4 w-4 mr-2" />Introdu altă adresă
          </Button>
        </div>
      ) : null}

      {(showManualForm || savedAddresses.length === 0) && (
        <div ref={manualFormRef} className="space-y-4 mt-4">
          {savedAddresses.length > 0 && <Alert><AlertDescription>Completează adresa de livrare pentru această comandă</AlertDescription></Alert>}
          <FormInput name="deliveryAddress" type="text" label={texts.profile.addressLabel} placeholder={texts.profile.addressPlaceholder} value={formData.deliveryAddress} onChange={handleChange} error={errors.deliveryAddress} required disabled={isLoading} />
          <FormInput name="deliveryCity" type="text" label={texts.profile.cityLabel} placeholder={texts.profile.cityPlaceholder} value={formData.deliveryCity} onChange={handleChange} error={errors.deliveryCity} required disabled={isLoading} />
          <FormInput name="phone" type="tel" label={texts.auth.phoneLabel} placeholder={texts.auth.phonePlaceholder} value={formData.phone} onChange={handleChange} error={errors.phone} required disabled={isLoading} />
        </div>
      )}

      {selectedAddressId && !showManualForm && (
        <div className="rounded-lg bg-muted/50 p-4 mt-4">
          <p className="text-sm font-medium mb-1">Adresa selectată:</p>
          <p className="text-sm">{formData.deliveryAddress}</p>
          <p className="text-sm text-muted-foreground">{formData.deliveryCity}</p>
          <p className="text-sm text-muted-foreground">{formData.phone}</p>
        </div>
      )}
    </>
  );
};

export const PaymentSelector: React.FC<{ data: CheckoutDisplayData }> = ({ data }) => (
  <div className="space-y-3" role="radiogroup">
    {([{ value: 'cash' as const, icon: Banknote, label: texts.checkout.cash }, { value: 'card' as const, icon: CreditCard, label: texts.checkout.card }]).map(({ value, icon: Icon, label }) => (
      <div key={value} role="radio" aria-checked={data.formData.paymentMethod === value} tabIndex={0}
        className={cn('flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors', data.formData.paymentMethod === value && 'border-primary bg-primary/5')}
        onClick={() => data.handlePaymentChange(value)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); data.handlePaymentChange(value); } }}>
        <div className={cn('h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center', data.formData.paymentMethod === value ? 'border-primary bg-primary' : 'border-muted-foreground')}>
          {data.formData.paymentMethod === value && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
        </div>
        <div className="flex items-center gap-2 flex-1">
          <Icon className="h-5 w-5" />
          {label}
          {value === 'card' && <span className="text-xs text-muted-foreground ml-auto">(TODO: Integrare plată online)</span>}
        </div>
      </div>
    ))}
  </div>
);

export const OrderSummaryContent: React.FC<{ data: CheckoutDisplayData }> = ({ data }) => (
  <>
    <CardHeader><CardTitle>{texts.checkout.orderSummary}</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        {data.items.map(({ product, quantity }) => (
          <div key={product.id} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{product.name} x {quantity}</span>
            <span>{product.price * quantity} {texts.common.currency}</span>
          </div>
        ))}
      </div>
      <Separator />
      <div className="flex justify-between"><span className="text-muted-foreground">{texts.cart.subtotal}</span><span className="font-medium">{data.subtotal} {texts.common.currency}</span></div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">{texts.cart.delivery}</span>
        <span className="font-medium">{data.effectiveDeliveryFee === 0 ? <span className="text-primary">{texts.cart.freeDelivery}</span> : `${data.deliveryFee} ${texts.common.currency}`}</span>
      </div>
      {data.discountFromPoints > 0 && <div className="flex justify-between text-sm text-primary"><span>Reducere puncte</span><span>-{data.discountFromPoints} {texts.common.currency}</span></div>}
      <Separator />
      <div className="flex justify-between text-lg font-bold"><span>{texts.cart.total}</span><span className="text-primary">{data.displayTotal} {texts.common.currency}</span></div>
    </CardContent>
  </>
);

export const SubmitButton: React.FC<{ isLoading: boolean }> = ({ isLoading }) => (
  <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
    {isLoading ? <><Loader size="sm" className="mr-2" />{texts.checkout.processing}</> : texts.checkout.placeOrder}
  </Button>
);

/** Checkout template used by all style variants */
export const CheckoutTemplate: React.FC<{ data: CheckoutDisplayData; variant: StyleName }> = ({ data, variant }) => {

  if (data.isCartEmpty && !data.isSuccess) return null;

  if (data.isSuccess) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-6 flex justify-center"><div className="rounded-full bg-primary/10 p-6"><CheckCircle className="h-12 w-12 text-primary" /></div></div>
            <h1 className="text-2xl font-bold mb-2 text-foreground">{texts.checkout.orderSuccess}</h1>
            <p className="text-muted-foreground mb-8">{texts.checkout.orderSuccessMessage}</p>
            <Button onClick={() => data.navigate(routes.home)}>{texts.checkout.backToHome}</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const cardCn = cn(
    variant === 'gamified' && 'border-primary/15 shadow-md',
    variant === 'clean' && 'border-border/40 shadow-none',
    variant === 'premium' && 'border-border/20 bg-background/60 backdrop-blur-xl shadow-sm',
    variant === 'friendly' && 'rounded-2xl border-border/30 shadow-sm',
  );

  const summaryCn = cn(
    'sticky top-24',
    variant === 'gamified' && 'border-primary/20 shadow-xl bg-gradient-to-b from-primary/5 to-background',
    variant === 'clean' && 'border-border/40',
    variant === 'premium' && 'border-border/20 bg-background/60 backdrop-blur-xl shadow-lg',
    variant === 'friendly' && 'rounded-2xl border-border/30 shadow-lg bg-secondary/5',
  );

  const titleCn = cn(
    'text-3xl mb-8 text-foreground',
    variant === 'gamified' && 'font-extrabold',
    variant === 'clean' && 'text-2xl font-medium',
    variant === 'premium' && 'font-semibold tracking-tight',
    variant === 'friendly' && 'font-bold',
  );

  return (
    <ProtectedRoute>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className={titleCn}>{texts.checkout.title}</h1>
          <form onSubmit={data.handleSubmit}>
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <Card className={cardCn}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" />{texts.checkout.deliveryInfo}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FulfillmentSelector data={data} />
                    <AddressContent data={data} />
                  </CardContent>
                </Card>
                <Card className={cardCn}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />{texts.checkout.paymentMethod}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PaymentSelector data={data} />
                    {data.pointsEnabled && (
                      <PointsCheckoutSelector userPoints={data.userPoints} rewards={data.pointsRewards} formData={data.formData} onPointsChange={(p) => data.setFormData((prev) => ({ ...prev, pointsToUse: p }))} currency={texts.common.currency} />
                    )}
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card className={summaryCn}>
                  <OrderSummaryContent data={data} />
                  <CardFooter><SubmitButton isLoading={data.isLoading} /></CardFooter>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};
