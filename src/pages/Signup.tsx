/**
 * Signup page component
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormInput } from '@/components/common/FormInput';
import { Loader } from '@/components/common/Loader';
import { Layout } from '@/components/layout/Layout';
import { GuestRoute } from '@/components/layout/ProtectedRoute';
import { useAppDispatch, useAppSelector } from '@/store';
import { signup, clearError, fetchCurrentUser } from '@/store/slices/userSlice';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import { toast } from '@/hooks/use-toast';
import { UtensilsCrossed } from 'lucide-react';

// Validation schema
const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, texts.validation.invalidName)
    .max(100),
  email: z
    .string()
    .trim()
    .min(1, texts.validation.required)
    .email(texts.validation.invalidEmail)
    .max(255),
  phone: z
    .string()
    .trim()
    .min(10, texts.validation.invalidPhone)
    .max(15)
    .regex(/^[0-9+\s-]+$/, texts.validation.invalidPhone),
  password: z
    .string()
    .min(6, texts.validation.passwordMin)
    .max(100),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: texts.validation.passwordMatch,
  path: ['confirmPassword'],
});

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

type FormErrors = Partial<Record<keyof FormData, string>>;

const Signup: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.user);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(routes.home, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Sanitize input
  const sanitizeInput = (value: string): string => {
    return value.replace(/[<>]/g, '').trim();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Don't sanitize password fields
    const sanitizedValue = name.includes('password') ? value : sanitizeInput(value);
    setFormData((prev) => ({
      ...prev,
      [name]: sanitizedValue,
    }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    try {
      signupSchema.parse(formData);
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

    const { confirmPassword, ...signupData } = formData;
    const result = await dispatch(signup(signupData));
    
    if (signup.fulfilled.match(result)) {
      toast({
        title: texts.notifications.signupSuccess,
      });
      await dispatch(fetchCurrentUser());
      navigate(routes.home, { replace: true });
    } else if (signup.rejected.match(result)) {
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
              <CardTitle className="text-2xl">{texts.auth.signupTitle}</CardTitle>
              <CardDescription>{texts.auth.signupSubtitle}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput
                  name="name"
                  type="text"
                  label={texts.auth.nameLabel}
                  placeholder={texts.auth.namePlaceholder}
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  required
                  autoComplete="name"
                  disabled={isLoading}
                />

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
                  name="phone"
                  type="tel"
                  label={texts.auth.phoneLabel}
                  placeholder={texts.auth.phonePlaceholder}
                  value={formData.phone}
                  onChange={handleChange}
                  error={errors.phone}
                  required
                  autoComplete="tel"
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
                  autoComplete="new-password"
                  disabled={isLoading}
                />

                <FormInput
                  name="confirmPassword"
                  type="password"
                  label={texts.auth.confirmPasswordLabel}
                  placeholder={texts.auth.confirmPasswordPlaceholder}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  required
                  autoComplete="new-password"
                  disabled={isLoading}
                />

                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <Loader size="sm" className="mr-2" />
                  ) : null}
                  {texts.auth.signupButton}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">{texts.auth.hasAccount} </span>
                <Link 
                  to={routes.login} 
                  className="text-primary hover:underline font-medium"
                >
                  {texts.nav.login}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </GuestRoute>
  );
};

export default Signup;
