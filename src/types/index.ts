/**
 * =============================================================================
 * DEFINIȚII DE TIPURI PENTRU APLICAȚIE
 * =============================================================================
 * 
 * Acest fișier conține toate tipurile TypeScript folosite în aplicație.
 * 
 * Categorii principale:
 * - Tipuri pentru utilizatori și autentificare
 * - Tipuri pentru token-uri JWT
 * - Tipuri pentru produse și categorii
 * - Tipuri pentru coș și comenzi
 * - Tipuri pentru răspunsuri API
 * =============================================================================
 */

// =============================================================================
// TIPURI UTILIZATOR ȘI AUTENTIFICARE
// =============================================================================

/** Datele complete ale utilizatorului */
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  pointsBalance?: number;
  welcomeBonusSeen?: boolean;
  welcomeBonusAmount?: number;
  /** Total XP acumulat (din pluginul de niveluri) */
  totalXp: number;
  /** Nivelul curent de loialitate (dacă pluginul tiers este activ) */
  tier?: {
    id: string;
    name: string;
    xpThreshold: number;
    pointsMultiplier: number;
    badgeIcon?: string | null;
    benefitDescription?: string | null;
  } | null;
  /** Următorul nivel și pragul său de XP */
  nextTier?: {
    id: string;
    name: string;
    xpThreshold: number;
    pointsMultiplier: number;
    badgeIcon?: string | null;
    benefitDescription?: string | null;
  } | null;
  /** XP rămas până la următorul nivel */
  xpToNextLevel?: number | null;
  createdAt: string;
  /** Beneficii de produse gratuite (plugin free-products) */
  hasFreeProductBenefits?: boolean;
  freeProductCampaignsSummary?: {
    id: string;
    name: string;
    customText: string | null;
    minOrderValue: number;
    products: string[];
    productDetails?: { id: string; name: string; categoryName: string; categoryIcon?: string | null }[];
  }[];
}

/** 
 * Tipuri pentru token-uri JWT
 * - accessToken: Token de scurtă durată pentru autorizare cereri
 * - refreshToken: Token de lungă durată pentru reînnoirea accessToken
 */
export interface AuthTokens {
  accessToken: string;
  /** 
   * Refresh token - OPȚIONAL în frontend
   * SECURITY: Refresh token-ul este stocat în HttpOnly cookie de către backend,
   * NU în JavaScript/localStorage. Acest câmp există doar pentru compatibilitate.
   */
  refreshToken?: string;
  /** Timestamp când accessToken expiră (în milisecunde) */
  accessTokenExpiresAt: number;
}

/** Starea de autentificare în Redux */
export interface AuthState {
  user: User | null;
  /** @deprecated Folosește tokens.accessToken în loc */
  token: string | null;
  /** Token-uri JWT gestionate în memorie (nu în localStorage) */
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  /** Indică dacă se face refresh la token în acest moment */
  isRefreshing: boolean;
}

/** Credențiale pentru autentificare */
export interface LoginCredentials {
  email: string;
  password: string;
}

/** Date pentru înregistrare utilizator nou */
export interface SignupData {
  email: string;
  password: string;
  name: string;
  phone: string;
}

/** Date pentru actualizarea profilului */
export interface ProfileUpdateData {
  name?: string;
  phone?: string;
}

// =============================================================================
// TIPURI ADRESE DE LIVRARE
// =============================================================================

/** Adresă de livrare salvată */
export interface DeliveryAddress {
  id: string;
  label: string; // ex: "Acasă", "Birou"
  address: string;
  city: string;
  phone: string;
  notes?: string;
  isDefault: boolean;
}

// =============================================================================
// TIPURI RESETARE PAROLĂ ȘI ȘTERGERE CONT
// =============================================================================

/** Cerere pentru resetare parolă */
export interface PasswordResetRequest {
  email: string;
}

/** Confirmare resetare parolă */
export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

/** Cerere pentru ștergerea contului */
export interface DeleteAccountRequest {
  password: string;
  confirmText: string; // Trebuie să fie "ȘTERGE CONTUL"
}

// =============================================================================
// TIPURI PRODUSE
// =============================================================================

/** Ingredient produs cu indicator de alergen */
export interface ProductIngredient {
  name: string;
  isAllergen?: boolean;
}

/** Produs complet */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  /** Numele categoriei (display name) pentru afișare */
  category: string;
  /** ID-ul categoriei pentru filtrare */
  categoryId?: string;
  isAvailable: boolean;
  preparationTime?: number; // în minute
  ingredients?: ProductIngredient[];
}

/** Categorii de produse disponibile */
export type ProductCategory = 
  | 'pizza'
  | 'burger'
  | 'paste'
  | 'salate'
  | 'desert'
  | 'bauturi';

/** Starea produselor în Redux */
export interface ProductsState {
  items: Product[];
  filteredItems: Product[];
  categories: ProductCategory[];
  selectedCategory: ProductCategory | null;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
}

// =============================================================================
// TIPURI COȘ DE CUMPĂRĂTURI
// =============================================================================

/** Element din coș */
export interface CartItem {
  product: Product;
  quantity: number;
}

/** Starea coșului în Redux */
export interface CartState {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

// =============================================================================
// TIPURI COMENZI
// =============================================================================

/** Item dintr-o comandă (snapshot la momentul plasării) */
export interface OrderItem {
  id?: number;
  productId?: string | null;
  productName: string;
  productImage?: string | null;
  quantity: number;
  /** Prețul produsului la momentul comenzii */
  priceAtOrder: number;
}

/** Tip de îndeplinire a comenzii */
export type FulfillmentType = 'delivery' | 'in_location';

/** Comandă - exclude date sensibile în răspunsul pentru listă (phone, notes, paymentMethod) */
export interface Order {
  id: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  fulfillmentType?: FulfillmentType;
  tableNumber?: string | null;
  deliveryAddress: string;
  deliveryCity: string;
  phone?: string;
  notes?: string | null;
  paymentMethod?: PaymentMethod;
  pointsEarned?: number;
  pointsUsed?: number;
  discountFromPoints?: number;
  discountFromFreeProducts?: number;
  items: OrderItem[];
  createdAt: string;
  estimatedDelivery?: string | null;
  deliveredAt?: string | null;
}

/** Stări posibile pentru o comandă */
export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'delivering'
  | 'delivered'
  | 'cancelled';

/** Metode de plată disponibile */
export type PaymentMethod = 'cash' | 'card';

/** Date pentru finalizarea comenzii */
export interface CheckoutData {
  fulfillmentType?: FulfillmentType;
  tableNumber?: string | null;
  deliveryAddress: string;
  deliveryCity: string;
  phone: string;
  notes?: string;
  paymentMethod: PaymentMethod;
  pointsToUse?: number;
}

/** Prag puncte loialitate */
export interface PointsReward {
  id: string;
  pointsCost: number;
  discountAmount: number;
  isActive: boolean;
}

/** Categorie produs din backend */
export interface Category {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  image?: string;
  icon?: string;
  productsCount?: number;
}

// =============================================================================
// TIPURI RĂSPUNSURI API
// =============================================================================

/** Răspuns generic de la API */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** Răspuns autentificare cu token-uri */
export interface AuthApiResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  /** Durata de viață a accessToken în secunde */
  expiresIn: number;
}

/** Răspuns refresh token */
export interface RefreshTokenResponse {
  accessToken: string;
  /** Durata de viață în secunde */
  expiresIn: number;
}
