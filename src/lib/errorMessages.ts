/**
 * Mesaje de eroare prietenoase pentru utilizator
 * Mapează erorile tehnice/GraphQL/rețea la texte în română
 */

import { ApolloError } from '@apollo/client';

/** Mapare erori tehnice la mesaje prietenoase. Mesajele backend în română sunt returnate ca atare. */
const USER_MESSAGES: Record<string, string> = {
  'Network Error': 'Verifică conexiunea la internet și încearcă din nou.',
  'Failed to fetch': 'Nu s-a putut contacta serverul. Verifică conexiunea.',
  'UNAUTHENTICATED': 'Sesiunea a expirat. Te rugăm să te autentifici din nou.',
};

/**
 * Extrage mesajul de eroare din răspunsul GraphQL (prima eroare)
 */
function getGraphQLMessage(error: ApolloError): string | null {
  const gql = error.graphQLErrors?.[0];
  if (!gql) return null;
  const msg = (gql.message || '').trim();
  if (!msg) return null;
  return msg;
}

/**
 * Returnează un mesaj prietenos pentru utilizator pe baza erorii
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApolloError) {
    const gqlMsg = getGraphQLMessage(error);
    if (gqlMsg) {
      for (const [key, friendly] of Object.entries(USER_MESSAGES)) {
        if (gqlMsg.includes(key)) return friendly;
      }
      return gqlMsg;
    }
    if (error.networkError) {
      const msg = (error.networkError as Error).message || '';
      return USER_MESSAGES[msg] ?? USER_MESSAGES['Network Error'] ?? msg;
    }
  }

  if (error instanceof Error) {
    const msg = error.message.trim();
    for (const [key, friendly] of Object.entries(USER_MESSAGES)) {
      if (msg.includes(key)) return friendly;
    }
    return msg;
  }

  return 'A apărut o eroare. Încearcă din nou.';
}
