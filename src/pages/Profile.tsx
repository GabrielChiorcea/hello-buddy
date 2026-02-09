/**
 * Profile page component
 */

import React, { useEffect } from 'react';
import { User, Package, Settings, MapPin, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Loader, PageLoader } from '@/components/common/Loader';
import { AddressManager } from '@/components/profile/AddressManager';
import { AccountSettings } from '@/components/profile/AccountSettings';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchOrders, logout } from '@/store/slices/userSlice';
import { texts } from '@/config/texts';
import { routes } from '@/config/routes';
import { toast } from '@/hooks/use-toast';
import { OrderStatus } from '@/types';
import { PointsBalance, PointsOrderBadge } from '@/plugins/points';
import { usePluginEnabled } from '@/hooks/usePluginEnabled';
import { format, isValid } from 'date-fns';
import { ro } from 'date-fns/locale';

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
  const { user, orders, ordersLoading } = useAppSelector((state) => state.user);

  const handleLogout = async () => {
    await dispatch(logout());
    toast({ title: texts.notifications.logoutSuccess });
    navigate(routes.home);
  };

  const formatOrderDate = (value: unknown): string => {
    try {
      if (value == null || value === '') return '—';
      let d: Date;
      if (typeof value === 'number') {
        d = new Date(value);
      } else if (typeof value === 'string' && /^\d+$/.test(value)) {
        // Backend poate trimite timestamp ca string "1770570765000"
        d = new Date(parseInt(value, 10));
      } else {
        d = new Date(value as string | number);
      }
      if (!isValid(d)) return '—';
      return format(d, 'PPpp', { locale: ro });
    } catch {
      return '—';
    }
  };

  useEffect(() => {
    if (user) {
      dispatch(fetchOrders());
    }
  }, [user, dispatch]);

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
                <CardHeader>
                  <CardTitle>{texts.profile.personalInfo}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <PointsBalance points={user.pointsBalance ?? 0} />
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
                                  Plasată pe {formatOrderDate(order.createdAt)}
                                </p>
                                {order.deliveredAt && (
                                  <p className="text-sm text-muted-foreground mt-0.5">
                                    Livrată pe {formatOrderDate(order.deliveredAt)}
                                  </p>
                                )}
                              </div>
                              <Badge variant={orderStatusLabels[order.status].variant}>
                                {orderStatusLabels[order.status].label}
                              </Badge>
                            </div>
                            
                            <div className="space-y-2 mb-4">
                              {order.items.map((item, idx) => (
                                <div key={item.id ?? `${order.id}-${item.productName}-${idx}`} className="flex justify-between text-sm">
                                  <span>{item.productName} x {item.quantity}</span>
                                  <span>
                                    {(item.priceAtOrder * item.quantity).toFixed(2)} {texts.common.currency}
                                  </span>
                                </div>
                              ))}
                            </div>
                            
                            <PointsOrderBadge order={order} />
                            
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

          <div className="mt-8 flex justify-end">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {texts.nav.logout}
            </Button>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default Profile;
