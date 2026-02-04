/**
 * Account Settings Component
 * Password reset and account deletion functionality
 */

import React, { useState } from 'react';
import { z } from 'zod';
import { KeyRound, Trash2, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormInput } from '@/components/common/FormInput';
import { Loader } from '@/components/common/Loader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { texts } from '@/config/texts';
import { routes } from '@/config/routes';
import { useAppDispatch } from '@/store';
import { logout } from '@/store/slices/userSlice';
import { requestPasswordResetApi, deleteAccountApi } from '@/api/api';

interface AccountSettingsProps {
  userId: string;
  userEmail: string;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ userId, userEmail }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  // Password reset state
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  
  // Delete account state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteFormData, setDeleteFormData] = useState({
    password: '',
    confirmText: '',
  });
  const [deleteFormErrors, setDeleteFormErrors] = useState<{
    password?: string;
    confirmText?: string;
  }>({});

  // Handle password reset
  const handlePasswordReset = async () => {
    setIsResetLoading(true);
    setResetError(null);
    setResetSuccess(false);

    const result = await requestPasswordResetApi(userEmail);

    if (result.success) {
      setResetSuccess(true);
      toast({ title: texts.profile.resetPasswordSent });
    } else {
      setResetError(result.error || texts.notifications.passwordResetError);
    }

    setIsResetLoading(false);
  };

  // Validate delete form
  const validateDeleteForm = (): boolean => {
    const errors: typeof deleteFormErrors = {};
    
    if (!deleteFormData.password) {
      errors.password = texts.validation.required;
    } else if (deleteFormData.password.length < 6) {
      errors.password = texts.validation.passwordMin;
    }
    
    if (deleteFormData.confirmText !== texts.profile.deleteAccountConfirmText) {
      errors.confirmText = texts.notifications.invalidConfirmText;
    }
    
    setDeleteFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!validateDeleteForm()) return;

    setIsDeleting(true);
    setDeleteError(null);

    const result = await deleteAccountApi(userId, {
      password: deleteFormData.password,
      confirmText: deleteFormData.confirmText,
    });

    if (result.success) {
      toast({ title: texts.profile.accountDeleted });
      await dispatch(logout());
      navigate(routes.home);
    } else {
      setDeleteError(result.error || texts.notifications.deleteAccountError);
    }

    setIsDeleting(false);
  };

  // Handle delete form changes
  const handleDeleteFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDeleteFormData((prev) => ({ ...prev, [name]: value }));
    if (deleteFormErrors[name as keyof typeof deleteFormErrors]) {
      setDeleteFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Password Reset Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="h-5 w-5" />
            {texts.profile.resetPassword}
          </CardTitle>
          <CardDescription>{texts.profile.resetPasswordDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {resetSuccess && (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                {texts.profile.resetPasswordSent}. Verifică email-ul <strong>{userEmail}</strong> pentru instrucțiuni.
              </AlertDescription>
            </Alert>
          )}
          
          {resetError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{resetError}</AlertDescription>
            </Alert>
          )}
          
          <p className="text-sm text-muted-foreground">
            Un email cu instrucțiuni pentru resetarea parolei va fi trimis la adresa: <strong>{userEmail}</strong>
          </p>
          
          <Button 
            onClick={handlePasswordReset} 
            disabled={isResetLoading || resetSuccess}
            variant="outline"
          >
            {isResetLoading && <Loader size="sm" className="mr-2" />}
            {resetSuccess ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Email trimis
              </>
            ) : (
              texts.profile.resetPasswordButton
            )}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Delete Account Section */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-destructive">
            <Trash2 className="h-5 w-5" />
            {texts.profile.deleteAccount}
          </CardTitle>
          <CardDescription>{texts.profile.deleteAccountDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Această acțiune va șterge permanent contul tău și toate datele asociate. 
              Nu vei mai putea recupera contul sau istoricul comenzilor.
            </AlertDescription>
          </Alert>
          
          <Button 
            variant="destructive" 
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {texts.profile.deleteAccountButton}
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {texts.profile.deleteAccount}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {texts.profile.deleteAccountWarning}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            {deleteError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{deleteError}</AlertDescription>
              </Alert>
            )}

            <FormInput
              name="password"
              type="password"
              label={texts.auth.passwordLabel}
              placeholder="Introdu parola curentă"
              value={deleteFormData.password}
              onChange={handleDeleteFormChange}
              error={deleteFormErrors.password}
              disabled={isDeleting}
            />

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Pentru a confirma, scrie <strong className="text-destructive">{texts.profile.deleteAccountConfirmText}</strong> mai jos:
              </p>
              <FormInput
                name="confirmText"
                type="text"
                label=""
                placeholder={texts.profile.deleteAccountConfirmText}
                value={deleteFormData.confirmText}
                onChange={handleDeleteFormChange}
                error={deleteFormErrors.confirmText}
                disabled={isDeleting}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeleteFormData({ password: '', confirmText: '' });
                setDeleteFormErrors({});
                setDeleteError(null);
              }}
              disabled={isDeleting}
            >
              {texts.profile.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting || deleteFormData.confirmText !== texts.profile.deleteAccountConfirmText}
            >
              {isDeleting && <Loader size="sm" className="mr-2" />}
              {texts.profile.deleteAccountButton}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
