/**
 * =============================================================================
 * PAGINA DE LOGIN PENTRU ADMIN
 * =============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '@/store';
import { adminLogin, clearAdminError } from '@/store/slices/adminSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { texts } from '@/config/texts';

const adminLoginSchema = z.object({
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

type FormErrors = Partial<Record<'email' | 'password', string>>;

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.admin);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  // Redirect dacă deja autentificat
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Curăță eroarea la mount
  useEffect(() => {
    dispatch(clearAdminError());
  }, [dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'email') setEmail(value);
    if (name === 'password') setPassword(value);
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    try {
      adminLoginSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        err.errors.forEach((e) => {
          const field = e.path[0] as keyof FormErrors;
          newErrors[field] = e.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const result = await dispatch(adminLogin({ email, password }));

    if (adminLogin.fulfilled.match(result)) {
      toast({ title: 'Autentificare reușită' });
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    } else if (adminLogin.rejected.match(result)) {
      toast({
        title: texts.common.error,
        description: (result.payload as string) || 'Autentificare eșuată',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <ChefHat className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Food Admin</CardTitle>
          <CardDescription>
            Autentifică-te pentru a accesa panoul de administrare
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@foodorder.com"
                value={email}
                onChange={handleChange}
                required
                autoComplete="email"
                disabled={isLoading}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Parolă</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                disabled={isLoading}
                className={errors.password ? 'border-destructive' : ''}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se autentifică...
                </>
              ) : (
                'Autentificare'
              )}
            </Button>
          </form>

          {import.meta.env.DEV && (
            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                Credențiale implicite: admin@foodorder.com / admin123secure
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
