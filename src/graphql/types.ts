/**
 * =============================================================================
 * TIPURI TYPESCRIPT PENTRU GRAPHQL
 * =============================================================================
 * 
 * Acest fișier definește toate tipurile TypeScript care corespund schemei GraphQL.
 * 
 * Categorii de tipuri:
 * - Tipuri pentru răspunsuri Query (GetProductsResponse, etc.)
 * - Tipuri pentru input-uri Mutation (LoginInput, etc.)
 * - Tipuri pentru răspunsuri Mutation (AuthResponse, etc.)
 * - Tipuri pentru variabile Query și Mutation
 * 
 * Beneficii:
 * - Type safety pentru toate operațiunile GraphQL
 * - Autocomplete în IDE
 * - Validare la compilare
 * 
 * Utilizare:
 * - Importate în hook-urile Apollo pentru tipizare
 * - Folosite cu generics în useQuery și useMutation
 * =============================================================================
 */

import { Product, User, Order, DeliveryAddress, ProductCategory, PaymentMethod } from '@/types';

// ============================================================================
// TIPURI RĂSPUNSURI QUERY
// ============================================================================

/**
 * Răspuns pentru query-ul GetProducts
 * Conține lista tuturor produselor
 */
export interface GetProductsResponse {
  products: Product[];
}

/**
 * Răspuns pentru query-ul GetProductById
 * Conține un singur produs sau null
 */
export interface GetProductResponse {
  product: Product | null;
}

/**
 * Răspuns pentru query-ul GetProductsByCategory
 * Conține produsele din categoria specificată
 */
export interface GetProductsByCategoryResponse {
  productsByCategory: Product[];
}

/**
 * Răspuns pentru query-ul GetCategories
 * Conține lista numelor categoriilor
 */
export interface GetCategoriesResponse {
  categories: ProductCategory[];
}

/**
 * Răspuns pentru query-ul GetCurrentUser
 * Conține datele utilizatorului autentificat sau null
 */
export interface GetCurrentUserResponse {
  currentUser: User | null;
}

/**
 * Răspuns pentru query-ul GetUserOrders
 * Conține istoricul comenzilor utilizatorului
 */
export interface GetUserOrdersResponse {
  orders: Order[];
}

/**
 * Răspuns pentru query-ul GetOrderById
 * Conține detaliile unei comenzi sau null
 */
export interface GetOrderResponse {
  order: Order | null;
}

/**
 * Răspuns pentru query-ul GetUserAddresses
 * Conține adresele de livrare salvate
 */
export interface GetUserAddressesResponse {
  addresses: DeliveryAddress[];
}

// ============================================================================
// TIPURI INPUT MUTATION
// ============================================================================

/**
 * Input pentru mutația Login
 * Credențiale de autentificare
 */
export interface LoginInput {
  email: string;    // Adresa de email
  password: string; // Parola contului
}

/**
 * Input pentru mutația Signup
 * Date pentru crearea contului
 */
export interface SignupInput {
  email: string;    // Adresa de email
  password: string; // Parola dorită
  name: string;     // Numele complet
  phone: string;    // Număr de telefon
}

/**
 * Input pentru mutația UpdateProfile
 * Câmpuri opționale de actualizat
 */
export interface ProfileUpdateInput {
  name?: string;    // Nume nou
  phone?: string;   // Telefon nou
}

/**
 * Input pentru mutațiile de adrese (Create/Update)
 * Date complete ale adresei
 */
export interface AddressInput {
  label: string;      // Etichetă (ex: "Acasă", "Birou")
  address: string;    // Adresa completă
  city: string;       // Orașul
  phone: string;      // Telefon pentru livrare
  isDefault?: boolean; // Marchează ca adresă implicită
}

/**
 * Input pentru mutația CreateOrder
 * Date necesare pentru plasarea comenzii
 */
export interface CreateOrderInput {
  items: Array<{         // Lista produselor comandate
    productId: string;   // ID-ul produsului
    quantity: number;    // Cantitatea
  }>;
  deliveryAddress: string; // Adresa de livrare
  deliveryCity: string;    // Orașul de livrare
  phone: string;           // Telefon de contact
  paymentMethod: PaymentMethod; // Metodă de plată
}

/**
 * Input pentru mutația AddReview
 * Date pentru recenzie
 */
export interface ReviewInput {
  rating: number;  // Rating 1-5 stele
  comment: string; // Comentariul recenziei
}

// ============================================================================
// TIPURI RĂSPUNSURI MUTATION
// ============================================================================

/**
 * Răspuns comun pentru autentificare (login/signup)
 * Conține datele utilizatorului și token-ul JWT
 */
export interface AuthResponse {
  user: User;   // Datele utilizatorului
  token: string; // Token JWT pentru autorizare
}

/**
 * Răspuns pentru mutația Login
 */
export interface LoginResponse {
  login: AuthResponse;
}

/**
 * Răspuns pentru mutația Signup
 */
export interface SignupResponse {
  signup: AuthResponse;
}

/**
 * Răspuns pentru mutația Logout
 */
export interface LogoutResponse {
  logout: {
    success: boolean; // True dacă deconectarea a reușit
    message: string;  // Mesaj de confirmare/eroare
  };
}

/**
 * Răspuns pentru mutația UpdateProfile
 */
export interface UpdateProfileResponse {
  updateProfile: User; // Datele utilizatorului actualizate
}

/**
 * Răspuns generic pentru mutații de tip succes/mesaj
 * Folosit pentru: resetare parolă, ștergere cont, ștergere adresă
 */
export interface MutationResultResponse {
  success: boolean; // True dacă operația a reușit
  message: string;  // Mesaj explicativ
}

/**
 * Răspuns pentru mutația RequestPasswordReset
 */
export interface RequestPasswordResetResponse {
  requestPasswordReset: MutationResultResponse;
}

/**
 * Răspuns pentru mutația ResetPassword
 */
export interface ResetPasswordResponse {
  resetPassword: MutationResultResponse;
}

/**
 * Răspuns pentru mutația DeleteAccount
 */
export interface DeleteAccountResponse {
  deleteAccount: MutationResultResponse;
}

/**
 * Răspuns pentru mutația CreateAddress
 */
export interface CreateAddressResponse {
  createAddress: DeliveryAddress; // Adresa nou creată
}

/**
 * Răspuns pentru mutația UpdateAddress
 */
export interface UpdateAddressResponse {
  updateAddress: DeliveryAddress; // Adresa actualizată
}

/**
 * Răspuns pentru mutația DeleteAddress
 */
export interface DeleteAddressResponse {
  deleteAddress: MutationResultResponse;
}

/**
 * Răspuns pentru mutația SetDefaultAddress
 */
export interface SetDefaultAddressResponse {
  setDefaultAddress: DeliveryAddress; // Adresa setată ca implicită
}

/**
 * Răspuns pentru mutația CreateOrder
 */
export interface CreateOrderResponse {
  createOrder: Order; // Comanda creată
}

/**
 * Răspuns pentru mutația CancelOrder
 */
export interface CancelOrderResponse {
  cancelOrder: Order; // Comanda cu status actualizat
}

// ============================================================================
// TIPURI VARIABILE QUERY
// ============================================================================

/**
 * Variabile pentru GetProductById
 */
export interface GetProductByIdVariables {
  id: string; // ID-ul produsului de obținut
}

/**
 * Variabile pentru GetProductsByCategory
 */
export interface GetProductsByCategoryVariables {
  category: ProductCategory; // Categoria de filtrat
}

/**
 * Variabile pentru SearchProducts
 */
export interface SearchProductsVariables {
  query: string; // Termenul de căutare
}

/**
 * Variabile pentru GetUserOrders
 */
export interface GetUserOrdersVariables {
  userId: string; // ID-ul utilizatorului
}

/**
 * Variabile pentru GetOrderById
 */
export interface GetOrderByIdVariables {
  id: string; // ID-ul comenzii
}

/**
 * Variabile pentru GetUserAddresses
 */
export interface GetUserAddressesVariables {
  userId: string; // ID-ul utilizatorului
}

// ============================================================================
// TIPURI VARIABILE MUTATION
// ============================================================================

/**
 * Variabile pentru mutația Login
 */
export interface LoginVariables {
  input: LoginInput;
}

/**
 * Variabile pentru mutația Signup
 */
export interface SignupVariables {
  input: SignupInput;
}

/**
 * Variabile pentru mutația UpdateProfile
 */
export interface UpdateProfileVariables {
  userId: string;        // ID-ul utilizatorului
  input: ProfileUpdateInput; // Datele de actualizat
}

/**
 * Variabile pentru mutația RequestPasswordReset
 */
export interface RequestPasswordResetVariables {
  email: string; // Email-ul contului
}

/**
 * Variabile pentru mutația ResetPassword
 */
export interface ResetPasswordVariables {
  token: string;       // Token-ul de resetare
  newPassword: string; // Noua parolă
}

/**
 * Variabile pentru mutația DeleteAccount
 */
export interface DeleteAccountVariables {
  password: string;    // Parola pentru confirmare
  confirmText: string; // Text de confirmare ("DELETE")
}

/**
 * Variabile pentru mutația CreateAddress
 */
export interface CreateAddressVariables {
  input: AddressInput;
}

/**
 * Variabile pentru mutația UpdateAddress
 */
export interface UpdateAddressVariables {
  id: string;          // ID-ul adresei
  input: AddressInput; // Datele de actualizat
}

/**
 * Variabile pentru mutația DeleteAddress
 */
export interface DeleteAddressVariables {
  id: string; // ID-ul adresei de șters
}

/**
 * Variabile pentru mutația SetDefaultAddress
 */
export interface SetDefaultAddressVariables {
  id: string; // ID-ul adresei
}

/**
 * Variabile pentru mutația CreateOrder
 */
export interface CreateOrderVariables {
  input: CreateOrderInput;
}

/**
 * Variabile pentru mutația CancelOrder
 */
export interface CancelOrderVariables {
  id: string; // ID-ul comenzii
}

/**
 * Variabile pentru mutația AddReview
 */
export interface AddReviewVariables {
  productId: string;  // ID-ul produsului
  input: ReviewInput; // Datele recenziei
}
