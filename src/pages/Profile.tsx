/**
 * Profile page component
 */

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { User, Package, Edit2, Save, X, Settings, MapPin, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { FormInput } from '@/components/common/FormInput';
import { Loader, PageLoader } from '@/components/common/Loader';
import { AddressManager } from '@/components/profile/AddressManager';
import { AccountSettings } from '@/components/profile/AccountSettings';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { updateProfile, fetchOrders, logout } from '@/store/slices/userSlice';
import { texts } from '@/config/texts';
import { routes } from '@/config/routes';
import { toast } from '@/hooks/use-toast';
import { ProfileUpdateData, OrderStatus } from '@/types';
import { format, isValid } from 'date-fns';
import { ro } from 'date-fns/locale';

// Validation schema
const profileSchema = z.object({
  name: z.string().trim().min(2, texts.validation.invalidName).max(100),
  phone: z
    .string()
    .trim()
    .min(10, texts.validation.invalidPhone)
    .max(15)
    .regex(/^[0-9+\s-]+$/, texts.validation.invalidPhone),
  address: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
});

type FormErrors = Partial<Record<keyof ProfileUpdateData, string>>;

const orderStatusLabels: Record<OrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'În așteptare', variant: 'outline' },
  confirmed: { label: 'Confirmat', variant: 'secondary' },
  preparing: { label: 'În preparare', variant: 'secondary' },
  delivering: { label: 'În livrare', variant: 'default' },
  delivered: { label: 'Livrat', variant: 'default' },
  cancelled: { label: 'Anulat', variant: 'destructive' },
};

const Profile: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isLoading, orders, ordersLoading } = useAppSelector((state) => state.user);

  const handleLogout = async () => {
    await dispatch(logout());
    toast({ title: texts.notifications.logoutSuccess });
    navigate(routes.home);
  };

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileUpdateData>({
    name: '',
    phone: '',
    address: '',
    city: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const formatOrderDate = (value: unknown): string => {
    try {
      if (typeof value !== 'string' || !value) return '—';
      const d = new Date(value);
      if (!isValid(d)) return '—';
      return format(d, 'PPpp', { locale: ro });
    } catch {
      return '—';
    }
  };

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        phone: user.phone,
        address: user.address || '',
        city: user.city || '',
      });
      dispatch(fetchOrders());
    }
  }, [user, dispatch]);

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

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      setFormData({
        name: user.name,
        phone: user.phone,
        address: user.address || '',
        city: user.city || '',
      });
    }
    setErrors({});
  };

  const validateForm = (): boolean => {
    try {
      profileSchema.parse(formData);
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

  const handleSave = async () => {
    if (!validateForm() || !user) return;

    const result = await dispatch(updateProfile({ userId: user.id, data: formData }));
    
    if (updateProfile.fulfilled.match(result)) {
      toast({
        title: texts.notifications.profileUpdated,
      });
      setIsEditing(false);
    } else if (updateProfile.rejected.match(result)) {
      toast({
        title: texts.common.error,
        description: result.payload as string,
        variant: 'destructive',
      });
    }
  };

  if (!user) {
    return (
      <Layout>
        <PageLoader />
      </Layout>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8 text-foreground">{texts.profile.title}</h1>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{texts.profile.personalInfo}</span>
                <span className="sm:hidden">Profil</span>
              </TabsTrigger>
              <TabsTrigger value="addresses" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">{texts.profile.deliveryAddresses}</span>
                <span className="sm:hidden">Adrese</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">{texts.profile.orderHistory}</span>
                <span className="sm:hidden">Comenzi</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">{texts.profile.settings}</span>
                <span className="sm:hidden">Setări</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{texts.profile.personalInfo}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button variant="outline" onClick={handleEdit}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      {texts.profile.editProfile}
                    </Button>
                  ) : (
                    <div className="flex flex-col md:flex-row gap-2">
                      <Button variant="outline" onClick={handleCancel}>
                        <X className="mr-2 h-4 w-4" />
                        {texts.profile.cancel}
                      </Button>
                      <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading ? (
                          <Loader size="sm" className="mr-2" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        {texts.profile.saveChanges}
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormInput
                      name="name"
                      type="text"
                      label={texts.auth.nameLabel}
                      value={formData.name}
                      onChange={handleChange}
                      error={errors.name}
                      disabled={!isEditing || isLoading}
                    />
                    <FormInput
                      name="phone"
                      type="tel"
                      label={texts.auth.phoneLabel}
                      value={formData.phone}
                      onChange={handleChange}
                      error={errors.phone}
                      disabled={!isEditing || isLoading}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormInput
                      name="address"
                      type="text"
                      label={texts.profile.addressLabel}
                      placeholder={texts.profile.addressPlaceholder}
                      value={formData.address}
                      onChange={handleChange}
                      error={errors.address}
                      disabled={!isEditing || isLoading}
                    />
                    <FormInput
                      name="city"
                      type="text"
                      label={texts.profile.cityLabel}
                      placeholder={texts.profile.cityPlaceholder}
                      value={formData.city}
                      onChange={handleChange}
                      error={errors.city}
                      disabled={!isEditing || isLoading}
                    />
                  </div>
                  <Separator className="my-6" />
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="w-full sm:w-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {texts.nav.logout}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Addresses Tab */}
            <TabsContent value="addresses">
              <Card>
                <CardHeader>
                  <CardTitle>{texts.profile.deliveryAddresses}</CardTitle>
                </CardHeader>
                <CardContent>
                  <AddressManager />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>{texts.profile.orderHistory}</CardTitle>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader size="lg" />
                    </div>
                  ) : orders.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      {texts.profile.noOrders}
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <Card key={order.id} className="bg-muted/30">
                          <CardContent className="p-4">
                            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                              <div>
                                <p className="font-semibold text-foreground">
                                  Comandă #{order.id.slice(-6).toUpperCase()}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {formatOrderDate(order.createdAt)}
                                </p>
                              </div>
                              <Badge variant={orderStatusLabels[order.status].variant}>
                                {orderStatusLabels[order.status].label}
                              </Badge>
                            </div>
                            
                            <div className="space-y-2 mb-4">
                              {order.items.map((item) => (
                                <div key={item.id ?? `${item.productId ?? 'deleted'}-${item.productName}`} className="flex justify-between text-sm">
                                  <span>{item.productName} x {item.quantity}</span>
                                  <span>
                                    {(item.priceAtOrder * item.quantity).toFixed(2)} {texts.common.currency}
                                  </span>
                                </div>
                              ))}
                            </div>
                            
                            <Separator className="my-4" />
                            
                            <div className="flex justify-between font-semibold">
                              <span>Total</span>
                              <span className="text-primary">
                                {order.total} {texts.common.currency}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <AccountSettings userId={user.id} userEmail={user.email} />
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default Profile;
