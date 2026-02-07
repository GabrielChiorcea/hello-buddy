/**
 * Login page component
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormInput } from '@/components/common/FormInput';
import { Loader } from '@/components/common/Loader';
import { Layout } from '@/components/layout/Layout';
import { GuestRoute } from '@/components/layout/ProtectedRoute';
import { useAppDispatch, useAppSelector } from '@/store';
import { login, clearError } from '@/store/slices/userSlice';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import { toast } from '@/hooks/use-toast';
import { LoginCredentials } from '@/types';
import { UtensilsCrossed } from 'lucide-react';

// Validation schema
const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, texts.validation.required)
    .email(texts.validation.invalidEmail)
    .max(255),
  password: z
    .string()
    .min(1, texts.validation.required)
    .min(6, texts.validation.passwordMin)
    .max(100),
});

type FormErrors = Partial<Record<keyof LoginCredentials, string>>;

const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.user);

  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Get the redirect path from state
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || routes.home;

  useEffect(() => {
    // Clear any previous errors when component mounts
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Sanitize input - remove potential XSS
  const sanitizeInput = (value: string): string => {
    return value
      .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
      .trim();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: sanitizeInput(value),
    }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    try {
      loginSchema.parse(formData);
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
    
    if (!validateForm()) return;

    const result = await dispatch(login(formData));
    
    if (login.fulfilled.match(result)) {
      toast({
        title: texts.notifications.loginSuccess,
      });
      navigate(from, { replace: true });
    } else if (login.rejected.match(result)) {
      toast({
        title: texts.common.error,
        description: result.payload as string,
        variant: 'destructive',
      });
    }
  };

  return (
    <GuestRoute>
      <Layout showFooter={false}>
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                <UtensilsCrossed className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">{texts.auth.loginTitle}</CardTitle>
              <CardDescription>{texts.auth.loginSubtitle}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput
                  name="email"
                  type="email"
                  label={texts.auth.emailLabel}
                  placeholder={texts.auth.emailPlaceholder}
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  required
                  autoComplete="email"
                  disabled={isLoading}
                />
                
                <FormInput
                  name="password"
                  type="password"
                  label={texts.auth.passwordLabel}
                  placeholder={texts.auth.passwordPlaceholder}
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                />

                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <Loader size="sm" className="mr-2" />
                  ) : null}
                  {texts.auth.loginButton}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">{texts.auth.noAccount} </span>
                <Link 
                  to={routes.signup} 
                  className="text-primary hover:underline font-medium"
                >
                  {texts.nav.signup}
                </Link>
              </div>

              {/* Demo credentials - doar în development */}
              {import.meta.env.DEV && (
                <div className="mt-6 p-4 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground text-center mb-2">
                    Cont demo pentru testare:
                  </p>
                  <p className="text-xs text-center font-mono">
                    test@test.com / test123
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Layout>
    </GuestRoute>
  );
};

export default Login;
