
# Plan de Testare Completă - FoodOrder Application

## Obiectiv
Testare end-to-end a tuturor funcționalităților aplicației, incluzând:
- Flow-uri de utilizator (buyer)
- Flow-uri de administrare (admin)
- Securitate și validări
- Date dummy pentru testare

---

## Partea 1: Pregătire Date Dummy

### 1.1 Script de Seed Actualizat
Creez un script complet de seed care populează baza de date cu date realiste:

```text
Categorii (cu iconițe):
├── 🍕 Pizza (6 produse)
├── 🍔 Burgeri (4 produse)
├── 🍝 Paste (4 produse)
├── 🥗 Salate (3 produse)
├── 🍰 Deserturi (4 produse)
└── 🥤 Băuturi (5 produse)

Utilizatori test:
├── admin@foodorder.com (admin) - parola: admin123secure
├── moderator@test.com (moderator) - parola: test123456
├── client1@test.com (user) - parola: test123456
├── client2@test.com (user) - parola: test123456
└── blocked@test.com (user, blocat) - parola: test123456

Comenzi test:
├── 5 comenzi pentru client1 (diferite statusuri)
├── 3 comenzi pentru client2
└── Istoric status pentru fiecare comandă
```

### 1.2 Fișiere de Creat/Modificat
- `backend/src/scripts/seed-complete.ts` - Script complet de populare

---

## Partea 2: Teste Frontend (Vitest + Testing Library)

### 2.1 Teste Componente UI

#### Teste ProductCard
```text
✓ Afișează corect numele, prețul și descrierea
✓ Afișează categoria produsului
✓ Butonul "Adaugă în coș" funcționează
✓ Navigare la pagina produsului la click
```

#### Teste Cart
```text
✓ Afișează produsele din coș
✓ Permite modificarea cantității
✓ Calculează corect subtotal, livrare, total
✓ Livrare gratuită peste 75 RON
✓ Buton checkout activ doar când coșul nu e gol
```

#### Teste Checkout
```text
✓ Validare adresă (min 5 caractere)
✓ Validare telefon (format corect)
✓ Validare oraș (min 2 caractere)
✓ Selecție metodă plată
✓ Afișare adrese salvate
✓ Redirect la coș dacă coșul e gol
```

#### Teste Profile
```text
✓ Afișare date utilizator
✓ Editare profil cu validări
✓ Istoric comenzi cu formatare date
✓ Management adrese de livrare
```

### 2.2 Teste Validare și Securitate

#### Teste Input Validation
```text
✓ Email format valid
✓ Parolă minim 6 caractere
✓ Telefon format valid
✓ Sanitizare input (XSS prevention)
✓ Lungime maximă câmpuri
```

### 2.3 Fișiere de Creat
- `src/test/components/ProductCard.test.tsx`
- `src/test/components/Cart.test.tsx`
- `src/test/components/Checkout.test.tsx`
- `src/test/validation/inputValidation.test.ts`
- `src/test/store/cartSlice.test.ts`

---

## Partea 3: Teste Backend (Manual + Automatizate)

### 3.1 Teste API GraphQL

#### Autentificare
```text
POST /graphql - Login
├── ✓ Login cu credențiale valide → returnează accessToken + setează cookie
├── ✓ Login cu email greșit → eroare "Email sau parolă incorectă"
├── ✓ Login cu parolă greșită → eroare
├── ✓ Login utilizator blocat → eroare "Contul este blocat"
└── ✓ Rate limiting (10 încercări/15 min)

POST /graphql - Signup
├── ✓ Înregistrare cu date valide
├── ✓ Email duplicat → eroare
├── ✓ Telefon duplicat → eroare
├── ✓ Parolă slabă → eroare validare
└── ✓ Sanitizare input

POST /graphql - Logout
└── ✓ Revocă token-urile și șterge cookie-ul
```

#### Produse (Public)
```text
GET /graphql - products
├── ✓ Listează toate produsele disponibile
├── ✓ Include ingrediente și alergeni
└── ✓ Include categoria corectă

GET /graphql - product(id)
├── ✓ Returnează produsul cu toate detaliile
└── ✓ ID invalid → null

GET /graphql - productsByCategory(category)
├── ✓ Filtrare case-insensitive
└── ✓ Categorie inexistentă → array gol

GET /graphql - searchProducts(query)
├── ✓ Căutare în nume și descriere
└── ✓ Query gol → toate produsele
```

#### Comenzi (Autentificat)
```text
POST /graphql - createOrder
├── ✓ Creează comandă cu toate detaliile
├── ✓ Calculează corect subtotal/total
├── ✓ Validare coș gol → eroare
├── ✓ Validare adresă invalidă → eroare
├── ✓ Rate limiting (10 comenzi/oră)
└── ✓ Fără autentificare → 401

GET /graphql - orders
├── ✓ Returnează doar comenzile utilizatorului curent
└── ✓ Include items cu productName și priceAtOrder

POST /graphql - cancelOrder
├── ✓ Anulare comandă pending/confirmed
├── ✓ Comandă în preparare → eroare
└── ✓ Comandă alt utilizator → eroare
```

### 3.2 Teste API Admin REST

#### Autentificare Admin
```text
POST /admin/auth/login
├── ✓ Login admin valid → accessToken + cookie
├── ✓ Login user non-admin → 403 "Acces interzis"
├── ✓ Credențiale invalide → 401
└── ✓ Rate limiting (5 încercări/30 min)

POST /admin/auth/refresh
├── ✓ Token rotation funcționează
├── ✓ Token expirat → 401
└── ✓ Admin revocat → 403
```

#### Dashboard
```text
GET /admin/dashboard
├── ✓ Returnează stats.today, stats.thisWeek, stats.thisMonth
├── ✓ Returnează salesChart (ultimele 7 zile)
├── ✓ Returnează ordersByStatus
└── ✓ Returnează recentOrders
```

#### Categorii Admin
```text
GET /admin/categories
├── ✓ Listează toate categoriile
└── ✓ Include iconița corectă

POST /admin/categories
├── ✓ Creează categorie cu iconiță
├── ✓ Nume duplicat → eroare
└── ✓ Fără autentificare → 401

PUT /admin/categories/:id
├── ✓ Actualizează numele și iconița
└── ✓ Iconița se salvează corect

DELETE /admin/categories/:id
└── ✓ Categorie cu produse → eroare (restrict)
```

#### Produse Admin
```text
GET /admin/products
├── ✓ Listează produsele cu categoria (display name)
└── ✓ Paginare funcționează

POST /admin/products
├── ✓ Creează produs cu imagine (salvată ca fișier)
├── ✓ Creează produs cu ingrediente și alergeni
├── ✓ Categorie obligatorie
└── ✓ Imaginea salvată în /storage/products/

PUT /admin/products/:id
├── ✓ Actualizare date produs
└── ✓ Schimbare imagine → șterge vechea imagine

DELETE /admin/products/:id
└── ✓ Produs cu comenzi → soft delete sau eroare
```

#### Utilizatori Admin
```text
GET /admin/users
├── ✓ Listează utilizatorii cu roluri
├── ✓ Include ordersCount și totalSpent
└── ✓ Paginare și căutare

PUT /admin/users/:id/role
├── ✓ Schimbare rol funcționează
├── ✓ Auto-revocare admin propriu → eroare
└── ✓ Payload roles: ['admin'] format corect

PUT /admin/users/:id/block
├── ✓ Blocare/deblocare utilizator
└── ✓ Auto-blocare → eroare
```

#### Comenzi Admin
```text
GET /admin/orders
├── ✓ Listează comenzile cu filtre (status, date)
├── ✓ Include informații client
└── ✓ Summary cu totalOrders, totalRevenue

PUT /admin/orders/:id/status
├── ✓ Actualizare status
├── ✓ Adaugă în order_status_history
└── ✓ Status invalid → eroare
```

### 3.3 Teste Securitate

```text
Autentificare & Autorizare
├── ✓ Access token expirat → 401
├── ✓ Refresh token în HttpOnly cookie (nu în body)
├── ✓ Token rotation la fiecare refresh
├── ✓ Reutilizare token revocat → invalidează toate sesiunile
├── ✓ Verificare rol din baza de date (nu din token)
└── ✓ Utilizator blocat nu poate accesa API

Rate Limiting
├── ✓ Login: 10 încercări/15 min
├── ✓ Admin login: 5 încercări/30 min
├── ✓ Comenzi: 10/oră per utilizator
└── ✓ Refresh: 20/5 min

Validare Input
├── ✓ SQL Injection prevention (prepared statements)
├── ✓ XSS prevention (sanitizare < >)
├── ✓ Lungime maximă câmpuri
└── ✓ Format telefon și email valid

Security Headers
├── ✓ HttpOnly cookies
├── ✓ Secure cookies (în producție)
└── ✓ SameSite cookie policy
```

---

## Partea 4: Implementare

### Fișiere de Creat

1. **`backend/src/scripts/seed-complete.ts`**
   - Script complet de populare cu categorii, produse, utilizatori, comenzi
   - Include iconițe pentru categorii
   - Creează utilizatori cu diferite roluri
   - Creează comenzi cu diferite statusuri

2. **`src/test/components/ProductCard.test.tsx`**
   - Teste pentru afișarea produselor
   - Teste pentru interacțiuni

3. **`src/test/components/Checkout.test.tsx`**
   - Teste validare formular
   - Teste flow checkout

4. **`src/test/store/cartSlice.test.ts`**
   - Teste pentru reduceri cart
   - Teste calcul totale

5. **`src/test/validation/inputValidation.test.ts`**
   - Teste scheme Zod
   - Teste sanitizare input

6. **`src/test/api/auth.test.ts`** (template pentru teste manuale)
   - Documentație teste API

### Fișiere de Modificat

1. **`backend/src/scripts/seed.ts`**
   - Adăugare iconițe la categorii

2. **`backend/src/graphql/resolvers/order.ts`**
   - Eliminare import ReviewModel (fișier șters)

---

## Partea 5: Ordine de Execuție

```text
Pas 1: Pregătire
├── Creare script seed-complete.ts
├── Rulare migrare fresh (001_schema.sql)
└── Rulare seed-complete

Pas 2: Teste Backend (Manual)
├── Test login/signup GraphQL
├── Test comenzi GraphQL
├── Test admin login REST
├── Test admin dashboard
├── Test admin categorii (cu iconițe)
├── Test admin produse (cu imagini)
└── Test admin utilizatori (roluri)

Pas 3: Teste Frontend (Vitest)
├── npm run test (toate testele)
├── Verificare rezultate
└── Fix eventuale erori

Pas 4: Teste End-to-End (Manual)
├── Flow complet buyer
│   ├── Înregistrare cont nou
│   ├── Navigare catalog
│   ├── Filtrare pe categorii
│   ├── Adăugare produse în coș
│   ├── Checkout cu adresă nouă
│   ├── Verificare comandă în profil
│   └── Anulare comandă
├── Flow complet admin
│   ├── Login admin
│   ├── Verificare dashboard (statistici)
│   ├── Creare categorie cu iconiță
│   ├── Creare produs cu imagine
│   ├── Vizualizare comenzi
│   ├── Schimbare status comandă
│   └── Gestiune utilizatori
└── Teste securitate
    ├── Încercare acces admin fără autentificare
    ├── Încercare acces date alt utilizator
    └── Verificare rate limiting
```

---

## Detalii Tehnice

### Dependențe Existente
Proiectul are deja configurate:
- `vitest` - test runner
- `@testing-library/react` - testare componente
- `@testing-library/jest-dom` - matchers DOM

### Comenzi de Rulare
```bash
# Backend
cd backend
npm run migrate      # Rulează migrarea
npm run seed         # Date inițiale
npm run seed:admin   # Cont admin

# Frontend teste
npm run test         # Rulează Vitest
npm run test:watch   # Watch mode
```

### Fix-uri Necesare Înainte de Testare

1. **Eliminare import Review din order.ts**
   - Fișierul `Review.ts` a fost șters dar importul rămâne

2. **Actualizare seed.ts**
   - Adăugare câmp `icon` pentru categorii
   - Eliminare câmp `rating` pentru produse
