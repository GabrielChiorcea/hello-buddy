/**
 * =============================================================================
 * HOOK-URI APOLLO PENTRU AUTENTIFICARE
 * =============================================================================
 * 
 * Token-urile JWT sunt stocate DOAR în Redux (memorie), NU în localStorage!
 * =============================================================================
 */

import { useMutation, useQuery, useApolloClient } from '@apollo/client';
import { LOGIN, SIGNUP, LOGOUT, REQUEST_PASSWORD_RESET, DELETE_ACCOUNT } from '../mutations';
import { GET_CURRENT_USER } from '../queries';
import { User, LoginCredentials, SignupData as SignupDataType, AuthTokens } from '@/types';
import { useCallback } from 'react';
import { useAppDispatch } from '@/store';
import { setTokens, clearAuth } from '@/store/slices/userSlice';

// ============================================================================
// INTERFEȚE PENTRU RĂSPUNSURI (sincronizate cu backend schema)
// SECURITY: refreshToken este setat în HttpOnly cookie, nu în response
// ============================================================================

/** AuthPayload din backend */
interface AuthPayload {
  user: User;
  accessToken: string;
  expiresIn: number;
}

interface LoginData {
  login: AuthPayload;
}

interface SignupDataResponse {
  signup: AuthPayload;
}

interface CurrentUserData {
  currentUser: User | null;
}

// ============================================================================
// HOOK-URI
// ============================================================================

export const useCurrentUser = () => {
  const { data, loading, error, refetch } = useQuery<CurrentUserData>(GET_CURRENT_USER, {
    fetchPolicy: 'cache-first',
  });
  
  return {
    user: data?.currentUser || null,
    loading,
    error: error?.message || null,
    refetch,
  };
};

export const useLogin = () => {
  const client = useApolloClient();
  const dispatch = useAppDispatch();
  const [loginMutation, { loading, error }] = useMutation<LoginData>(LOGIN);
  
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const { data } = await loginMutation({
        variables: { input: credentials },
      });
      
      if (data?.login) {
        const { user, accessToken, expiresIn } = data.login;
        
        // Salvare access token în Redux (MEMORIE)
        // refreshToken este setat în HttpOnly cookie de backend
        const tokens: AuthTokens = {
          accessToken,
          accessTokenExpiresAt: Date.now() + (expiresIn * 1000),
        };
        dispatch(setTokens(tokens));
        
        // Actualizare cache Apollo
        client.writeQuery({
          query: GET_CURRENT_USER,
          data: { currentUser: user },
        });
        
        return { success: true, data: { user, tokens } };
      }
      
      return { success: false, error: 'Autentificare eșuată' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Autentificare eșuată';
      console.error('Eroare la autentificare:', message);
      return { success: false, error: message };
    }
  }, [loginMutation, client, dispatch]);
  
  return {
    login,
    loading,
    error: error?.message || null,
  };
};

export const useSignup = () => {
  const client = useApolloClient();
  const dispatch = useAppDispatch();
  const [signupMutation, { loading, error }] = useMutation<SignupDataResponse>(SIGNUP);
  
  const signup = useCallback(async (data: SignupDataType) => {
    try {
      const { data: result } = await signupMutation({
        variables: { input: data },
      });
      
      if (result?.signup) {
        const { user, accessToken, expiresIn } = result.signup;
        
        // refreshToken este setat în HttpOnly cookie de backend
        const tokens: AuthTokens = {
          accessToken,
          accessTokenExpiresAt: Date.now() + (expiresIn * 1000),
        };
        dispatch(setTokens(tokens));
        
        client.writeQuery({
          query: GET_CURRENT_USER,
          data: { currentUser: user },
        });
        
        return { success: true, data: { user, tokens } };
      }
      
      return { success: false, error: 'Înregistrare eșuată' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Înregistrare eșuată';
      console.error('Eroare la înregistrare:', message);
      return { success: false, error: message };
    }
  }, [signupMutation, client, dispatch]);
  
  return {
    signup,
    loading,
    error: error?.message || null,
  };
};

export const useLogout = () => {
  const client = useApolloClient();
  const dispatch = useAppDispatch();
  const [logoutMutation, { loading }] = useMutation(LOGOUT);
  
  const logout = useCallback(async () => {
    try {
      await logoutMutation();
    } catch (err) {
      console.error('Eroare la deconectare:', err);
    } finally {
      dispatch(clearAuth());
      client.resetStore();
    }
  }, [logoutMutation, client, dispatch]);
  
  return { logout, loading };
};

export const useRequestPasswordReset = () => {
  const [mutation, { loading, error }] = useMutation<{ requestPasswordReset: boolean }>(
    REQUEST_PASSWORD_RESET
  );
  
  const requestReset = useCallback(async (email: string) => {
    try {
      await mutation({ variables: { email } });
      // Pentru securitate, returnăm succes indiferent dacă email-ul există
      return { success: true, message: 'Email de resetare trimis (dacă contul există)' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Cerere eșuată';
      console.error('Eroare la solicitarea resetării parolei:', message);
      return { success: false, message };
    }
  }, [mutation]);
  
  return {
    requestReset,
    loading,
    error: error?.message || null,
  };
};

export const useDeleteAccount = () => {
  const client = useApolloClient();
  const dispatch = useAppDispatch();
  const [mutation, { loading, error }] = useMutation<{ deleteAccount: boolean }>(
    DELETE_ACCOUNT
  );
  
  const deleteAccount = useCallback(async (password: string, confirmText: string) => {
    try {
      const { data } = await mutation({
        variables: { password, confirmText },
      });
      
      if (data?.deleteAccount) {
        dispatch(clearAuth());
        client.resetStore();
        return { success: true, message: 'Cont șters cu succes' };
      }
      
      return { success: false, message: 'Ștergere eșuată' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ștergere eșuată';
      console.error('Eroare la ștergerea contului:', message);
      return { success: false, message };
    }
  }, [mutation, client, dispatch]);
  
  return {
    deleteAccount,
    loading,
    error: error?.message || null,
  };
};
