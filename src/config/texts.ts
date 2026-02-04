/**
 * Text labels and messages for the application
 * Centralized for easy localization and consistency
 */

export const texts = {
  // App info
  app: {
    name: 'FoodOrder',
    tagline: 'Comandă mâncare delicioasă, livrată rapid',
    copyright: '© 2024 FoodOrder. Toate drepturile rezervate.',
  },

  // Navigation
  nav: {
    home: 'Acasă',
    catalog: 'Catalog',
    cart: 'Coș',
    profile: 'Profil',
    login: 'Autentificare',
    signup: 'Înregistrare',
    logout: 'Deconectare',
  },

  // Home page
  home: {
    heroTitle: 'Mâncare Delicioasă la Ușa Ta',
    heroSubtitle: 'Descoperă cele mai bune preparate din zona ta',
    searchPlaceholder: 'Caută preparate sau restaurante...',
    categories: 'Categorii',
    recommended: 'Recomandate pentru tine',
    viewAll: 'Vezi toate',
    orderNow: 'Comandă acum',
  },

  // Auth pages
  auth: {
    loginTitle: 'Bine ai revenit!',
    loginSubtitle: 'Conectează-te pentru a continua',
    signupTitle: 'Creează cont',
    signupSubtitle: 'Înregistrează-te pentru a comanda',
    emailLabel: 'Email',
    emailPlaceholder: 'exemplu@email.com',
    passwordLabel: 'Parolă',
    passwordPlaceholder: 'Introdu parola',
    confirmPasswordLabel: 'Confirmă parola',
    confirmPasswordPlaceholder: 'Reintrodu parola',
    nameLabel: 'Nume complet',
    namePlaceholder: 'Ion Popescu',
    phoneLabel: 'Telefon',
    phonePlaceholder: '0700 000 000',
    loginButton: 'Conectează-te',
    signupButton: 'Creează cont',
    forgotPassword: 'Ai uitat parola?',
    noAccount: 'Nu ai cont?',
    hasAccount: 'Ai deja cont?',
    orContinueWith: 'sau continuă cu',
  },

  // Profile page
  profile: {
    title: 'Profilul meu',
    editProfile: 'Editează profil',
    saveChanges: 'Salvează',
    cancel: 'Anulează',
    orderHistory: 'Istoric comenzi',
    noOrders: 'Nu ai nicio comandă încă.',
    personalInfo: 'Informații personale',
    addressLabel: 'Adresă',
    addressPlaceholder: 'Strada, număr, bloc, apartament',
    cityLabel: 'Oraș',
    cityPlaceholder: 'București',
    // New settings section
    settings: 'Setări cont',
    deliveryAddresses: 'Adrese de livrare',
    noAddresses: 'Nu ai adrese salvate',
    addAddress: 'Adaugă adresă',
    editAddress: 'Editează adresa',
    deleteAddress: 'Șterge adresa',
    setAsDefault: 'Setează ca principală',
    defaultAddress: 'Adresă principală',
    addressLabelField: 'Denumire',
    addressLabelPlaceholder: 'ex: Acasă, Birou',
    // Account actions
    resetPassword: 'Resetare parolă',
    resetPasswordDesc: 'Trimite un email pentru a reseta parola',
    resetPasswordButton: 'Trimite email de resetare',
    resetPasswordSent: 'Email-ul de resetare a fost trimis',
    deleteAccount: 'Șterge cont',
    deleteAccountDesc: 'Această acțiune este ireversibilă',
    deleteAccountButton: 'Șterge contul definitiv',
    deleteAccountConfirmText: 'ȘTERGE CONTUL',
    deleteAccountWarning: 'Pentru a confirma ștergerea, introdu parola și scrie "ȘTERGE CONTUL"',
    accountDeleted: 'Contul a fost șters',
  },

  // Catalog page
  catalog: {
    title: 'Catalog',
    allCategories: 'Toate categoriile',
    filterBy: 'Filtrează după',
    sortBy: 'Sortează după',
    priceAsc: 'Preț crescător',
    priceDesc: 'Preț descrescător',
    nameAsc: 'Nume A-Z',
    noProducts: 'Nu s-au găsit produse.',
    addToCart: 'Adaugă în coș',
    added: 'Adăugat!',
  },

  // Product details page
  productDetails: {
    ingredients: 'Ingrediente',
    allergens: 'Alergeni',
    reviews: 'Recenzii',
    noReviews: 'Nu există recenzii încă.',
    similarProducts: 'Produse similare',
    preparationTime: 'Timp preparare',
    minutes: 'min',
    backToCatalog: 'Înapoi la catalog',
    addToCart: 'Adaugă în coș',
    outOfStock: 'Indisponibil',
  },

  // Cart page
  cart: {
    title: 'Coșul tău',
    empty: 'Coșul tău este gol',
    emptySubtitle: 'Adaugă produse pentru a continua',
    continueShopping: 'Continuă cumpărăturile',
    subtotal: 'Subtotal',
    delivery: 'Livrare',
    total: 'Total',
    checkout: 'Finalizează comanda',
    remove: 'Elimină',
    quantity: 'Cantitate',
    freeDelivery: 'Livrare gratuită',
    deliveryCost: 'Cost livrare',
  },

  // Checkout page
  checkout: {
    title: 'Finalizare comandă',
    deliveryInfo: 'Informații livrare',
    paymentMethod: 'Metodă plată',
    cash: 'Numerar la livrare',
    card: 'Card bancar',
    orderSummary: 'Sumar comandă',
    placeOrder: 'Plasează comanda',
    processing: 'Se procesează...',
    orderSuccess: 'Comandă plasată cu succes!',
    orderSuccessMessage: 'Vei primi un email de confirmare în curând.',
    backToHome: 'Înapoi acasă',
  },

  // Validation messages
  validation: {
    required: 'Acest câmp este obligatoriu',
    invalidEmail: 'Email invalid',
    passwordMin: 'Parola trebuie să aibă minim 6 caractere',
    passwordMatch: 'Parolele nu coincid',
    invalidPhone: 'Număr de telefon invalid',
    invalidName: 'Numele trebuie să aibă minim 2 caractere',
  },

  // Notifications
  notifications: {
    loginSuccess: 'Te-ai conectat cu succes!',
    loginError: 'Email sau parolă incorectă',
    signupSuccess: 'Cont creat cu succes!',
    signupError: 'Eroare la crearea contului',
    logoutSuccess: 'Te-ai deconectat',
    profileUpdated: 'Profil actualizat',
    addedToCart: 'Produs adăugat în coș',
    removedFromCart: 'Produs eliminat din coș',
    orderPlaced: 'Comandă plasată cu succes!',
    orderError: 'Eroare la plasarea comenzii',
    networkError: 'Eroare de rețea. Încearcă din nou.',
    addressSaved: 'Adresa a fost salvată',
    addressDeleted: 'Adresa a fost ștearsă',
    passwordResetError: 'Eroare la trimiterea email-ului',
    deleteAccountError: 'Eroare la ștergerea contului',
    invalidPassword: 'Parolă incorectă',
    invalidConfirmText: 'Textul de confirmare nu este corect',
  },

  // Common
  common: {
    loading: 'Se încarcă...',
    error: 'A apărut o eroare',
    retry: 'Încearcă din nou',
    close: 'Închide',
    confirm: 'Confirmă',
    currency: 'RON',
    back: 'Înapoi',
  },
} as const;

export type TextsType = typeof texts;
