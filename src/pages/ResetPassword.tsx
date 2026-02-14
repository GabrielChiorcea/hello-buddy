/**
 * Reset password page - setare parolă nouă cu token din email
 */

import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormInput } from '@/components/common/FormInput';
import { Loader } from '@/components/common/Loader';
import { Layout } from '@/components/layout/Layout';
import { GuestRoute } from '@/components/layout/ProtectedRoute';
import { routes } from '@/config/routes';
import { texts } from '@/config/texts';
import { toast } from '@/hooks/use-toast';
import { resetPasswordApi } from '@/api/api';
import { KeyRound, CheckCircle } from 'lucide-react';

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Parola trebuie să aibă minim 8 caractere')
      .max(100)
      .regex(/[A-Z]/, 'Parola trebuie să conțină cel puțin o literă mare')
      .regex(/[a-z]/, 'Parola trebuie să conțină cel puțin o literă mică')
      .regex(/[0-9]/, 'Parola trebuie să conțină cel puțin o cifră'),
    confirmPassword: z.string().min(1, 'Confirmă parola'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Parolele nu coincid',
    path: ['confirmPassword'],
  });

const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'newPassword') setNewPassword(value);
    else setConfirmPassword(value);
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse({ newPassword, confirmPassword });
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.errors.forEach((err) => {
        const path = err.path[0] as keyof typeof fieldErrors;
        fieldErrors[path] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    if (!token) {
      setErrors({ newPassword: texts.auth.resetPasswordInvalidToken });
      return;
    }
    setIsLoading(true);
    setErrors({});
    try {
      const apiResult = await resetPasswordApi(token, newPassword);
      if (apiResult.success) {
        setSuccess(true);
        toast({
          title: texts.auth.resetPasswordSuccess,
        });
        setTimeout(() => navigate(routes.login, { replace: true }), 2000);
      } else {
        setErrors({ newPassword: apiResult.error ?? texts.auth.resetPasswordInvalidToken });
      }
    } catch {
      setErrors({ newPassword: texts.auth.resetPasswordInvalidToken });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <GuestRoute>
        <Layout showFooter={false}>
          <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6 text-center">
                <p className="text-destructive mb-4">{texts.auth.resetPasswordInvalidToken}</p>
                <Button asChild>
                  <Link to={routes.forgotPassword}>Solicită link nou</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </Layout>
      </GuestRoute>
    );
  }

  return (
    <GuestRoute>
      <Layout showFooter={false}>
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                <KeyRound className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">{texts.auth.resetPasswordTitle}</CardTitle>
              <CardDescription>{texts.auth.resetPasswordSubtitle}</CardDescription>
            </CardHeader>
            <CardContent>
              {success ? (
                <div className="space-y-4 text-center">
                  <div className="flex justify-center">
                    <div className="rounded-full bg-primary/10 p-4">
                      <CheckCircle className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{texts.auth.resetPasswordSuccess}</p>
                  <p className="text-xs text-muted-foreground">Redirecționare la autentificare...</p>
                  <Loader size="sm" className="mx-auto" />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormInput
                    name="newPassword"
                    type="password"
                    label="Parolă nouă"
                    placeholder="Introdu parola nouă"
                    value={newPassword}
                    onChange={handleChange}
                    error={errors.newPassword}
                    required
                    autoComplete="new-password"
                    disabled={isLoading}
                  />
                  <FormInput
                    name="confirmPassword"
                    type="password"
                    label={texts.auth.confirmPasswordLabel}
                    placeholder={texts.auth.confirmPasswordPlaceholder}
                    value={confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                    required
                    autoComplete="new-password"
                    disabled={isLoading}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader size="sm" className="mr-2" /> : null}
                    {texts.auth.resetPasswordButton}
                  </Button>
                </form>
              )}

              {!success && (
                <div className="mt-6 text-center text-sm">
                  <Link
                    to={routes.login}
                    className="text-primary hover:underline font-medium"
                  >
                    Înapoi la autentificare
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Layout>
    </GuestRoute>
  );
};

export default ResetPassword;
