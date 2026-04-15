/**
 * Pagină succes după plasarea comenzii (cash sau card).
 * Afișează detaliile complete ale comenzii: produse, sume, status și CTA-uri.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  ShoppingBag,
  MapPin,
  Clock,
  ChevronRight,
  Receipt,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { PageLoader } from '@/components/common/Loader';
import { useAppDispatch, useAppSelector } from '@/store';
import { resetCart } from '@/store/slices/cartSlice';
import { fetchCurrentUser } from '@/store/slices/userSlice';
import { confirmPaymentSessionApi } from '@/api/api';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import { toast } from '@/hooks/use-toast';
import { getImageUrl } from '@/lib/imageUrl';
import { formatDisplayNumber } from '@/lib/utils';
import type { Order, OrderItem } from '@/types';

// Etapele de tracking al comenzii
const ORDER_STEPS = [
  { key: 'pending', label: 'Comandă primită', icon: Receipt },
  { key: 'confirmed', label: 'Confirmată', icon: CheckCircle },
  { key: 'preparing', label: 'În preparare', icon: Clock },
  { key: 'delivering', label: 'În livrare', icon: MapPin },
  { key: 'delivered', label: 'Livrat', icon: Star },
] as const;

type TrackableStatus = 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'delivered';

function getStepIndex(status: string): number {
  return ORDER_STEPS.findIndex((s) => s.key === status);
}

interface OrderSummaryProps {
  order: Order;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ order }) => {
  const currentStep = getStepIndex(order.status);
  const { user } = useAppSelector((s) => s.user);
  const pointsEarned = order.pointsEarned ?? 0;
  const totalSavings = (order.discountFromPoints ?? 0) + (order.discountFromFreeProducts ?? 0) + (order.deliveryFee === 0 ? 10 : 0);
  const formatMoney = (value: number) =>
    `${formatDisplayNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RON`;
  const formatInteger = (value: number) => formatDisplayNumber(value, { maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      {/* Header succes */}
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-primary/10 p-5">
            <CheckCircle className="h-14 w-14 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-1">Comandă plasată!</h1>
        <p className="text-muted-foreground text-sm">
          #{order.id.slice(0, 8).toUpperCase()} · {new Date(order.createdAt).toLocaleString('ro-RO')}
        </p>
      </div>

      {/* Tracker status */}
      {order.status !== 'cancelled' && (
        <div className="bg-card border rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Status comandă
          </h2>
          <div className="relative">
            {/* Linie de progres */}
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-border mx-8" />
            <div
              className="absolute top-4 left-0 h-0.5 bg-primary mx-8 transition-all duration-700"
              style={{
                width: `${currentStep >= 0 ? (currentStep / (ORDER_STEPS.length - 1)) * 100 : 0}%`,
              }}
            />
            <div className="relative flex justify-between">
              {ORDER_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const done = idx <= currentStep;
                return (
                  <div key={step.key} className="flex flex-col items-center gap-2 flex-1">
                    <div
                      className={`z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        done
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-[10px] text-center leading-tight ${
                        done ? 'text-primary font-medium' : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          {order.estimatedDelivery && (
            <p className="text-xs text-center text-muted-foreground mt-4">
              Timp estimat:{' '}
              <span className="font-semibold text-foreground">
                {new Date(order.estimatedDelivery).toLocaleTimeString('ro-RO', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </p>
          )}
        </div>
      )}

      {/* Produse comandate */}
      <div className="bg-card border rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Produse comandate
        </h2>
        <div className="space-y-3">
          {order.items.map((item: OrderItem, idx: number) => (
            <div key={idx} className="flex items-center gap-3">
              {item.productImage ? (
                <img
                  src={getImageUrl(item.productImage)}
                  alt={item.productName}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{item.productName}</p>
                <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                {item.configuration && item.configuration.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.configuration.map((g: any) =>
                      `${g.groupName}: ${g.options.map((o: any) =>
                        o.priceDelta ? `${o.name} (+${formatMoney(o.priceDelta)})` : o.name
                      ).join(', ')}`
                    ).join(' · ')}
                  </p>
                )}
              </div>
              <p className="text-sm font-semibold text-foreground whitespace-nowrap">
                {formatMoney((item.unitPriceWithConfiguration ?? item.priceAtOrder) * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        {/* Sumar financiar */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatMoney(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Livrare</span>
            <span>
              {order.deliveryFee === 0 ? (
                <span className="text-primary font-medium">Gratuită</span>
              ) : (
                formatMoney(order.deliveryFee)
              )}
            </span>
          </div>
          {(order.discountFromPoints ?? 0) > 0 && (
            <div className="flex justify-between text-primary">
              <span>Reducere puncte</span>
              <span>-{formatMoney(order.discountFromPoints ?? 0)}</span>
            </div>
          )}
          {(order.discountFromFreeProducts ?? 0) > 0 && (
            <div className="flex justify-between text-success">
              <span>Produse gratuite</span>
              <span>-{formatMoney(order.discountFromFreeProducts ?? 0)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-bold text-base text-foreground">
            <span>Total</span>
            <span>{formatMoney(order.total)}</span>
          </div>

          {/* Savings banner */}
          {totalSavings > 0 && (
            <div className="bg-success/10 border border-success/20 rounded-lg p-3 text-center mt-2">
              <p className="text-sm font-bold text-success">
                🔥 Ai economisit {formatMoney(totalSavings)} la această comandă!
              </p>
            </div>
          )}
        </div>

        {/* Points earned — prominent card */}
        {pointsEarned > 0 && (
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20 rounded-2xl p-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="w-6 h-6 text-primary fill-primary" />
              <p className="text-xl font-extrabold text-primary">+{formatInteger(pointsEarned)} puncte câștigate!</p>
            </div>
            {user?.pointsBalance != null && (
              <p className="text-sm text-muted-foreground">
                Sold total: <strong className="text-foreground">{formatInteger(user.pointsBalance)} puncte</strong>
              </p>
            )}
            {user?.xpToNextLevel != null && user.nextTier && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>{user.tier?.name ?? 'Nivel curent'}</span>
                  <span>{user.nextTier.name}</span>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, ((user.totalXp) / (user.nextTier.xpThreshold)) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Încă <strong>{formatInteger(user.xpToNextLevel)} XP</strong> până la {user.nextTier.name}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detalii livrare */}
      <div className="bg-card border rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Detalii livrare
        </h2>
        <div className="space-y-2 text-sm">
          {order.fulfillmentType === 'in_location' ? (
            <div className="flex items-center gap-2 text-foreground">
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span>
                Servire la masă
                {order.tableNumber && (
                  <span className="ml-1 font-semibold">· Masa {order.tableNumber}</span>
                )}
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-foreground">
              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <span>
                {order.deliveryAddress}, {order.deliveryCity}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Badge variant="outline" className="text-xs capitalize">
              {order.paymentMethod === 'cash' ? 'Plată numerar' : 'Plată card'}
            </Badge>
          </div>
        </div>
      </div>

      {/* CTA-uri — more prominent reorder */}
      <div className="flex flex-col gap-3">
        <Button asChild size="lg" className="w-full">
          <Link to={routes.catalog}>
            <ShoppingBag className="w-4 h-4 mr-2" />
            Comandă din nou{pointsEarned > 0 ? ` — câștigi alte puncte!` : ''}
          </Link>
        </Button>
        <Button variant="outline" asChild className="w-full">
          <Link to={routes.profile}>
            <Receipt className="w-4 h-4 mr-2" />
            Vezi toate comenzile
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
};

// ============================================================================
// Componentă principală
// ============================================================================

const CheckoutSuccessInner: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const confirmedRef = useRef(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [confirmDone, setConfirmDone] = useState(false);
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.user);

  // Preia comanda din location.state (dacă vine de la cash checkout)
  const orderFromState = (location.state as { order?: Order })?.order ?? null;

  useEffect(() => {
    if (!sessionId) {
      // Comandă cash — comanda e deja în state
      dispatch(resetCart());
      dispatch(fetchCurrentUser());
      return;
    }
    if (isLoading || !isAuthenticated) return;
    if (confirmedRef.current) return;
    confirmedRef.current = true;
    setConfirmError(null);

    confirmPaymentSessionApi(sessionId).then((result) => {
      setConfirmDone(true);
      if (result.success && result.data) {
        setConfirmedOrder(result.data);
        dispatch(resetCart());
        dispatch(fetchCurrentUser());
      } else {
        const msg = result.error ?? 'Eroare la confirmarea plății';
        setConfirmError(msg);
        toast({
          title: texts.common.error,
          description: msg,
          variant: 'destructive',
        });
      }
    });
  }, [sessionId, dispatch, isAuthenticated, isLoading]);

  // Loading în timp ce așteptăm sesiunea de card
  if (sessionId && (isLoading || (!confirmDone && !confirmError))) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 flex flex-col items-center gap-4">
          <PageLoader />
          <p className="text-muted-foreground text-sm animate-pulse">Se confirmă plata...</p>
        </div>
      </Layout>
    );
  }

  if (sessionId && !isAuthenticated) {
    navigate(routes.login, {
      state: { from: { pathname: location.pathname, search: location.search } },
      replace: true,
    });
    return null;
  }

  // Eroare la confirmare card
  if (confirmDone && confirmError) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-destructive/10 p-6">
                <XCircle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-foreground">Confirmare plată eșuată</h1>
            <p className="text-muted-foreground mb-8">{confirmError}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate(routes.checkout)} variant="outline">
                Înapoi la checkout
              </Button>
              <Button onClick={() => navigate(routes.home)}>{texts.checkout.backToHome}</Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Comanda disponibilă (card sau cash cu state)
  const order = confirmedOrder ?? orderFromState;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-lg mx-auto">
          {order ? (
            <OrderSummary order={order} />
          ) : (
            // Fallback când nu avem datele comenzii (ex: refresh pagină)
            <div className="text-center space-y-6">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-primary/10 p-6">
                  <CheckCircle className="h-12 w-12 text-primary" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-foreground">{texts.checkout.orderSuccess}</h1>
              <p className="text-muted-foreground">{texts.checkout.orderSuccessMessage}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild>
                  <Link to={routes.profile}>
                    <Receipt className="w-4 h-4 mr-2" />
                    Comenzile mele
                  </Link>
                </Button>
                <Button variant="outline" onClick={() => navigate(routes.home)}>
                  {texts.checkout.backToHome}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

const CheckoutSuccess: React.FC = () => (
  <ProtectedRoute>
    <CheckoutSuccessInner />
  </ProtectedRoute>
);

export default CheckoutSuccess;
