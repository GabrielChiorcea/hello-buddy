# 📚 DOCUMENTAȚIE COMPLETĂ - APLICAȚIE FOOD ORDERING

## 📋 CUPRINS

1. [Prezentare Generală](#prezentare-generală)
2. [Partea de Utilizator (User)](#partea-de-utilizator-user)
3. [Partea de Admin](#partea-de-admin)
4. [Backend](#backend)
5. [Flow-uri Principale](#flow-uri-principale)
6. [API-uri](#api-uri)
7. [Sistemul de Puncte](#sistemul-de-puncte)
8. [Arhitectură Tehnică](#arhitectură-tehnică)

---

## 🎯 PREZENTARE GENERALĂ

**FoodOrder** este o aplicație web completă pentru comandă de mâncare online, construită cu:
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn-ui
- **Backend**: Node.js + Express + GraphQL + MariaDB
- **Autentificare**: JWT (access token + refresh token)
- **Arhitectură**: Separare clară între API public (GraphQL) și API admin (REST)

### Funcționalități Principale:
- ✅ Catalog de produse cu categorii
- ✅ Coș de cumpărături
- ✅ Comenzi online (livrare sau ridicare din locație)
- ✅ Sistem de puncte loialitate
- ✅ Panou de administrare complet
- ✅ Gestionare utilizatori și comenzi
- ✅ Setări configurabile

---

## 👤 PARTEA DE UTILIZATOR (USER)

### Pagini Disponibile

#### 1. **Home (/)** 
- Afișează produse recomandate
- Categorii de produse
- Căutare produse
- Acces public (fără autentificare)

#### 2. **Catalog (/catalog)**
- Listă completă de produse
- Filtrare după categorie
- Căutare produse
- Acces public

#### 3. **Detalii Produs (/product/:id)**
- Informații complete despre produs
- Preț, descriere, ingrediente
- Buton "Adaugă în coș"
- Acces public

#### 4. **Coș (/cart)**
- Vizualizare produse adăugate
- Modificare cantități
- Ștergere produse
- Calcul automat subtotal
- Acces public (dar necesită autentificare pentru checkout)

#### 5. **Checkout (/checkout)** 🔒
**Necesită autentificare**

Funcționalități:
- **Tip livrare**: 
  - Livrare la adresă (cu taxă de livrare)
  - Ridicare din locație (fără taxă de livrare)
  
- **Adrese**:
  - Selectare adresă salvată
  - Adăugare adresă nouă
  - Setare adresă implicită
  
- **Metodă de plată**:
  - Cash (numerar)
  - Card (TODO: integrare plată online)
  
- **Sistem puncte** (dacă este activat):
  - Selectare prag de puncte pentru reducere
  - Calcul automat discount
  - Afișare puncte disponibile
  
- **Rezumat comandă**:
  - Listă produse
  - Subtotal
  - Taxă livrare
  - Discount din puncte
  - Total final

#### 6. **Profil (/profile)** 🔒
**Necesită autentificare**

Funcționalități:
- Vizualizare informații personale (nume, email, telefon)
- Editare profil
- Schimbare parolă
- Ștergere cont
- **Gestionare adrese**:
  - Listă adrese salvate
  - Adăugare adresă nouă
  - Editare adresă
  - Ștergere adresă
  - Setare adresă implicită
- **Istoric comenzi**:
  - Listă toate comenzile
  - Detalii comandă (produse, status, total)
  - Anulare comandă (dacă este în status "pending")
- **Puncte loialitate** (dacă este activat):
  - Afișare sold puncte
  - Istoric tranzacții puncte
  - Puncte câștigate/folosite pe comandă

#### 7. **Autentificare (/login)** 🔓
- Login cu email și parolă
- Token-uri JWT stocate în memorie (Redux)
- Refresh token automat

#### 8. **Înregistrare (/signup)** 🔓
- Creare cont nou
- Validare email, parolă, nume, telefon
- Autentificare automată după înregistrare

---

## 🔐 PARTEA DE ADMIN

### Acces Admin Panel
- **URL**: `/admin/login`
- **Credențiale default**: 
  - Email: `admin@foodorder.com`
  - Parolă: `admin123secure`
- **Roluri**: `admin`, `moderator`, `user`
- **Autentificare**: JWT Bearer token
- **Rate Limiting**: 5 încercări login / 30 minute

### Pagini Admin

#### 1. **Dashboard (/admin)**
**Endpoint**: `GET /admin/dashboard`

Afișează:
- Statistici generale:
  - Total comenzi (astăzi, săptămâna, luna)
  - Venituri (astăzi, săptămâna, luna)
  - Total produse
  - Total utilizatori
  - Comenzi în așteptare
- Grafice și vizualizări
- Ultimele comenzi
- Produse populare

#### 2. **Produse (/admin/products)**
**Endpoints**:
- `GET /admin/products` - Listă produse (cu paginare, filtre)
- `GET /admin/products/:id` - Detalii produs
- `POST /admin/products` - Creare produs nou
- `PUT /admin/products/:id` - Actualizare produs
- `DELETE /admin/products/:id` - Ștergere produs

**Funcționalități**:
- CRUD complet produse
- Filtrare după categorie, disponibilitate, căutare
- Upload imagine produs
- Setare preț, descriere, ingrediente
- Activare/dezactivare produs

#### 3. **Categorii (/admin/categories)**
**Endpoints**:
- `GET /admin/categories` - Listă categorii
- `GET /admin/categories/:id` - Detalii categorie
- `POST /admin/categories` - Creare categorie
- `PUT /admin/categories/:id` - Actualizare categorie
- `PUT /admin/categories/order` - Reordonare categorii
- `DELETE /admin/categories/:id` - Ștergere categorie

**Funcționalități**:
- CRUD complet categorii
- Reordonare (drag & drop)
- Upload imagine/icon categorie
- Setare nume, descriere

#### 4. **Comenzi (/admin/orders)**
**Endpoints**:
- `GET /admin/orders` - Listă comenzi (cu filtre, paginare)
- `GET /admin/orders/:id` - Detalii comandă
- `GET /admin/orders/export` - Export CSV comenzi
- `PUT /admin/orders/:id/status` - Actualizare status comandă
- `PUT /admin/orders/:id` - Actualizare comandă completă

**Funcționalități**:
- Vizualizare toate comenzile
- Filtrare după status, dată, utilizator
- **Actualizare status**:
  - `pending` → `confirmed` → `preparing` → `delivering` → `delivered`
  - `cancelled` (anulare)
- **Acordare puncte**: La marcarea comenzii ca `delivered`, se acordă automat puncte utilizatorului
- Export date în CSV
- Detalii complete comandă (produse, adresă, plată, puncte)

#### 5. **Utilizatori (/admin/users)**
**Endpoints**:
- `GET /admin/users` - Listă utilizatori (cu paginare, filtre)
- `GET /admin/users/:id` - Detalii utilizator
- `PUT /admin/users/:id/role` - Schimbare rol utilizator
- `PUT /admin/users/:id/block` - Blocare/deblocare utilizator

**Funcționalități**:
- Vizualizare toți utilizatorii
- Filtrare după rol, status (blocat/activ)
- Schimbare rol: `admin`, `moderator`, `user`
- Blocare/deblocare conturi
- Vizualizare comenzi utilizator
- Vizualizare puncte utilizator

#### 6. **Puncte Loialitate (/admin/points)**
**Endpoints** (plugin):
- `GET /admin/points/rewards` - Listă praguri puncte
- `POST /admin/points/rewards` - Creare prag nou
- `PUT /admin/points/rewards/:id` - Actualizare prag
- `DELETE /admin/points/rewards/:id` - Ștergere prag

**Funcționalități**:
- Configurare praguri de reducere (ex: 10 puncte = 5 lei reducere)
- Activare/dezactivare praguri
- Setare puncte per comandă livrată
- Setare puncte per RON cheltuit
- Vizualizare statistici puncte

#### 7. **Setări (/admin/settings)**
**Endpoints**:
- `GET /admin/settings` - Listă setări
- `PUT /admin/settings` - Actualizare setări

**Setări disponibile**:
- `delivery_fee` - Taxă de livrare (RON)
- `points_per_order` - Puncte fixe per comandă livrată
- `points_per_ron` - Puncte per RON cheltuit (0 = dezactivat)
- `plugin_points_enabled` - Activare/dezactivare sistem puncte
- Alte feature flags

---

## ⚙️ BACKEND

### Arhitectură

```
backend/
├── src/
│   ├── graphql/          # API public GraphQL
│   │   ├── schema.ts     # Schema GraphQL
│   │   └── resolvers/    # Resolvers pentru queries/mutations
│   ├── admin/            # API admin REST
│   │   ├── router.ts     # Rute admin
│   │   └── controllers/  # Controllere pentru fiecare resursă
│   ├── models/           # Modele de date (Order, User, Product, etc.)
│   ├── middleware/       # Middleware (auth, rate limiting)
│   ├── plugins/          # Plugin-uri (points)
│   └── config/           # Configurații (database, etc.)
└── migrations/           # Migrări SQL
```

### Baza de Date

**MariaDB** cu următoarele tabele principale:
- `users` - Utilizatori (clienți și admini)
- `products` - Produse
- `categories` - Categorii produse
- `orders` - Comenzi
- `order_items` - Produse din comenzi
- `order_status_history` - Istoric status comenzi
- `addresses` - Adrese utilizatori
- `points_rewards` - Praguri puncte loialitate
- `points_transactions` - Istoric tranzacții puncte
- `app_settings` - Setări aplicație

### Autentificare

**JWT Token System**:
- **Access Token**: Expiră după 15 minute, stocat în memorie (Redux)
- **Refresh Token**: Expiră după 7 zile, stocat în HttpOnly cookie
- **Refresh automat**: Când access token expiră, se face refresh automat
- **Securitate**: Token-uri NU sunt stocate în localStorage (protecție XSS)

**Middleware**:
- `requireAuth` - Verifică autentificare pentru GraphQL
- `requireAdmin` - Verifică rol admin pentru REST API
- Rate limiting pentru login admin (5 încercări / 30 min)

---

## 🔄 FLOW-URI PRINCIPALE

### 1. Flow Comandă Utilizator

```
1. Utilizator navighează catalog → Adaugă produse în coș
2. Click "Coș" → Vizualizează produsele
3. Click "Finalizează comandă" → Redirect la /checkout
4. Dacă nu este autentificat → Redirect la /login
5. După login → Revine la /checkout
6. Selectează tip livrare (livrare/în locație)
7. Selectează adresă sau introduce adresă nouă
8. Selectează metodă de plată
9. (Opțional) Selectează puncte pentru reducere
10. Click "Plasează comandă"
11. Backend procesează:
    - Validează produsele (disponibilitate, preț)
    - Calculează subtotal, taxă livrare, discount puncte
    - Creează comandă cu status "pending"
    - Scade punctele folosite (dacă există)
    - Salvează în baza de date
12. Frontend primește confirmare → Afișează mesaj succes
13. Coșul este golit
14. Utilizator poate vedea comanda în "Profil" → "Comenzi"
```

### 2. Flow Acordare Puncte

```
1. Admin marchează comandă ca "delivered" în panou
2. Backend detectează schimbarea status → Hook onOrderDelivered()
3. Verifică dacă plugin-ul puncte este activat
4. Calculează puncte:
   - Puncte fixe per comandă (ex: 5 puncte)
   - + Puncte per RON (ex: 1 punct per 10 RON)
5. Actualizează:
   - orders.points_earned = puncte calculate
   - users.points_balance += puncte calculate
   - points_transactions (înregistrare tranzacție)
6. Trimite email utilizatorului cu punctele câștigate
7. Utilizator vede punctele noi în profil
```

### 3. Flow Utilizare Puncte la Checkout

```
1. Utilizator selectează prag de puncte (ex: 10 puncte = 5 lei reducere)
2. Frontend calculează discount-ul
3. La plasare comandă:
   - Backend verifică sold puncte utilizator
   - Verifică dacă pragul este valid
   - Calculează discount-ul
   - Scade punctele din sold (în tranzacție atomică)
   - Salvează în comandă: points_used, discount_from_points
4. Total final = subtotal + livrare - discount
5. Punctele sunt scăzute imediat (nu la livrare)
```

### 4. Flow Admin - Gestionare Comenzi

```
1. Admin accesează /admin/orders
2. Vezi lista comenzilor (filtrare după status, dată)
3. Click pe o comandă → Vezi detalii complete
4. Selectează nou status:
   - confirmed → Comanda este confirmată
   - preparing → Comanda este în pregătire
   - delivering → Comanda este în livrare
   - delivered → Comanda este livrată (acordă puncte automat)
   - cancelled → Comanda este anulată
5. Backend actualizează status și salvează în order_status_history
6. Dacă status = "delivered" → Se acordă puncte automat
```

---

## 🌐 API-URI

### GraphQL API (Public)

**Endpoint**: `http://localhost:4000/graphql`

#### Queries (Citire Date)

```graphql
# Produse
products: [Product!]!
product(id: ID!): Product
productsByCategory(category: String!): [Product!]!
searchProducts(query: String!): [Product!]!

# Categorii
categories: [Category!]!

# Utilizator curent (necesită autentificare)
currentUser: User

# Comenzi (necesită autentificare)
orders: [Order!]!
order(id: ID!): Order

# Adrese (necesită autentificare)
addresses: [Address!]!
address(id: ID!): Address

# Setări aplicație
appSetting(key: String!): String

# Puncte loialitate (dacă plugin activat)
pointsRewards: [PointsReward!]!
```

#### Mutations (Modificare Date)

```graphql
# Autentificare
login(input: LoginInput!): AuthPayload!
signup(input: SignupInput!): AuthPayload!
logout: Boolean!
refreshToken(refreshToken: String!): RefreshPayload!

# Profil
updateProfile(input: ProfileUpdateInput!): User!
changePassword(currentPassword: String!, newPassword: String!): Boolean!
requestPasswordReset(email: String!): Boolean!
resetPassword(token: String!, newPassword: String!): Boolean!
deleteAccount(password: String!, confirmText: String!): Boolean!

# Adrese
createAddress(input: AddressInput!): Address!
updateAddress(id: ID!, input: AddressInput!): Address!
deleteAddress(id: ID!): Boolean!
setDefaultAddress(id: ID!): Address!

# Comenzi
createOrder(input: CreateOrderInput!): Order!
cancelOrder(id: ID!): Order!
```

### REST API (Admin)

**Endpoint**: `http://localhost:4000/admin/*`

**Autentificare**: Bearer token în header `Authorization: Bearer <token>`

#### Autentificare Admin

```
POST /admin/auth/login
Body: { email, password }
Response: { user, accessToken, expiresIn }
Cookie: refreshToken (HttpOnly)

POST /admin/auth/refresh
Cookie: refreshToken
Response: { accessToken, expiresIn }

POST /admin/auth/logout
Cookie: refreshToken
Response: { success: true }
```

#### Dashboard

```
GET /admin/dashboard
Response: { stats, recentOrders, ... }

GET /admin/dashboard/stats
Response: { orders, revenue, products, users, ... }
```

#### Produse

```
GET /admin/products?page=1&limit=20&categoryId=...&isAvailable=true&search=...
Response: { products: [...], total, page, limit }

GET /admin/products/:id
Response: { product }

POST /admin/products
Body: { name, description, price, categoryId, image, ingredients, ... }
Response: { product }

PUT /admin/products/:id
Body: { name, description, price, ... }
Response: { product }

DELETE /admin/products/:id
Response: { success: true }
```

#### Categorii

```
GET /admin/categories
Response: { categories: [...] }

GET /admin/categories/:id
Response: { category }

POST /admin/categories
Body: { name, displayName, description, image, icon }
Response: { category }

PUT /admin/categories/:id
Body: { name, displayName, ... }
Response: { category }

PUT /admin/categories/order
Body: { categoryIds: [...] }
Response: { success: true }

DELETE /admin/categories/:id
Response: { success: true }
```

#### Comenzi

```
GET /admin/orders?page=1&limit=20&status=...&userId=...&startDate=...&endDate=...
Response: { orders: [...], total, page, limit }

GET /admin/orders/:id
Response: { order }

GET /admin/orders/export?format=csv&startDate=...&endDate=...
Response: CSV file download

PUT /admin/orders/:id/status
Body: { status, notes? }
Response: { order }
Note: Dacă status = "delivered", se acordă puncte automat

PUT /admin/orders/:id
Body: { subtotal, deliveryFee, total, ... }
Response: { order }
```

#### Utilizatori

```
GET /admin/users?page=1&limit=20&role=...&isBlocked=...&search=...
Response: { users: [...], total, page, limit }

GET /admin/users/:id
Response: { user, orders: [...] }

PUT /admin/users/:id/role
Body: { role: "admin" | "moderator" | "user" }
Response: { user }

PUT /admin/users/:id/block
Body: { blocked: true/false }
Response: { user }
```

#### Setări

```
GET /admin/settings
Response: { settings: [...] }

PUT /admin/settings
Body: { settings: [{ id, value }, ...] }
Response: { success: true }
```

#### Puncte Loialitate (Plugin)

```
GET /admin/points/rewards
Response: { rewards: [...] }

POST /admin/points/rewards
Body: { pointsCost, discountAmount, isActive }
Response: { reward }

PUT /admin/points/rewards/:id
Body: { pointsCost, discountAmount, isActive }
Response: { reward }

DELETE /admin/points/rewards/:id
Response: { success: true }
```

---

## 🎁 SISTEMUL DE PUNCTE

### Cum se Primește Puncte?

Punctele se acordă **automat** când o comandă este marcată ca **"delivered"** de către admin.

#### Calcul Puncte

```
Puncte totale = Puncte fixe per comandă + Puncte per RON cheltuit

Exemplu:
- Puncte per comandă: 5 puncte
- Puncte per RON: 1 punct per 10 RON
- Total comandă: 50 RON

Calcul:
Puncte = 5 + floor(50 / 10) = 5 + 5 = 10 puncte
```

#### Setări Configurabile (Admin)

1. **Puncte per comandă** (`points_per_order`):
   - Puncte fixe acordate pentru fiecare comandă livrată
   - Default: 5 puncte
   - Setare în `/admin/settings`

2. **Puncte per RON** (`points_per_ron`):
   - Puncte acordate în funcție de valoarea comenzii
   - Ex: 10 = 1 punct per 10 RON cheltuit
   - 0 = dezactivat (doar puncte fixe)
   - Setare în `/admin/settings`

3. **Praguri de reducere** (`points_rewards`):
   - Configurare în `/admin/points`
   - Ex: 10 puncte = 5 lei reducere
   - Ex: 20 puncte = 12 lei reducere
   - Admin poate crea/edita/șterge praguri

### Cum se Folosesc Puncte?

1. **La Checkout**:
   - Utilizator vede pragurile disponibile
   - Selectează câte puncte dorește să folosească
   - Se calculează automat discount-ul
   - Punctele sunt scăzute imediat din sold
   - Discount-ul se aplică la total

2. **Restricții**:
   - Nu poți folosi mai multe puncte decât ai în sold
   - Trebuie să selectezi un prag valid (configurat de admin)
   - Punctele folosite sunt scăzute imediat (nu la livrare)

### Structură Date

#### Tabel `points_rewards`
```sql
- id (UUID)
- points_cost (INT) - Câte puncte costă reducerea
- discount_amount (DECIMAL) - Câtă reducere în RON
- is_active (BOOLEAN) - Dacă pragul este activ
```

#### Tabel `points_transactions`
```sql
- id (UUID)
- user_id (UUID) - Utilizatorul
- order_id (UUID) - Comanda asociată (NULL pentru alte tranzacții)
- amount (INT) - Cantitatea (+ pentru câștigate, - pentru folosite)
- type (ENUM) - 'earned' sau 'spent'
- created_at (TIMESTAMP)
```

#### Tabel `users`
```sql
- points_balance (INT) - Sold curent de puncte
```

#### Tabel `orders`
```sql
- points_earned (INT) - Puncte câștigate la livrare
- points_used (INT) - Puncte folosite la checkout
- discount_from_points (DECIMAL) - Discount aplicat
```

### Flow Complet Puncte

#### 1. Acordare Puncte (La Livrare)

```
1. Admin marchează comandă ca "delivered"
2. Backend: Order.updateStatus(id, "delivered")
3. Hook: pointsPlugin.hooks.onOrderDelivered(orderId)
4. Service: pointsPlugin.service.awardOnDelivery(orderId, order)
5. Calculează puncte:
   - Citește setările: points_per_order, points_per_ron
   - Calculează: points = points_per_order + floor(total / points_per_ron)
6. Actualizează:
   - orders.points_earned = points
   - users.points_balance += points
   - points_transactions (înregistrare 'earned')
7. Trimite email utilizatorului
```

#### 2. Utilizare Puncte (La Checkout)

```
1. Utilizator selectează prag în checkout
2. Frontend calculează discount
3. La plasare comandă:
   - GraphQL: createOrder(input: { pointsToUse: 10 })
4. Backend: Order.create(input)
5. În tranzacție:
   - pointsPlugin.service.applyAtCheckout():
     * Verifică sold puncte (FOR UPDATE)
     * Verifică prag valid
     * Calculează discount
   - pointsPlugin.service.deductPointsInTransaction():
     * Scade puncte din sold
     * Inserează tranzacție 'spent'
6. Salvează în comandă:
   - points_used = 10
   - discount_from_points = 5.00
7. Total = subtotal + livrare - discount
```

### Email Notificări

Când utilizatorul primește puncte, primește automat un email cu:
- Numărul de puncte câștigate
- Soldul total de puncte
- Detaliile comenzii

---

## 🏗️ ARHITECTURĂ TEHNICĂ

### Frontend

**Stack**:
- React 18 + TypeScript
- Vite (build tool)
- React Router (routing)
- Redux Toolkit (state management)
- Apollo Client (GraphQL)
- Tailwind CSS + shadcn-ui (styling)
- Zod (validare)

**Structură**:
```
src/
├── pages/           # Pagini principale
├── components/      # Componente reutilizabile
├── graphql/         # Client GraphQL, queries, mutations
├── store/           # Redux store și slices
├── hooks/           # Custom hooks
├── plugins/         # Plugin-uri (points)
├── admin/           # Panou admin
├── config/          # Configurații
└── types/           # Tipuri TypeScript
```

### Backend

**Stack**:
- Node.js + Express
- GraphQL (Apollo Server)
- MariaDB (MySQL)
- JWT (jsonwebtoken)
- Express Rate Limit
- UUID v4

**Structură**:
```
backend/
├── src/
│   ├── graphql/     # API public GraphQL
│   ├── admin/       # API admin REST
│   ├── models/      # Modele de date
│   ├── middleware/  # Auth, rate limiting
│   ├── plugins/     # Plugin-uri modulare
│   └── config/      # Configurații DB
└── migrations/      # Migrări SQL
```

### Plugin System

Aplicația suportă plugin-uri modulare. Exemplu: **Plugin Points**

**Structură Plugin**:
```
plugins/points/
├── service.ts       # Logică business
├── hooks.ts         # Hook-uri pentru evenimente
├── model.ts         # Acces la date
├── admin/           # Rute admin pentru plugin
├── graphql/         # Extensii schema GraphQL
└── index.ts         # Export și înregistrare
```

**Înregistrare Plugin**:
- Backend: Plugin-ul se înregistrează în `backend/src/index.ts`
- Frontend: Plugin-ul se înregistrează în `src/App.tsx`

---

## 📝 NOTIȚE IMPORTANTE

### Securitate

1. **Token-uri JWT**: Stocate în memorie (Redux), NU în localStorage
2. **Refresh Token**: Stocat în HttpOnly cookie (protecție XSS)
3. **Rate Limiting**: Implementat pentru login admin (5 încercări / 30 min)
4. **Validare Input**: Zod pentru frontend, validare backend
5. **SQL Injection**: Protecție prin prepared statements

### Performanță

1. **Cache GraphQL**: Apollo Client cache pentru queries
2. **Paginare**: Implementată pentru liste mari (produse, comenzi, utilizatori)
3. **Lazy Loading**: Componente încărcate la cerere
4. **Optimistic Updates**: Pentru o experiență mai bună

### Dezvoltare

1. **Hot Reload**: Frontend și backend suportă hot reload
2. **TypeScript**: Type safety în tot codul
3. **Linting**: ESLint configurat
4. **Migrări**: Sistem de migrări SQL pentru schema DB

---

## 🚀 DEPLOYMENT

### Frontend
- Build: `npm run build`
- Preview: `npm run preview`
- Deploy: Static hosting (Vercel, Netlify, etc.)

### Backend
- Pornire: `npm run dev` (development) sau `npm start` (production)
- Variabile mediu: `.env` (vezi `.env.example`)
- Database: MariaDB/MySQL necesar

### Variabile Mediu

**Frontend** (`.env`):
```
VITE_GRAPHQL_ENDPOINT=http://localhost:4000/graphql
```

**Backend** (`.env`):
```
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=foodorder
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
```

---

## 📞 SUPORT ȘI DOCUMENTAȚIE

- **Fișiere documentație**: `docs/`, `README.md`
- **Teste manuale**: `docs/TESTE_MANUALE.md`
- **Ghid utilizare**: `src/GHID_UTILIZARE.txt`
- **Documentație fișiere**: `src/DOCUMENTATIE_FISIERE.txt`

---

**Documentație generată pentru Cloud AI**  
**Data**: 13 februarie 2026  
**Versiune**: 1.0
