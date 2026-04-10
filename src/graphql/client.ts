/**
 * =============================================================================
 * CONFIGURARE APOLLO CLIENT
 * =============================================================================
 * 
 * Acest fișier configurează clientul Apollo pentru comunicarea cu API-ul GraphQL.
 * 
 * Funcționalități principale:
 * - Conexiune HTTP către endpoint-ul GraphQL
 * - Gestionare automată a erorilor GraphQL și de rețea
 * - Injectare automată a token-ului de autentificare în header-ele cererilor
 * - Cache în memorie cu politici personalizate pentru entități
 * 
 * Utilizare:
 * - Importat în App.tsx și furnizat prin ApolloProvider
 * - Folosit implicit de toate hook-urile Apollo din aplicație
 * =============================================================================
 */

import { ApolloClient, InMemoryCache, from, HttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

// ============================================================================
// CONFIGURARE ENDPOINT
// ============================================================================

/**
 * URL-ul endpoint-ului GraphQL
 * Se citește din variabilele de mediu sau folosește valoarea implicită
 */
const GRAPHQL_ENDPOINT = (() => {
  const configured = import.meta.env.VITE_GRAPHQL_ENDPOINT || '/graphql';
  if (typeof window === 'undefined') return configured;
  try {
    const gqlUrl = new URL(configured, window.location.origin);
    const currentHost = window.location.hostname;
    // Dev fix: folosim aceeași gazdă ca frontend-ul pentru cookie-uri HttpOnly/SameSite pe auth.
    if (currentHost && gqlUrl.hostname !== currentHost) {
      gqlUrl.hostname = currentHost;
    }
    return gqlUrl.toString();
  } catch {
    return configured;
  }
})();

// ============================================================================
// LINK-URI APOLLO
// ============================================================================

/**
 * Link HTTP pentru conexiunea cu API-ul GraphQL
 * Gestionează transportul HTTP al cererilor GraphQL
 */
const httpLink = new HttpLink({
  uri: GRAPHQL_ENDPOINT,
  credentials: 'include', // IMPORTANT: include HttpOnly cookies pentru refresh token
});

/**
 * Link pentru gestionarea erorilor
 * Interceptează și procesează erorile GraphQL și de rețea
 * 
 * Acțiuni:
 * - Logare erori GraphQL în consolă
 * - Redirecționare la login pentru erori de autentificare
 * - Gestionare stare offline
 */
const errorLink = onError(({ graphQLErrors, networkError }) => {
  // Procesare erori GraphQL
  if (graphQLErrors) {
    for (const { message, locations, path, extensions } of graphQLErrors) {
      console.error(
        `[Eroare GraphQL]: Mesaj: ${message}, Locație: ${JSON.stringify(locations)}, Cale: ${path}`
      );
      
      // Gestionare erori de autentificare - curățare Redux și redirecționare
      if (extensions?.code === 'UNAUTHENTICATED') {
        import('@/store').then(({ store }) =>
          import('@/store/slices/userSlice').then(({ clearAuth }) => {
            store.dispatch(clearAuth());
            window.location.href = '/login';
          })
        );
        return;
      }
    }
  }
  
  // Procesare erori de rețea (conexiune, timeout, etc.)
  if (networkError) {
    console.error(`[Eroare Rețea]: ${networkError.message}`);
    
    // Verificare stare offline
    if (!navigator.onLine) {
      console.warn('Aplicația este offline. Unele funcționalități pot fi indisponibile.');
    }
  }
});

/**
 * Link pentru autentificare
 * Adaugă token-ul Bearer la header-ul Authorization pentru fiecare cerere
 * Token-ul este citit din Redux store (memorie), NU din localStorage!
 * 
 * IMPORTANT: Folosim import dinamic pentru a evita dependințe circulare
 */
const authLink = setContext(async (_, { headers }) => {
  // Import dinamic al store-ului pentru a evita dependințe circulare
  const { store } = await import('@/store');
  const state = store.getState();
  
  // Obținere token din Redux (memorie)
  const token = state.user.tokens?.accessToken || state.user.token;
  
  // Returnare headers cu token de autentificare (dacă există)
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// ============================================================================
// INSTANȚĂ APOLLO CLIENT
// ============================================================================

/**
 * Instanța principală Apollo Client
 * 
 * Configurare:
 * - Link-uri: errorLink -> authLink -> httpLink (în această ordine)
 * - Cache în memorie cu politici pentru entități
 * - Opțiuni implicite pentru query-uri și mutații
 */
export const apolloClient = new ApolloClient({
  // Lanț de link-uri: erori -> autentificare -> HTTP
  link: from([errorLink, authLink, httpLink]),
  
  // Configurare cache în memorie
  cache: new InMemoryCache({
    // Politici pentru tipuri de date
    typePolicies: {
      Query: {
        fields: {
          // Înlocuire completă pentru liste (fără merge)
          products: {
            merge(existing = [], incoming) {
              return incoming;
            },
          },
          orders: {
            merge(existing = [], incoming) {
              return incoming;
            },
          },
          addresses: {
            merge(existing = [], incoming) {
              return incoming;
            },
          },
        },
      },
      // Câmpuri cheie pentru identificarea entităților în cache
      Product: {
        keyFields: ['id'],
      },
      User: {
        keyFields: ['id'],
      },
      Order: {
        keyFields: ['id'],
      },
      DeliveryAddress: {
        keyFields: ['id'],
      },
    },
  }),
  
  // Opțiuni implicite pentru toate operațiunile
  defaultOptions: {
    // Pentru query-uri care observă schimbări (watchQuery)
    watchQuery: {
      fetchPolicy: 'cache-and-network', // Folosește cache + actualizează de la rețea
      errorPolicy: 'all', // Returnează și date parțiale în caz de eroare
    },
    // Pentru query-uri simple
    query: {
      fetchPolicy: 'cache-first', // Preferă cache-ul
      errorPolicy: 'all',
    },
    // Pentru mutații
    mutate: {
      errorPolicy: 'all',
    },
  },
});
