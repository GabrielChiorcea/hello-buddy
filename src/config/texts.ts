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
    totalProductsInMenu: '{count} produse în meniu',
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
    forgotPasswordTitle: 'Resetează parola',
    forgotPasswordSubtitle: 'Introdu email-ul contului și îți vom trimite un link pentru resetare.',
    forgotPasswordButton: 'Trimite link de resetare',
    forgotPasswordSuccess: 'Dacă există un cont cu acest email, vei primi un link pentru resetarea parolei.',
    resetPasswordTitle: 'Parolă nouă',
    resetPasswordSubtitle: 'Introdu noua parolă pentru contul tău.',
    resetPasswordButton: 'Resetează parola',
    resetPasswordSuccess: 'Parola a fost resetată. Poți să te autentifici cu noua parolă.',
    resetPasswordInvalidToken: 'Link-ul de resetare este invalid sau a expirat. Solicită unul nou.',
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
    backToSavedAddresses: 'Alege o adresă salvată',
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

  // Cadou puncte la prima autentificare
  welcomeBonus: {
    title: 'Ai câștigat {count} puncte!',
    description: 'Le poți folosi la următoarea comandă pentru reducere.',
    goToProducts: 'Mergi la produse',
  },

  // PWA install
  pwa: {
    installButton: 'Instalează aplicația',
    installButtonIos: 'Instalează pe ecranul de start',
    iosSheetTitle: 'Cum instalezi aplicația',
    iosStep1: 'Apasă butonul Share (⎙) în bara Safari de jos.',
    iosStep2: 'Alege „Adaugă pe ecranul de start".',
    iosStep3: 'Apasă „Adaugă".',
    takeMeThere: 'Du-mă acolo',
    gotIt: 'Înțeles',
    hintMessage: 'Apasă Share jos, apoi „Adaugă pe ecranul de start".',
    androidChromeHint: 'Deschide această pagină în Chrome pentru a instala aplicația.',
  },

  // Admin Analytics
  analytics: {
    title: 'Analitice',
    subtitle: 'Rapoarte avansate despre afacerea ta',
    grossRevenue: 'Venit Brut Total',
    netProfitPerOrder: 'Profit Net per Comandă',
    aov: 'Valoarea Medie a Coșului (AOV)',
    salesByCategory: 'Volumul Vânzărilor per Categorie',
    revenueGrowthRate: 'Rata de Creștere a Veniturilor',
    totalDeliveryFees: 'Total Taxe de Livrare Colectate',
    totalOrders: 'Total Comenzi',
    vsPreviousPeriod: 'vs. perioada anterioară',
    noData: 'Nu există date',
    topCustomers: 'Top clienți fideli',
    frequentlyOrderedTogether: 'Frecvent comandate împreună',
    fulfillmentDeliveryVsInLocation: 'Livrare vs. În locație',
    fulfillmentTrend: 'Trend fulfillment pe săptămâni',
    delivery: 'Livrare',
    inLocation: 'În locație',
    revenue: 'Venituri',
    orders: 'comenzi',
    cancellationRate: 'Rată Anulări',
    cancelledOrders: 'comenzi anulate',
    peakHours: 'Ore de Vârf',
    dailyRevenueTrend: 'Trend Venituri Zilnice',
    // Points
    pointsTitle: 'Analitice Puncte Loialitate',
    pointsEarned: 'Puncte Câștigate',
    pointsSpent: 'Puncte Consumate',
    redemptionRate: 'Rată Utilizare Puncte',
    redemptions: 'Răscumpărări',
    uniqueEarners: 'Utilizatori unici (câștig)',
    uniqueRedeemers: 'Utilizatori unici (consum)',
    aovWithPoints: 'AOV cu puncte',
    aovWithoutPoints: 'AOV fără puncte',
    totalDiscountFromPoints: 'Total Reduceri din Puncte',
    topPointsEarners: 'Top câștigători puncte',
    pointsTrend: 'Trend puncte zilnic',
    balance: 'Sold',
    earned: 'Câștigate',
    spent: 'Consumate',
    // Streaks
    streaksTitle: 'Analitice Campanii Streak',
    enrolled: 'Înscriși',
    completed: 'Completate',
    active: 'Activi',
    avgStreak: 'Media streak',
    pointsAwarded: 'Puncte acordate',
    completionRate: 'Rată completare',
    // Tiers
    tiersTitle: 'Analitice Ranguri (Tiers)',
    tierName: 'Nivel',
    userCount: 'Utilizatori',
    tierRevenue: 'Venituri nivel',
    tierAvgOrder: 'Medie comandă',
    tierMultiplier: 'Multiplicator',
    tierDistribution: 'Distribuție utilizatori per nivel',
    tierLtv: 'Valoare per nivel',
  },

  // Free products plugin (produse gratis pe rank)
  freeProducts: {
    adminTitle: 'Campanii produse gratis pe rank',
    adminSubtitle:
      'Configurează campanii în care anumite produse devin gratuite pentru clienții cu un anumit nivel (tier), într-o perioadă limitată.',
    adminMenuLabel: 'Produse gratis pe rank',
    listTitle: 'Campanii',
    listDescription:
      'Fiecare campanie se aplică unui singur nivel (tier). Poți crea mai multe campanii pentru niveluri diferite sau perioade diferite.',
    listEmpty:
      'Nicio campanie. Creează una nouă pentru a oferi produse gratis clienților fideli.',
    loading: 'Se încarcă...',
    createButton: 'Campanie nouă',
    editDialogTitle: 'Editează campania de produse gratis',
    createDialogTitle: 'Campanie nouă de produse gratis',
    dialogSubtitle:
      'Alege nivelul țintă, perioada și produsele care vor fi gratuite pentru clienți.',
    nameLabel: 'Nume campanie',
    namePlaceholder: 'ex: Gratis cafea pentru Gold',
    tierLabel: 'Nivel (tier)',
    tierPlaceholder: 'Alege nivelul',
    customTextLabel: 'Mesaj afișat clientului (opțional)',
    customTextPlaceholder: 'ex: Produs gratuit pentru nivelul tău de loialitate',
    startDateLabel: 'Data start',
    endDateLabel: 'Data sfârșit',
    minOrderValueLabel: 'Valoare minimă comandă (RON)',
    minOrderValueHelp: '0 = fără prag de sumă. Gratuitatea se aplică doar peste acest prag.',
    productsLabel: 'Produse gratuite în campanie',
    productsHelp:
      'Bifează produsele care vor fi gratuite pentru utilizatorii cu nivelul selectat (maxim 1 bucată per produs per comandă).',
    productsEmpty: 'Nu există produse în catalog.',
    productsCount: '{count} produse',
    activeBadge: 'Activă',
    cancel: 'Anulare',
    save: 'Salvează',
    deleteTitle: 'Șterge campania?',
    deleteDescription: 'Campania „{name}” va fi ștearsă permanent.',
    deleteConfirm: 'Șterge',
    toastLoadError: 'Nu s-au putut încărca campaniile sau datele auxiliare',
    toastSaveError: 'Eroare la salvare',
    toastDeleteError: 'Eroare la ștergere',
    toastCreated: 'Campanie creată',
    toastUpdated: 'Campanie actualizată',
    toastDeleted: 'Campanie ștearsă',
    validationNameRequired: 'Numele este obligatoriu',
    validationTierRequired: 'Selectează un nivel (tier)',
    validationDatesRequired: 'Datele de start și sfârșit sunt obligatorii',
    validationDatesOrder: 'Data de start trebuie să fie înainte de data de sfârșit',
    validationMinOrderValue:
      'Valoarea minimă a comenzii trebuie să fie un număr mai mare sau egal cu 0',
    warnNoProducts:
      'Campania nu are niciun produs selectat. Poți continua, dar nu va avea efect până nu adaugi produse.',
    // Frontend user-facing
    rankInfoNone:
      'Momentan nu ai produse gratuite pentru acest nivel, dar pot apărea campanii speciale pentru tine în orice moment.',
    rankInfoActivePrefix: 'Ai produse gratuite active pentru nivelul tău:',
    cartInfoNone:
      'Uneori poți primi produse gratuite pentru nivelul tău de loialitate — urmărește ofertele speciale.',
  },
} as const;

export type TextsType = typeof texts;
