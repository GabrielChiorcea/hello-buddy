// /**
//  * Text labels and messages for the application
//  * Centralized for easy localization and consistency
//  */

// export const texts = {
//   // App info
//   app: {
//     name: 'FoodOrder',
//     tagline: 'Comandă mâncare delicioasă, livrată rapid',
//     copyright: '© 2024 FoodOrder. Toate drepturile rezervate.',
//   },

//   // Navigation
//   nav: {
//     home: 'Acasă',
//     catalog: 'Catalog',
//     cart: 'Coș',
//     profile: 'Profil',
//     login: 'Autentificare',
//     signup: 'Înregistrare',
//     logout: 'Deconectare',
//   },

//   // Home page
//   home: {
//     heroTitle: 'Mâncare Delicioasă la Ușa Ta',
//     heroSubtitle: 'Descoperă cele mai bune preparate din zona ta',
//     searchPlaceholder: 'Caută preparate sau restaurante...',
//     categories: 'Categorii',
//     recommended: 'Recomandate pentru tine',
//     totalProductsInMenu: '{count} produse în meniu',
//     viewAll: 'Vezi toate',
//     orderNow: 'Comandă acum',
//   },

//   // Auth pages
//   auth: {
//     loginTitle: 'Bine ai revenit!',
//     loginSubtitle: 'Conectează-te pentru a continua',
//     signupTitle: 'Creează cont',
//     signupSubtitle: 'Înregistrează-te pentru a comanda',
//     emailLabel: 'Email',
//     emailPlaceholder: 'exemplu@email.com',
//     passwordLabel: 'Parolă',
//     passwordPlaceholder: 'Introdu parola',
//     confirmPasswordLabel: 'Confirmă parola',
//     confirmPasswordPlaceholder: 'Reintrodu parola',
//     nameLabel: 'Nume complet',
//     namePlaceholder: 'Ion Popescu',
//     phoneLabel: 'Telefon',
//     phonePlaceholder: '0700 000 000',
//     loginButton: 'Conectează-te',
//     signupButton: 'Creează cont',
//     forgotPassword: 'Ai uitat parola?',
//     forgotPasswordTitle: 'Resetează parola',
//     forgotPasswordSubtitle: 'Introdu email-ul contului și îți vom trimite un link pentru resetare.',
//     forgotPasswordButton: 'Trimite link de resetare',
//     forgotPasswordSuccess: 'Dacă există un cont cu acest email, vei primi un link pentru resetarea parolei.',
//     resetPasswordTitle: 'Parolă nouă',
//     resetPasswordSubtitle: 'Introdu noua parolă pentru contul tău.',
//     resetPasswordButton: 'Resetează parola',
//     resetPasswordSuccess: 'Parola a fost resetată. Poți să te autentifici cu noua parolă.',
//     resetPasswordInvalidToken: 'Link-ul de resetare este invalid sau a expirat. Solicită unul nou.',
//     noAccount: 'Nu ai cont?',
//     hasAccount: 'Ai deja cont?',
//     orContinueWith: 'sau continuă cu',
//   },

//   // Profile page
//   profile: {
//     title: 'Profilul meu',
//     editProfile: 'Editează profil',
//     saveChanges: 'Salvează',
//     cancel: 'Anulează',
//     orderHistory: 'Istoric comenzi',
//     noOrders: 'Nu ai nicio comandă încă.',
//     personalInfo: 'Informații personale',
//     addressLabel: 'Adresă',
//     addressPlaceholder: 'Strada, număr, bloc, apartament',
//     cityLabel: 'Oraș',
//     cityPlaceholder: 'București',
//     // New settings section
//     settings: 'Setări cont',
//     deliveryAddresses: 'Adrese de livrare',
//     noAddresses: 'Nu ai adrese salvate',
//     addAddress: 'Adaugă adresă',
//     editAddress: 'Editează adresa',
//     deleteAddress: 'Șterge adresa',
//     setAsDefault: 'Setează ca principală',
//     defaultAddress: 'Adresă principală',
//     addressLabelField: 'Denumire',
//     addressLabelPlaceholder: 'ex: Acasă, Birou',
//     // Account actions
//     resetPassword: 'Resetare parolă',
//     resetPasswordDesc: 'Trimite un email pentru a reseta parola',
//     resetPasswordButton: 'Trimite email de resetare',
//     resetPasswordSent: 'Email-ul de resetare a fost trimis',
//     deleteAccount: 'Șterge cont',
//     deleteAccountDesc: 'Această acțiune este ireversibilă',
//     deleteAccountButton: 'Șterge contul definitiv',
//     deleteAccountConfirmText: 'ȘTERGE CONTUL',
//     deleteAccountWarning: 'Pentru a confirma ștergerea, introdu parola și scrie "ȘTERGE CONTUL"',
//     accountDeleted: 'Contul a fost șters',
//   },

//   // Catalog page
//   catalog: {
//     title: 'Catalog',
//     allCategories: 'Toate categoriile',
//     filterBy: 'Filtrează după',
//     sortBy: 'Sortează după',
//     priceAsc: 'Preț crescător',
//     priceDesc: 'Preț descrescător',
//     nameAsc: 'Nume A-Z',
//     noProducts: 'Nu s-au găsit produse.',
//     addToCart: 'Adaugă în coș',
//     added: 'Adăugat!',
//   },

//   // Product details page
//   productDetails: {
//     ingredients: 'Ingrediente',
//     allergens: 'Alergeni',
//     reviews: 'Recenzii',
//     noReviews: 'Nu există recenzii încă.',
//     similarProducts: 'Produse similare',
//     preparationTime: 'Timp preparare',
//     minutes: 'min',
//     backToCatalog: 'Înapoi la catalog',
//     addToCart: 'Adaugă în coș',
//     outOfStock: 'Indisponibil',
//   },

//   // Cart page
//   cart: {
//     title: 'Coșul tău',
//     empty: 'Coșul tău este gol',
//     emptySubtitle: 'Adaugă produse pentru a continua',
//     continueShopping: 'Continuă cumpărăturile',
//     subtotal: 'Subtotal',
//     delivery: 'Livrare',
//     total: 'Total',
//     checkout: 'Finalizează comanda',
//     remove: 'Elimină',
//     quantity: 'Cantitate',
//     freeDelivery: 'Livrare gratuită',
//     deliveryCost: 'Cost livrare',
//   },

//   // Checkout page
//   checkout: {
//     title: 'Finalizare comandă',
//     deliveryInfo: 'Informații livrare',
//     paymentMethod: 'Metodă plată',
//     cash: 'Numerar la livrare',
//     card: 'Card bancar',
//     orderSummary: 'Sumar comandă',
//     placeOrder: 'Plasează comanda',
//     processing: 'Se procesează...',
//     orderSuccess: 'Comandă plasată cu succes!',
//     orderSuccessMessage: 'Vei primi un email de confirmare în curând.',
//     backToHome: 'Înapoi acasă',
//     backToSavedAddresses: 'Alege o adresă salvată',
//   },

//   // Validation messages
//   validation: {
//     required: 'Acest câmp este obligatoriu',
//     invalidEmail: 'Email invalid',
//     passwordMin: 'Parola trebuie să aibă minim 6 caractere',
//     passwordMatch: 'Parolele nu coincid',
//     invalidPhone: 'Număr de telefon invalid',
//     invalidName: 'Numele trebuie să aibă minim 2 caractere',
//   },

//   // Notifications
//   notifications: {
//     loginSuccess: 'Te-ai conectat cu succes!',
//     loginError: 'Email sau parolă incorectă',
//     signupSuccess: 'Cont creat cu succes!',
//     signupError: 'Eroare la crearea contului',
//     logoutSuccess: 'Te-ai deconectat',
//     profileUpdated: 'Profil actualizat',
//     addedToCart: 'Produs adăugat în coș',
//     removedFromCart: 'Produs eliminat din coș',
//     orderPlaced: 'Comandă plasată cu succes!',
//     orderError: 'Eroare la plasarea comenzii',
//     networkError: 'Eroare de rețea. Încearcă din nou.',
//     addressSaved: 'Adresa a fost salvată',
//     addressDeleted: 'Adresa a fost ștearsă',
//     passwordResetError: 'Eroare la trimiterea email-ului',
//     deleteAccountError: 'Eroare la ștergerea contului',
//     invalidPassword: 'Parolă incorectă',
//     invalidConfirmText: 'Textul de confirmare nu este corect',
//   },

//   // Common
//   common: {
//     loading: 'Se încarcă...',
//     error: 'A apărut o eroare',
//     retry: 'Încearcă din nou',
//     close: 'Închide',
//     confirm: 'Confirmă',
//     currency: 'RON',
//     back: 'Înapoi',
//   },

//   // Cadou puncte la prima autentificare
//   welcomeBonus: {
//     title: 'Ai câștigat {count} puncte!',
//     description: 'Le poți folosi la următoarea comandă pentru reducere.',
//     goToProducts: 'Mergi la produse',
//   },

//   // Admin Analytics
//   analytics: {
//     title: 'Analitice',
//     subtitle: 'Rapoarte avansate despre afacerea ta',
//     grossRevenue: 'Venit Brut Total',
//     netProfitPerOrder: 'Profit Net per Comandă',
//     aov: 'Valoarea Medie a Coșului (AOV)',
//     salesByCategory: 'Volumul Vânzărilor per Categorie',
//     revenueGrowthRate: 'Rata de Creștere a Veniturilor',
//     totalDeliveryFees: 'Total Taxe de Livrare Colectate',
//     totalOrders: 'Total Comenzi',
//     vsPreviousPeriod: 'vs. perioada anterioară',
//     noData: 'Nu există date',
//     topCustomers: 'Top clienți fideli',
//     frequentlyOrderedTogether: 'Frecvent comandate împreună',
//     fulfillmentDeliveryVsInLocation: 'Livrare vs. În locație',
//     fulfillmentTrend: 'Trend fulfillment pe săptămâni',
//     delivery: 'Livrare',
//     inLocation: 'În locație',
//     revenue: 'Venituri',
//     orders: 'comenzi',
//     cancellationRate: 'Rată Anulări',
//     cancelledOrders: 'comenzi anulate',
//     peakHours: 'Ore de Vârf',
//     dailyRevenueTrend: 'Trend Venituri Zilnice',
//     // Points
//     pointsTitle: 'Analitice Puncte Loialitate',
//     pointsEarned: 'Puncte Câștigate',
//     pointsSpent: 'Puncte Consumate',
//     redemptionRate: 'Rată Utilizare Puncte',
//     redemptions: 'Răscumpărări',
//     uniqueEarners: 'Utilizatori unici (câștig)',
//     uniqueRedeemers: 'Utilizatori unici (consum)',
//     aovWithPoints: 'AOV cu puncte',
//     aovWithoutPoints: 'AOV fără puncte',
//     totalDiscountFromPoints: 'Total Reduceri din Puncte',
//     topPointsEarners: 'Top câștigători puncte',
//     pointsTrend: 'Trend puncte zilnic',
//     balance: 'Sold',
//     earned: 'Câștigate',
//     spent: 'Consumate',
//     // Streaks
//     streaksTitle: 'Analitice Campanii Streak',
//     enrolled: 'Înscriși',
//     completed: 'Completate',
//     active: 'Activi',
//     avgStreak: 'Media streak',
//     pointsAwarded: 'Puncte acordate',
//     completionRate: 'Rată completare',
//     // Tiers
//     tiersTitle: 'Analitice Ranguri (Tiers)',
//     tierName: 'Nivel',
//     userCount: 'Utilizatori',
//     tierRevenue: 'Venituri nivel',
//     tierAvgOrder: 'Medie comandă',
//     tierMultiplier: 'Multiplicator',
//     tierDistribution: 'Distribuție utilizatori per nivel',
//     tierLtv: 'Valoare per nivel',
//   },

//   // Free products plugin (produse gratis pe rank)
//   freeProducts: {
//     adminTitle: 'Campanii produse gratis pe rank',
//     adminSubtitle:
//       'Configurează campanii în care anumite produse devin gratuite pentru clienții cu un anumit nivel (tier), într-o perioadă limitată.',
//     adminMenuLabel: 'Produse gratis pe rank',
//     listTitle: 'Campanii',
//     listDescription:
//       'Fiecare campanie se aplică unui singur nivel (tier). Poți crea mai multe campanii pentru niveluri diferite sau perioade diferite.',
//     listEmpty:
//       'Nicio campanie. Creează una nouă pentru a oferi produse gratis clienților fideli.',
//     loading: 'Se încarcă...',
//     createButton: 'Campanie nouă',
//     editDialogTitle: 'Editează campania de produse gratis',
//     createDialogTitle: 'Campanie nouă de produse gratis',
//     dialogSubtitle:
//       'Alege nivelul țintă, perioada și produsele care vor fi gratuite pentru clienți.',
//     nameLabel: 'Nume campanie',
//     namePlaceholder: 'ex: Gratis cafea pentru Gold',
//     tierLabel: 'Nivel (tier)',
//     tierPlaceholder: 'Alege nivelul',
//     customTextLabel: 'Mesaj afișat clientului (opțional)',
//     customTextPlaceholder: 'ex: Produs gratuit pentru nivelul tău de loialitate',
//     startDateLabel: 'Data start',
//     endDateLabel: 'Data sfârșit',
//     minOrderValueLabel: 'Valoare minimă comandă (RON)',
//     minOrderValueHelp: '0 = fără prag de sumă. Gratuitatea se aplică doar peste acest prag.',
//     productsLabel: 'Produse gratuite în campanie',
//     productsHelp:
//       'Bifează produsele care vor fi gratuite pentru utilizatorii cu nivelul selectat (maxim 1 bucată per produs per comandă).',
//     productsEmpty: 'Nu există produse în catalog.',
//     productsCount: '{count} produse',
//     activeBadge: 'Activă',
//     cancel: 'Anulare',
//     save: 'Salvează',
//     deleteTitle: 'Șterge campania?',
//     deleteDescription: 'Campania „{name}” va fi ștearsă permanent.',
//     deleteConfirm: 'Șterge',
//     toastLoadError: 'Nu s-au putut încărca campaniile sau datele auxiliare',
//     toastSaveError: 'Eroare la salvare',
//     toastDeleteError: 'Eroare la ștergere',
//     toastCreated: 'Campanie creată',
//     toastUpdated: 'Campanie actualizată',
//     toastDeleted: 'Campanie ștearsă',
//     validationNameRequired: 'Numele este obligatoriu',
//     validationTierRequired: 'Selectează un nivel (tier)',
//     validationDatesRequired: 'Datele de start și sfârșit sunt obligatorii',
//     validationDatesOrder: 'Data de start trebuie să fie înainte de data de sfârșit',
//     validationMinOrderValue:
//       'Valoarea minimă a comenzii trebuie să fie un număr mai mare sau egal cu 0',
//     warnNoProducts:
//       'Campania nu are niciun produs selectat. Poți continua, dar nu va avea efect până nu adaugi produse.',
//     // Frontend user-facing
//     rankInfoNone:
//       'Momentan nu ai produse gratuite pentru acest nivel, dar pot apărea campanii speciale pentru tine în orice moment.',
//     rankInfoActivePrefix: 'Ai produse gratuite active pentru nivelul tău:',
//     rankInfoMinOrder:
//       'Comandă minim {amount} RON în coș și primești 1 buc. gratuit din fiecare produs de mai jos.',
//     rankInfoNoMinOrder:
//       'Adaugă în coș un produs din lista de mai jos și îl primești gratuit (1 buc.).',
//     rankInfoCta: 'Adaugă în coș pentru a beneficia.',
//     cartGridTitle: 'Produse gratuite pentru nivelul tău',
//     cartDiscountLabel: 'Produse gratuite',
//     cartInfoNone:
//       'Uneori poți primi produse gratuite pentru nivelul tău de loialitate — urmărește ofertele speciale.',
//   },

//   // Streak V2 marketing
//   streak: {
//     pageTitle: 'Campanii Streak',
//     pageSubtitle: 'Completează provocări și câștigă puncte bonus',
//     noCampaigns: 'Momentan nu există campanii active.',
//     homeCardTitle: 'Câștigă puncte BONUS',
//     homeCardActive: 'Streak activ — continuă seria!',
//     homeCardAvailable: 'Provocări disponibile — înscrie-te acum!',
//     homeCardLost: 'Ai pierdut un streak — vezi detalii!',
//     homeCardCompleted: 'Streak completat — felicitări! 🎉',
//     homeCardCta: 'Vezi provocările',
//     homeCardPoints: '+{points} puncte posibile',
//     comboCardTitle: 'Combouri speciale',
//     comboCardSubtitle: 'În curând...',

//     /** Home card — doar varianta gamified (deal + urgență + CTA) */
//     homeGamifiedDealUnit: 'puncte bonus',
//     homeGamifiedUrgencyDays: 'Mai ai {days} zile',
//     homeGamifiedUrgencyTwo: 'Ultimele 2 zile',
//     homeGamifiedUrgencyLast: 'Ultima zi — nu pierde bonusul',
//     homeGamifiedTrustAvailable: 'Exclusiv din provocări — bonus mai mare decât la o simplă comandă.',
//     homeGamifiedHeadlineAvailable: 'Cea mai bună ofertă de puncte',
//     homeGamifiedHeadlineActive: 'Bonus mare la finalul provocării',
//     homeGamifiedSubActive: 'Mai ai nevoie de comenzi — nu întrerupe seria.',
//     homeGamifiedHeadlineLost: 'Poți începe din nou o provocare',
//     homeGamifiedHeadlineCompleted: 'Ai deblocat bonusul',
//     homeGamifiedSubCompleted: 'Felicitări — punctele sunt ale tale.',
//     homeGamifiedCtaAvailable: 'Înscrie-te și câștigă',
//     homeGamifiedCtaActive: 'Continuă provocarea',
//     homeGamifiedCtaLost: 'Vezi provocările',
//     homeGamifiedCtaCompleted: 'Descoperă alte oferte',
//   },
// } as const;

// export type TextsType = typeof texts;


/**
 * Text labels and messages for the application
 * Centralized for easy localization and consistency
 */

export const texts = {
  // App info
  app: {
    name: 'FoodOrder',
    tagline: 'Order delicious food, delivered fast',
    copyright: '© 2024 FoodOrder. All rights reserved.',
  },

  // Navigation
  nav: {
    home: 'Home',
    catalog: 'Catalog',
    cart: 'Cart',
    profile: 'Profile',
    login: 'Login',
    signup: 'Sign Up',
    logout: 'Logout',
  },

  // Home page
  home: {
    heroTitle: 'Delicious Food at Your Door',
    heroSubtitle: 'Discover the best dishes in your area',
    searchPlaceholder: 'Search dishes or restaurants...',
    categories: 'Categories',
    recommended: 'Recommended for you',
    totalProductsInMenu: '{count} products in menu',
    viewAll: 'View all',
    orderNow: 'Order now',
  },

  // Auth pages
  auth: {
    loginTitle: 'Welcome back!',
    loginSubtitle: 'Sign in to continue',
    signupTitle: 'Create account',
    signupSubtitle: 'Register to place orders',
    emailLabel: 'Email',
    emailPlaceholder: 'example@email.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    confirmPasswordLabel: 'Confirm password',
    confirmPasswordPlaceholder: 'Re-enter your password',
    nameLabel: 'Full name',
    namePlaceholder: 'John Doe',
    phoneLabel: 'Phone',
    phonePlaceholder: '+1 000 000 0000',
    loginButton: 'Sign in',
    signupButton: 'Create account',
    forgotPassword: 'Forgot your password?',
    forgotPasswordTitle: 'Reset password',
    forgotPasswordSubtitle: 'Enter your account email and we will send you a reset link.',
    forgotPasswordButton: 'Send reset link',
    forgotPasswordSuccess: 'If an account exists with this email, you will receive a password reset link.',
    resetPasswordTitle: 'New password',
    resetPasswordSubtitle: 'Enter the new password for your account.',
    resetPasswordButton: 'Reset password',
    resetPasswordSuccess: 'Password has been reset. You can now sign in with your new password.',
    resetPasswordInvalidToken: 'The reset link is invalid or has expired. Please request a new one.',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    orContinueWith: 'or continue with',
  },

  // Profile page
  profile: {
    title: 'My Profile',
    editProfile: 'Edit profile',
    saveChanges: 'Save',
    cancel: 'Cancel',
    orderHistory: 'Order history',
    noOrders: 'You have no orders yet.',
    personalInfo: 'Personal information',
    addressLabel: 'Address',
    addressPlaceholder: 'Street, number, building, apartment',
    cityLabel: 'City',
    cityPlaceholder: 'New York',
    // New settings section
    settings: 'Account settings',
    deliveryAddresses: 'Delivery addresses',
    noAddresses: 'No saved addresses',
    addAddress: 'Add address',
    editAddress: 'Edit address',
    deleteAddress: 'Delete address',
    setAsDefault: 'Set as default',
    defaultAddress: 'Default address',
    addressLabelField: 'Label',
    addressLabelPlaceholder: 'e.g.: Home, Office',
    // Account actions
    resetPassword: 'Reset password',
    resetPasswordDesc: 'Send an email to reset your password',
    resetPasswordButton: 'Send reset email',
    resetPasswordSent: 'Reset email has been sent',
    deleteAccount: 'Delete account',
    deleteAccountDesc: 'This action is irreversible',
    deleteAccountButton: 'Permanently delete account',
    deleteAccountConfirmText: 'DELETE ACCOUNT',
    deleteAccountWarning: 'To confirm deletion, enter your password and type "DELETE ACCOUNT"',
    accountDeleted: 'Account has been deleted',
  },

  // Catalog page
  catalog: {
    title: 'Catalog',
    allCategories: 'All categories',
    filterBy: 'Filter by',
    sortBy: 'Sort by',
    priceAsc: 'Price: low to high',
    priceDesc: 'Price: high to low',
    nameAsc: 'Name A-Z',
    noProducts: 'No products found.',
    addToCart: 'Add to cart',
    added: 'Added!',
  },

  // Product details page
  productDetails: {
    ingredients: 'Ingredients',
    allergens: 'Allergens',
    reviews: 'Reviews',
    noReviews: 'No reviews yet.',
    similarProducts: 'Similar products',
    preparationTime: 'Preparation time',
    minutes: 'min',
    backToCatalog: 'Back to catalog',
    addToCart: 'Add to cart',
    outOfStock: 'Out of stock',
  },

  // Cart page
  cart: {
    title: 'Your cart',
    empty: 'Your cart is empty',
    emptySubtitle: 'Add products to continue',
    continueShopping: 'Continue shopping',
    subtotal: 'Subtotal',
    delivery: 'Delivery',
    total: 'Total',
    checkout: 'Checkout',
    remove: 'Remove',
    quantity: 'Quantity',
    freeDelivery: 'Free delivery',
    deliveryCost: 'Delivery cost',
  },

  // Checkout page
  checkout: {
    title: 'Checkout',
    deliveryInfo: 'Delivery information',
    paymentMethod: 'Payment method',
    cash: 'Cash on delivery',
    card: 'Credit / debit card',
    orderSummary: 'Order summary',
    placeOrder: 'Place order',
    processing: 'Processing...',
    orderSuccess: 'Order placed successfully!',
    orderSuccessMessage: 'You will receive a confirmation email shortly.',
    backToHome: 'Back to home',
    backToSavedAddresses: 'Choose a saved address',
  },

  // Validation messages
  validation: {
    required: 'This field is required',
    invalidEmail: 'Invalid email',
    passwordMin: 'Password must be at least 6 characters',
    passwordMatch: 'Passwords do not match',
    invalidPhone: 'Invalid phone number',
    invalidName: 'Name must be at least 2 characters',
  },

  // Notifications
  notifications: {
    loginSuccess: 'Signed in successfully!',
    loginError: 'Incorrect email or password',
    signupSuccess: 'Account created successfully!',
    signupError: 'Error creating account',
    logoutSuccess: 'Signed out',
    profileUpdated: 'Profile updated',
    addedToCart: 'Product added to cart',
    removedFromCart: 'Product removed from cart',
    orderPlaced: 'Order placed successfully!',
    orderError: 'Error placing order',
    networkError: 'Network error. Please try again.',
    addressSaved: 'Address has been saved',
    addressDeleted: 'Address has been deleted',
    passwordResetError: 'Error sending email',
    deleteAccountError: 'Error deleting account',
    invalidPassword: 'Incorrect password',
    invalidConfirmText: 'Confirmation text is not correct',
  },

  // Common
  common: {
    loading: 'Loading...',
    error: 'An error occurred',
    retry: 'Try again',
    close: 'Close',
    confirm: 'Confirm',
    currency: 'USD',
    back: 'Back',
  },

  // Welcome bonus points on first login
  welcomeBonus: {
    title: 'You earned {count} points!',
    description: 'You can use them on your next order for a discount.',
    goToProducts: 'Go to products',
  },

  // Admin Analytics
  analytics: {
    title: 'Analytics',
    subtitle: 'Advanced reports about your business',
    grossRevenue: 'Total Gross Revenue',
    netProfitPerOrder: 'Net Profit per Order',
    aov: 'Average Order Value (AOV)',
    salesByCategory: 'Sales Volume by Category',
    revenueGrowthRate: 'Revenue Growth Rate',
    totalDeliveryFees: 'Total Delivery Fees Collected',
    totalOrders: 'Total Orders',
    vsPreviousPeriod: 'vs. previous period',
    noData: 'No data available',
    topCustomers: 'Top loyal customers',
    frequentlyOrderedTogether: 'Frequently ordered together',
    fulfillmentDeliveryVsInLocation: 'Delivery vs. In-location',
    fulfillmentTrend: 'Fulfillment trend by week',
    delivery: 'Delivery',
    inLocation: 'In-location',
    revenue: 'Revenue',
    orders: 'orders',
    cancellationRate: 'Cancellation Rate',
    cancelledOrders: 'cancelled orders',
    peakHours: 'Peak Hours',
    dailyRevenueTrend: 'Daily Revenue Trend',
    // Points
    pointsTitle: 'Loyalty Points Analytics',
    pointsEarned: 'Points Earned',
    pointsSpent: 'Points Spent',
    redemptionRate: 'Points Redemption Rate',
    redemptions: 'Redemptions',
    uniqueEarners: 'Unique users (earning)',
    uniqueRedeemers: 'Unique users (redeeming)',
    aovWithPoints: 'AOV with points',
    aovWithoutPoints: 'AOV without points',
    totalDiscountFromPoints: 'Total Discounts from Points',
    topPointsEarners: 'Top points earners',
    pointsTrend: 'Daily points trend',
    balance: 'Balance',
    earned: 'Earned',
    spent: 'Spent',
    // Streaks
    streaksTitle: 'Streak Campaign Analytics',
    enrolled: 'Enrolled',
    completed: 'Completed',
    active: 'Active',
    avgStreak: 'Average streak',
    pointsAwarded: 'Points awarded',
    completionRate: 'Completion rate',
    // Tiers
    tiersTitle: 'Tier Analytics',
    tierName: 'Level',
    userCount: 'Users',
    tierRevenue: 'Tier revenue',
    tierAvgOrder: 'Average order',
    tierMultiplier: 'Multiplier',
    tierDistribution: 'User distribution by tier',
    tierLtv: 'Value per tier',
  },

  // Free products plugin (free products by tier)
  freeProducts: {
    adminTitle: 'Free product campaigns by tier',
    adminSubtitle:
      'Configure campaigns where certain products become free for customers at a specific tier, within a limited time period.',
    adminMenuLabel: 'Free products by tier',
    listTitle: 'Campaigns',
    listDescription:
      'Each campaign applies to a single tier. You can create multiple campaigns for different tiers or time periods.',
    listEmpty:
      'No campaigns. Create a new one to offer free products to loyal customers.',
    loading: 'Loading...',
    createButton: 'New campaign',
    editDialogTitle: 'Edit free products campaign',
    createDialogTitle: 'New free products campaign',
    dialogSubtitle:
      'Choose the target tier, time period, and the products that will be free for customers.',
    nameLabel: 'Campaign name',
    namePlaceholder: 'e.g.: Free coffee for Gold members',
    tierLabel: 'Tier',
    tierPlaceholder: 'Choose tier',
    customTextLabel: 'Message shown to customer (optional)',
    customTextPlaceholder: 'e.g.: Free product for your loyalty tier',
    startDateLabel: 'Start date',
    endDateLabel: 'End date',
    minOrderValueLabel: 'Minimum order value (USD)',
    minOrderValueHelp: '0 = no minimum. The free item only applies above this threshold.',
    productsLabel: 'Free products in campaign',
    productsHelp:
      'Check the products that will be free for users at the selected tier (max 1 unit per product per order).',
    productsEmpty: 'No products in catalog.',
    productsCount: '{count} products',
    activeBadge: 'Active',
    cancel: 'Cancel',
    save: 'Save',
    deleteTitle: 'Delete campaign?',
    deleteDescription: 'The campaign "{name}" will be permanently deleted.',
    deleteConfirm: 'Delete',
    toastLoadError: 'Could not load campaigns or auxiliary data',
    toastSaveError: 'Error saving',
    toastDeleteError: 'Error deleting',
    toastCreated: 'Campaign created',
    toastUpdated: 'Campaign updated',
    toastDeleted: 'Campaign deleted',
    validationNameRequired: 'Name is required',
    validationTierRequired: 'Please select a tier',
    validationDatesRequired: 'Start and end dates are required',
    validationDatesOrder: 'Start date must be before end date',
    validationMinOrderValue:
      'Minimum order value must be a number greater than or equal to 0',
    warnNoProducts:
      'The campaign has no products selected. You can continue, but it will have no effect until you add products.',
    // Frontend user-facing
    rankInfoNone:
      'You currently have no free products for your tier, but special campaigns may appear for you at any time.',
    rankInfoActivePrefix: 'You have active free products for your tier:',
    rankInfoMinOrder:
      'Order at least {amount} USD in your cart and get 1 unit of each product below for free.',
    rankInfoNoMinOrder:
      'Add a product from the list below to your cart and get it for free (1 unit).',
    rankInfoCta: 'Add to cart to take advantage.',
    cartGridTitle: 'Free products for your tier',
    cartDiscountLabel: 'Free products',
    cartInfoNone:
      'Sometimes you can receive free products for your loyalty tier — keep an eye out for special offers.',
  },

  // Streak V2 marketing
  streak: {
    pageTitle: 'Streak Campaigns',
    pageSubtitle: 'Complete challenges and earn bonus points',
    noCampaigns: 'No active campaigns at the moment.',
    homeCardTitle: 'Earn BONUS points',
    homeCardActive: 'Streak active — keep the streak going!',
    homeCardAvailable: 'Challenges available — sign up now!',
    homeCardLost: 'You lost a streak — see details!',
    homeCardCompleted: 'Streak completed — congratulations! 🎉',
    homeCardCta: 'View challenges',
    homeCardPoints: '+{points} possible points',
    comboCardTitle: 'Special combos',
    comboCardSubtitle: 'Coming soon...',

    /** Home card — gamified variant only (deal + urgency + CTA) */
    homeGamifiedDealUnit: 'bonus points',
    homeGamifiedUrgencyDays: '{days} days left',
    homeGamifiedUrgencyTwo: 'Last 2 days',
    homeGamifiedUrgencyLast: 'Last day — don\'t miss the bonus',
    homeGamifiedTrustAvailable: 'Exclusive to challenges — bigger bonus than a regular order.',
    homeGamifiedHeadlineAvailable: 'Best points offer',
    homeGamifiedHeadlineActive: 'Big bonus at the end of the challenge',
    homeGamifiedSubActive: 'You still need more orders — don\'t break the streak.',
    homeGamifiedHeadlineLost: 'You can start a new challenge',
    homeGamifiedHeadlineCompleted: 'You unlocked the bonus',
    homeGamifiedSubCompleted: 'Congratulations — the points are yours.',
    homeGamifiedCtaAvailable: 'Sign up and earn',
    homeGamifiedCtaActive: 'Continue the challenge',
    homeGamifiedCtaLost: 'View challenges',
    homeGamifiedCtaCompleted: 'Discover other offers',
  },
} as const;

export type TextsType = typeof texts;