/**
 * Checkout page component
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { CreditCard, Banknote, MapPin, CheckCircle, Plus, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { FormInput } from '@/components/common/FormInput';
import { Loader } from '@/components/common/Loader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAppDispatch, useAppSelector } from '@/store';
import { resetCart } from '@/store/slices/cartSlice';
import { fetchAddresses, fetchCurrentUser } from '@/store/slices/userSlice';
import { placeOrderApi, createPaymentSessionApi } from '@/api/api';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import { toast } from '@/hooks/use-toast';
import { PaymentMethod, CheckoutData, DeliveryAddress, FulfillmentType } from '@/types';
import { cn } from '@/lib/utils';
import { PointsCheckoutSelector, usePointsRewards } from '@/plugins/points';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';

// Validation schema - adresa obligatorie doar pentru livrare
const createCheckoutSchema = (fulfillmentType: FulfillmentType) =>
  z.object({
    deliveryAddress: fulfillmentType === 'in_location'
      ? z.string().optional()
      : z.string().trim().min(5, 'Adresa trebuie să aibă minim 5 caractere').max(200),
    deliveryCity: fulfillmentType === 'in_location'
      ? z.string().optional()
      : z.string().trim().min(2, 'Orașul trebuie să aibă minim 2 caractere').max(100),
    phone: z
      .string()
      .trim()
      .min(10, texts.validation.invalidPhone)
      .max(15)
      .regex(/^[0-9+\s-]+$/, texts.validation.invalidPhone),
    paymentMethod: z.enum(['cash', 'card']),
  });

type FormErrors = Partial<Record<keyof CheckoutData, string>>;

const Checkout: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, addresses: savedAddresses, addressesLoading: isLoadingAddresses, addressesFetched } = useAppSelector((state) => state.user);
  const { items, subtotal, deliveryFee, total } = useAppSelector((state) => state.cart);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const manualFormRef = useRef<HTMLDivElement>(null);

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
  const [isSuccess, setIsSuccess] = useState(false);

  const { enabled: pointsEnabled } = usePluginEnabled('points');
  const { pointsRewards } = usePointsRewards();
  const userPoints = pointsEnabled ? (user?.pointsBalance ?? 0) : 0;

  const selectedReward = formData.pointsToUse
    ? pointsRewards.find((r) => r.pointsCost === formData.pointsToUse)
    : null;
  const discountFromPoints = selectedReward?.discountAmount ?? 0;
  const isInLocation = formData.fulfillmentType === 'in_location';
  const effectiveDeliveryFee = isInLocation ? 0 : deliveryFee;
  const displayTotal = Math.max(0, subtotal + effectiveDeliveryFee - discountFromPoints);

  const isCartEmpty = items.length === 0;

  const selectAddress = useCallback((address: DeliveryAddress) => {
    setSelectedAddressId(address.id);
    setFormData(prev => ({
      ...prev,
      deliveryAddress: address.address,
      deliveryCity: address.city,
      phone: address.phone,
    }));
    setShowManualForm(false);
    setErrors({});
  }, []);

  // Încarcă adresele din Redux (o singură cerere, apoi folosim cache-ul)
  useEffect(() => {
    if (user && !addressesFetched) {
      dispatch(fetchAddresses());
    }
  }, [user, addressesFetched, dispatch]);

  // Sincronizează puncte la intrare pe Checkout (când admin poate fi marcat livrarea în alt tab)
  useEffect(() => {
    if (pointsEnabled && user) {
      dispatch(fetchCurrentUser());
    }
  }, [pointsEnabled, user?.id, dispatch]);

  // Auto-select adresa implicită când adresele se încarcă (nu când user a ales manual entry)
  useEffect(() => {
    if (showManualForm) return; // User a ales explicit "Introdu altă adresă"
    if (savedAddresses.length > 0 && !selectedAddressId) {
      const defaultAddr = savedAddresses.find(a => a.isDefault);
      if (defaultAddr) {
        selectAddress(defaultAddr);
      } else {
        setShowManualForm(true);
      }
    } else if (addressesFetched && savedAddresses.length === 0) {
      // Așteptăm fetch-ul să se termine; doar dacă avem 0 adrese după fetch, afișăm formularul.
      setShowManualForm(true);
    }
  }, [savedAddresses, isLoadingAddresses, addressesFetched, selectedAddressId, showManualForm, selectAddress]);

  const handleManualEntry = () => {
    // Defer state updates pentru a evita conflict în timpul render
    queueMicrotask(() => {
      setSelectedAddressId(null);
      setShowManualForm(true);
      setFormData(prev => ({
        ...prev,
        deliveryAddress: '',
        deliveryCity: '',
        phone: user?.phone || '',
      }));
    });
    setTimeout(() => manualFormRef.current?.scrollIntoView({ behavior: 'smooth' }), 150);
  };

  // Sanitize input
  const sanitizeInput = (value: string): string => {
    return value.replace(/[<>]/g, '');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: sanitizeInput(value),
    }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePaymentChange = (value: PaymentMethod) => {
    setFormData((prev) => ({ ...prev, paymentMethod: value }));
  };

  const handleFulfillmentChange = (value: FulfillmentType) => {
    setFormData((prev) => ({
      ...prev,
      fulfillmentType: value,
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
        const newErrors: FormErrors = {};
        err.errors.forEach((error) => {
          const field = error.path[0] as keyof FormErrors;
          newErrors[field] = error.message;
        });
        setErrors(newErrors);
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
        if (result.success && result.data) {
          if (result.data.redirectUrl) {
            window.location.href = result.data.redirectUrl;
            return;
          }
          if (result.data.clientSecret) {
            toast({
              title: texts.common.error,
              description: 'Plata embedded nu este configurată. Folosiți redirect.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: texts.common.error,
              description: result.error ?? 'Eroare la crearea sesiunii de plată',
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: texts.common.error,
            description: result.error ?? texts.notifications.orderError,
            variant: 'destructive',
          });
        }
        setIsLoading(false);
        return;
      }

      const result = await placeOrderApi(
        user.id,
        items,
        formData,
        subtotal,
        effectiveDeliveryFee,
        displayTotal
      );

      if (result.success) {
        setIsSuccess(true);
        dispatch(resetCart());
        dispatch(fetchCurrentUser());
        toast({
          title: texts.notifications.orderPlaced,
        });
      } else {
        toast({
          title: texts.common.error,
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: texts.common.error,
        description: texts.notifications.orderError,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect dacă coșul e gol (fără setState/navigate în timpul render-ului)
  useEffect(() => {
    if (isCartEmpty && !isSuccess) {
      navigate(routes.cart, { replace: true });
    }
  }, [isCartEmpty, isSuccess, navigate]);

  if (isCartEmpty && !isSuccess) {
    return null;
  }

  // Success state
  if (isSuccess) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-primary/10 p-6">
                <CheckCircle className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-foreground">
              {texts.checkout.orderSuccess}
            </h1>
            <p className="text-muted-foreground mb-8">
              {texts.checkout.orderSuccessMessage}
            </p>
            <Button onClick={() => navigate(routes.home)}>
              {texts.checkout.backToHome}
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8 text-foreground">{texts.checkout.title}</h1>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Checkout Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Delivery Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {texts.checkout.deliveryInfo}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Fulfillment type: Livrare / În locație */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        Cum dorești să primești comanda?
                      </p>
                      <div className="flex gap-4" role="radiogroup" aria-label="Selectează tip livrare">
                        <div
                          role="radio"
                          aria-checked={formData.fulfillmentType === 'delivery'}
                          tabIndex={0}
                          className={cn(
                            'flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors',
                            formData.fulfillmentType === 'delivery' && 'border-primary bg-primary/5'
                          )}
                          onClick={() => handleFulfillmentChange('delivery')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleFulfillmentChange('delivery');
                            }
                          }}
                        >
                          <MapPin className="h-5 w-5 shrink-0" />
                          <div>
                            <p className="font-medium">Livrare la adresă</p>
                            <p className="text-xs text-muted-foreground">Comandă livrată la adresa ta</p>
                          </div>
                        </div>
                        <div
                          role="radio"
                          aria-checked={formData.fulfillmentType === 'in_location'}
                          tabIndex={0}
                          className={cn(
                            'flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors',
                            formData.fulfillmentType === 'in_location' && 'border-primary bg-primary/5'
                          )}
                          onClick={() => handleFulfillmentChange('in_location')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleFulfillmentChange('in_location');
                            }
                          }}
                        >
                          <Store className="h-5 w-5 shrink-0" />
                          <div>
                            <p className="font-medium">În locație</p>
                            <p className="text-xs text-muted-foreground">Ridici comanda din locație</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Saved Addresses Section - doar pentru livrare */}
                    {!isInLocation && isLoadingAddresses ? (
                      <div className="flex justify-center py-4">
                        <Loader size="md" />
                      </div>
                    ) : !isInLocation && savedAddresses.length > 0 && !showManualForm ? (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-muted-foreground">
                          Selectează o adresă salvată sau introdu una nouă
                        </p>
                        
                        <div className="space-y-2" role="radiogroup" aria-label="Selectează adresa de livrare">
                          {savedAddresses.map((address) => (
                            <div
                              key={address.id}
                              role="radio"
                              aria-checked={selectedAddressId === address.id}
                              tabIndex={0}
                              className={cn(
                                'flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-colors',
                                selectedAddressId === address.id && 'border-primary bg-primary/5'
                              )}
                              onClick={() => selectAddress(address)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  selectAddress(address);
                                }
                              }}
                            >
                              <div
                                className={cn(
                                  'mt-1 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center',
                                  selectedAddressId === address.id
                                    ? 'border-primary bg-primary'
                                    : 'border-muted-foreground'
                                )}
                              >
                                {selectedAddressId === address.id && (
                                  <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium">{address.label}</div>
                                <div className="text-sm text-muted-foreground">
                                  {address.address}, {address.city}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {address.phone}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleManualEntry}
                          className="mt-2"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Introdu altă adresă
                        </Button>
                      </div>
                    ) : null}

                    {/* Manual Address Form - doar pentru livrare */}
                    {!isInLocation && (showManualForm || savedAddresses.length === 0) && (
                      <div ref={manualFormRef} className="space-y-4 mt-4">
                        {savedAddresses.length > 0 && (
                          <Alert>
                            <AlertDescription>
                              Completează adresa de livrare pentru această comandă
                            </AlertDescription>
                          </Alert>
                        )}

                        <FormInput
                          name="deliveryAddress"
                          type="text"
                          label={texts.profile.addressLabel}
                          placeholder={texts.profile.addressPlaceholder}
                          value={formData.deliveryAddress}
                          onChange={handleChange}
                          error={errors.deliveryAddress}
                          required
                          disabled={isLoading}
                        />
                        <FormInput
                          name="deliveryCity"
                          type="text"
                          label={texts.profile.cityLabel}
                          placeholder={texts.profile.cityPlaceholder}
                          value={formData.deliveryCity}
                          onChange={handleChange}
                          error={errors.deliveryCity}
                          required
                          disabled={isLoading}
                        />
                        <FormInput
                          name="phone"
                          type="tel"
                          label={texts.auth.phoneLabel}
                          placeholder={texts.auth.phonePlaceholder}
                          value={formData.phone}
                          onChange={handleChange}
                          error={errors.phone}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    )}

                    {/* Pentru în locație - telefon și număr masă */}
                    {isInLocation && (
                      <div ref={manualFormRef} className="space-y-4">
                        <Alert>
                          <AlertDescription>
                            Vei ridica comanda din locație. Indicați numărul de telefon și masa la care așteptați (dacă aveți).
                          </AlertDescription>
                        </Alert>
                        <FormInput
                          name="phone"
                          type="tel"
                          label={texts.auth.phoneLabel}
                          placeholder={texts.auth.phonePlaceholder}
                          value={formData.phone}
                          onChange={handleChange}
                          error={errors.phone}
                          required
                          disabled={isLoading}
                        />
                        <FormInput
                          name="tableNumber"
                          type="text"
                          label="Număr masă"
                          placeholder="Ex: 5 (opțional dacă nu sunt mese)"
                          value={formData.tableNumber ?? ''}
                          onChange={handleChange}
                          error={errors.tableNumber}
                          disabled={isLoading}
                        />
                      </div>
                    )}

                    {/* Show selected address summary when not in manual mode (livrare) */}
                    {!isInLocation && selectedAddressId && !showManualForm && (
                      <div className="rounded-lg bg-muted/50 p-4 mt-4">
                        <p className="text-sm font-medium mb-1">Adresa selectată:</p>
                        <p className="text-sm">{formData.deliveryAddress}</p>
                        <p className="text-sm text-muted-foreground">{formData.deliveryCity}</p>
                        <p className="text-sm text-muted-foreground">{formData.phone}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      {texts.checkout.paymentMethod}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3" role="radiogroup" aria-label="Selectează metoda de plată">
                      <div
                        role="radio"
                        aria-checked={formData.paymentMethod === 'cash'}
                        tabIndex={0}
                        className={cn(
                          'flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors',
                          formData.paymentMethod === 'cash' && 'border-primary bg-primary/5'
                        )}
                        onClick={() => handlePaymentChange('cash')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handlePaymentChange('cash');
                          }
                        }}
                      >
                        <div
                          className={cn(
                            'h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center',
                            formData.paymentMethod === 'cash'
                              ? 'border-primary bg-primary'
                              : 'border-muted-foreground'
                          )}
                        >
                          {formData.paymentMethod === 'cash' && (
                            <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          <Banknote className="h-5 w-5" />
                          {texts.checkout.cash}
                        </div>
                      </div>
                      <div
                        role="radio"
                        aria-checked={formData.paymentMethod === 'card'}
                        tabIndex={0}
                        className={cn(
                          'flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors',
                          formData.paymentMethod === 'card' && 'border-primary bg-primary/5'
                        )}
                        onClick={() => handlePaymentChange('card')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handlePaymentChange('card');
                          }
                        }}
                      >
                        <div
                          className={cn(
                            'h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center',
                            formData.paymentMethod === 'card'
                              ? 'border-primary bg-primary'
                              : 'border-muted-foreground'
                          )}
                        >
                          {formData.paymentMethod === 'card' && (
                            <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          <CreditCard className="h-5 w-5" />
                          {texts.checkout.card}
                          <span className="text-xs text-muted-foreground ml-auto">
                            (TODO: Integrare plată online)
                          </span>
                        </div>
                      </div>
                    </div>

                    {pointsEnabled && (
                      <PointsCheckoutSelector
                        userPoints={userPoints}
                        rewards={pointsRewards}
                        formData={formData}
                        onPointsChange={(p) => setFormData((prev) => ({ ...prev, pointsToUse: p }))}
                        currency={texts.common.currency}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary */}
              <div>
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>{texts.checkout.orderSummary}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Items Summary */}
                    <div className="space-y-2">
                      {items.map(({ product, quantity }) => (
                        <div key={product.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {product.name} x {quantity}
                          </span>
                          <span>{product.price * quantity} {texts.common.currency}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{texts.cart.subtotal}</span>
                      <span className="font-medium">{subtotal} {texts.common.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{texts.cart.delivery}</span>
                      <span className="font-medium">
                        {effectiveDeliveryFee === 0 ? (
                          <span className="text-primary">{texts.cart.freeDelivery}</span>
                        ) : (
                          `${deliveryFee} ${texts.common.currency}`
                        )}
                      </span>
                    </div>
                    {discountFromPoints > 0 && (
                      <div className="flex justify-between text-sm text-primary">
                        <span>Reducere puncte</span>
                        <span>-{discountFromPoints} {texts.common.currency}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>{texts.cart.total}</span>
                      <span className="text-primary">{displayTotal} {texts.common.currency}</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader size="sm" className="mr-2" />
                          {texts.checkout.processing}
                        </>
                      ) : (
                        texts.checkout.placeOrder
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default Checkout;
