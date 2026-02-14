/**
 * Forgot password page - solicitare link de resetare parolă
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { requestPasswordResetApi } from '@/api/api';
import { KeyRound } from 'lucide-react';

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, texts.validation.required)
    .email(texts.validation.invalidEmail)
    .max(255),
});

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value.replace(/[<>]/g, '').trim());
    setError(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse({ email });
    if (!result.success) {
      setError(result.error.errors[0]?.message ?? texts.validation.invalidEmail);
      return;
    }
    setIsLoading(true);
    setError(undefined);
    try {
      const apiResult = await requestPasswordResetApi(email);
      if (apiResult.success) {
        setSent(true);
        toast({
          title: texts.auth.forgotPasswordSuccess,
        });
      } else {
        setError(apiResult.error ?? 'Eroare la trimitere');
      }
    } catch {
      setError('Eroare la trimitere. Încearcă din nou.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GuestRoute>
      <Layout showFooter={false}>
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                <KeyRound className="h-6 w-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">{texts.auth.forgotPasswordTitle}</CardTitle>
              <CardDescription>{texts.auth.forgotPasswordSubtitle}</CardDescription>
            </CardHeader>
            <CardContent>
              {sent ? (
                <div className="space-y-4 text-center text-sm text-muted-foreground">
                  <p>{texts.auth.forgotPasswordSuccess}</p>
                  <Button asChild variant="outline" className="w-full">
                    <Link to={routes.login}>{texts.auth.loginButton}</Link>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <FormInput
                    name="email"
                    type="email"
                    label={texts.auth.emailLabel}
                    placeholder={texts.auth.emailPlaceholder}
                    value={email}
                    onChange={handleChange}
                    error={error}
                    required
                    autoComplete="email"
                    disabled={isLoading}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <Loader size="sm" className="mr-2" />
                    ) : null}
                    {texts.auth.forgotPasswordButton}
                  </Button>
                </form>
              )}

              <div className="mt-6 text-center text-sm">
                <Link
                  to={routes.login}
                  className="text-primary hover:underline font-medium"
                >
                  Înapoi la autentificare
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </GuestRoute>
  );
};

export default ForgotPassword;
