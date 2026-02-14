/**
 * Pagină succes după plată cu card (redirect de la Stripe/Netopia).
 * Comanda este creată la încărcarea paginii prin confirmPaymentSession(session_id).
 * Așteptăm restaurarea sesiunii (token din cookie) înainte de a apela API-ul.
 */

import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

const CheckoutSuccess: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const confirmedRef = useRef(false);
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.user);

  useEffect(() => {
    if (!sessionId) {
      dispatch(resetCart());
      dispatch(fetchCurrentUser());
      return;
    }
    if (isLoading || !isAuthenticated) return;
    if (confirmedRef.current) return;
    confirmedRef.current = true;
    confirmPaymentSessionApi(sessionId).then((result) => {
      if (result.success) {
        dispatch(resetCart());
        dispatch(fetchCurrentUser());
      } else {
        toast({
          title: texts.common.error,
          description: result.error ?? 'Eroare la confirmarea plății',
          variant: 'destructive',
        });
      }
    });
  }, [sessionId, dispatch, isAuthenticated, isLoading]);

  if (sessionId && isLoading) {
    return (
      <Layout>
        <PageLoader />
      </Layout>
    );
  }
  if (sessionId && !isAuthenticated) {
    navigate(routes.login, { state: { from: { pathname: location.pathname, search: location.search } }, replace: true });
    return null;
  }

  return (
    <ProtectedRoute>
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
    </ProtectedRoute>
  );
};

export default CheckoutSuccess;
