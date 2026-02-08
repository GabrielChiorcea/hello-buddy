# Teste manuale – Plan complet (Level 10/10)

**Pregătire:** `cd backend && npm run seed:complete && npm run dev` | `npm run dev` (frontend)

**Conturi:** admin@foodorder.com / admin123secure | client1@test.com / test123456 | client2@test.com / test123456 | blocked@test.com / test123456 | moderator@test.com / test123456

---

# PARTEA 1: ADMIN PANEL (/admin)

## 1.1 Autentificare Admin

### Happy path
- [ ] Login admin@foodorder.com + parolă corectă → intră în panou, vezi dashboard
- [ ] Login moderator@test.com → intră (moderator are acces)
- [ ] Logout → redirect la /admin login, cookie șters

### Negative / erori
- [ ] Login fără email → eroare "Email și parolă obligatorii"
- [ ] Login fără parolă → eroare
- [ ] Login email valid + parolă greșită → 401 "Email sau parolă incorectă"
- [ ] Login client1@test.com (user normal) → 403 "Acces interzis - cont admin necesar"
- [ ] Login blocked@test.com → 403 (cont blocat nu poate accesa admin)
- [ ] Login cu email inexistent → 401

### Rate limiting & security
- [ ] 5+ încercări login eșuate → 429 "Prea multe încercări... 30 minute" (admin: 5/30min)
- [ ] După logout, request GET /admin/dashboard fără token → 401
- [ ] Request cu Bearer token expirat → 401, probabil redirect login

### Refresh token
- [ ] După ~15 min inactivitate, refresh automat → sesiunea continuă
- [ ] Refresh fără cookie → 401 "Sesiune expirată"
- [ ] Blochează admin din panou users → refresh ulterior → 403 "Contul este blocat"

---

## 1.2 Dashboard

- [ ] GET /dashboard autentificat → 200, date dashboard
- [ ] Statistici afișate: comenzi, venituri, produse, etc.
- [ ] GET /dashboard/stats → 200, obiect cu stats
- [ ] Fără auth → 401

---

## 1.3 Produse (Admin CRUD)

### Listare
- [ ] GET /products → listă cu paginare (page, limit)
- [ ] Filtru ?categoryId=... → doar produse din categorie
- [ ] Filtru ?isAvailable=true → doar disponibile
- [ ] Filtru ?isAvailable=false → doar indisponibile
- [ ] Filtru ?search=pizza → produse care conțin "pizza"
- [ ] Sortare ?sortBy=name&sortOrder=ASC
- [ ] Sortare ?sortBy=price&sortOrder=DESC
- [ ] Paginare ?page=2&limit=10

### Detalii
- [ ] GET /products/:id valid → 200, obiect produs
- [ ] GET /products/uuid-inexistent → 404

### Creare
- [ ] POST /products cu name, price, categoryId → 201, produs creat
- [ ] Lipsă name → 400 "Nume, preț și categorie sunt obligatorii"
- [ ] Lipsă price → 400
- [ ] Lipsă categoryId → 400
- [ ] Price invalid (negativ, NaN) → verifica comportament
- [ ] Image base64 → imagine salvată ok
- [ ] Fără imagine → produs fără image

### Actualizare
- [ ] PUT /products/:id cu date valide → 200
- [ ] PUT cu isAvailable=false → produs marcat indisponibil
- [ ] PUT produs inexistent → 404
- [ ] Schimbare categorie → 200

### Ștergere
- [ ] DELETE /products/:id (fără ?hard) → soft delete, success
- [ ] DELETE /products/:id?hard=true → hard delete dacă nu are comenzi
- [ ] DELETE produs în comenzi ?hard=true → fallback soft delete, mesaj "Produs marcat ca indisponibil"

### Upload rate limit
- [ ] 50+ POST/PUT produse în 10 min → 429 (dacă e configurat upload limiter)

---

## 1.4 Categorii

### Listare
- [ ] GET /categories → doar active
- [ ] GET /categories?includeInactive=true → toate

### CRUD
- [ ] GET /categories/:id → 200
- [ ] POST /categories cu name, displayName → 201
- [ ] Lipsă name sau displayName → 400
- [ ] name duplicat → 400 "O categorie cu acest nume există deja"
- [ ] PUT /categories/:id → update reușit
- [ ] PUT categories/:id cu isActive=false → dezactivare
- [ ] PUT /categories/order cu body { categoryIds: [...] } → reordonare
- [ ] categoryIds nu e array → 400
- [ ] DELETE /categories/:id → 200 sau 400 dacă are produse

---

## 1.5 Comenzi

### Listare
- [ ] GET /orders → listă cu paginare
- [ ] Filtru ?status=pending
- [ ] Filtru ?status=delivered
- [ ] Filtru ?dateFrom=2025-01-01&dateTo=2025-02-01
- [ ] Răspuns conține customer (name, email) și itemsCount

### Detalii
- [ ] GET /orders/:id → 200, order + customer + statusHistory
- [ ] ID inexistent → 404

### Actualizare status
- [ ] PUT /orders/:id/status { status: "confirmed" } → 200
- [ ] Statusuri valide: pending, confirmed, preparing, delivering, delivered, cancelled
- [ ] Status invalid → 400 "Status invalid"
- [ ] body { status, notes } → notes în istoric

### Export
- [ ] GET /orders/export → CSV cu BOM, download
- [ ] Filtre ?status=...&dateFrom=...&dateTo=... aplicabile

---

## 1.6 Utilizatori

### Listare
- [ ] GET /users → listă cu paginare
- [ ] Filtru ?search=ion
- [ ] Filtru ?role=user
- [ ] Filtru ?role=admin
- [ ] Răspuns: users cu roles, ordersCount, totalSpent

### Detalii
- [ ] GET /users/:id → user + roles + stats + recentOrders
- [ ] ID inexistent → 404

### Roluri
- [ ] PUT /users/:id/role { roles: ["moderator"] } → 200
- [ ] roles invalid (ex: ["superadmin"]) → 400
- [ ] Autologat admin încearcă să-și scoată admin → 400 "Nu vă puteți elimina propriul rol de admin"
- [ ] Setare roles: ["user","moderator"] → 200

### Blocare
- [ ] PUT /users/:id/block { blocked: true } → 200
- [ ] PUT pe propriul id { blocked: true } → 400 "Nu vă puteți bloca propriul cont"
- [ ] PUT { blocked: false } → deblocare
- [ ] blocked nu e boolean → 400

---

## 1.7 Setări

- [ ] GET /settings → 200, setări curente
- [ ] PUT /settings cu perechi key-value → 200
- [ ] Verifică că setările afectează delivery fee, etc.

---

# PARTEA 2: USER (Aplicația publică)

## 2.1 Autentificare User (GraphQL)

### Login
- [ ] login(input: { email, password }) corect → AuthPayload cu user, accessToken, expiresIn
- [ ] Cookie refresh token setat HttpOnly (verifică în DevTools)
- [ ] Parolă greșită → GraphQL error "Email sau parolă incorectă"
- [ ] Email inexistent → aceeași eroare (nu dezvăluie existența)
- [ ] blocked@test.com → eroare (cont blocat)
- [ ] Body gol / lipsă câmpuri → eroare validare

### Signup
- [ ] signup cu email nou, parolă validă (min 8 chr, literă mare, mică, cifră) → AuthPayload
- [ ] Parolă < 8 caractere → "Parola trebuie să aibă cel puțin 8 caractere"
- [ ] Parolă fără literă mare → eroare validare
- [ ] Parolă fără literă mică → eroare
- [ ] Parolă fără cifră → eroare
- [ ] Email existent (client1@test.com) → "Acest email este deja înregistrat"
- [ ] Telefon duplicat (dacă există validare) → "Acest număr de telefon este deja folosit"
- [ ] Nume gol → verifica validare

### Logout
- [ ] logout() autentificat → true, cookie șters
- [ ] logout() neautentificat → true (idempotent)

### Rate limiting login
- [ ] 10+ încercări login eșuate → 429 "Prea multe încercări... 15 minute"

---

## 2.2 Profil

### currentUser
- [ ] Cu Authorization: Bearer <token> → User cu id, email, name, phone, createdAt
- [ ] Fără token sau token invalid → null

### updateProfile
- [ ] updateProfile(input: { name: "Nou" }) → User actualizat
- [ ] updateProfile(input: { phone: "0722123456" }) → ok
- [ ] updateProfile(input: {}) → eroare sau păstrare date (verifica schema)
- [ ] Fără auth → eroare

### changePassword
- [ ] changePassword(currentPassword corect, newPassword validă) → true
- [ ] După schimbare → cookie șters, trebuie login din nou
- [ ] currentPassword greșită → "Parola curentă este incorectă"
- [ ] newPassword slabă → eroare validare
- [ ] Fără auth → eroare

### requestPasswordReset
- [ ] requestPasswordReset(email: "orice@test.com") → true (mereu, nu dezvăluie dacă există)
- [ ] Verifică că nu diferențiază email existent vs inexistent

### resetPassword
- [ ] resetPassword(token, newPassword) → eroare "Funcționalitate în dezvoltare" (dacă e cazul)

### deleteAccount
- [ ] deleteAccount(password corectă, confirmText: "ȘTERGE CONTUL") → true
- [ ] confirmText greșit → "Textul de confirmare este incorect"
- [ ] Parolă greșită → "Parola este incorectă"
- [ ] După ștergere → neautentificat, nu mai poate accesa resurse

---

## 2.3 Adrese

### Izolare per user
- [ ] User A nu vede adresele user B (query address(id) cu ID al altui user → null)
- [ ] User A nu poate updateAddress(id user B) → "Adresa nu a fost găsită"

### CRUD
- [ ] createAddress(input: label, address, city, phone) → Address creat
- [ ] createAddress cu notes, isDefault → ok
- [ ] updateAddress(id, input) → Address actualizat
- [ ] deleteAddress(id) → true
- [ ] setDefaultAddress(id) → Address cu isDefault: true
- [ ] address(id) inexistent sau al altui user → null

### Validări
- [ ] Lipsă câmpuri obligatorii → eroare GraphQL

---

## 2.4 Catalog (read-only)

### Queries
- [ ] products → toate produsele (sau disponibile)
- [ ] product(id: "...") → un produs
- [ ] productsByCategory(category: "pizza") → produse din categorie
- [ ] searchProducts(query: "burger") → produse care conțin "burger"
- [ ] searchProducts cu caractere speciale (%, _) → sanitizat, fără eroare
- [ ] product(id inexistent) → null

### Conținut
- [ ] Produs conține: name, description, price, image, category, ingredients, isAvailable, preparationTime
- [ ] Ingrediente cu isAllergen afișat corect
- [ ] categorii → listă categorii cu displayName, icon

---

## 2.5 Comenzi User

### Listare
- [ ] orders → doar comenzile utilizatorului curent
- [ ] order(id) propriu → Order
- [ ] order(id) al altui user → null
- [ ] Fără auth → eroare

### Creare
- [ ] createOrder cu items valide, deliveryAddress (min 5 chr), deliveryCity, phone (min 9), paymentMethod → Order
- [ ] items gol → "Comanda trebuie să conțină cel puțin un produs"
- [ ] items > 50 produse → "Comanda nu poate conține mai mult de 50 de produse"
- [ ] quantity < 1 sau > 100 → "Cantitatea trebuie să fie între 1 și 100"
- [ ] deliveryAddress < 5 caractere → "Adresa de livrare este invalidă"
- [ ] phone < 9 caractere → "Numărul de telefon este invalid"
- [ ] productId inexistent → verifica comportament
- [ ] paymentMethod: "cash" sau "card" → ok

### Rate limiting
- [ ] 10+ comenzi în 1 oră → "Ați atins limita de comenzi. Încercați din nou mai târziu."

### Anulare
- [ ] cancelOrder(id) pentru pending/confirmed → Order cu status cancelled
- [ ] cancelOrder pentru delivered → eroare (dacă validat)
- [ ] cancelOrder(id) al altui user → null sau eroare

---

## 2.6 Coș & Checkout (UI)

- [ ] Adaugă produs în coș → cantitate +1
- [ ] Adaugă același produs din nou → cantitate +1
- [ ] Modifică cantitate manual
- [ ] Șterge din coș
- [ ] Coș gol → buton checkout dezactivat sau mesaj
- [ ] Checkout cu adresă, telefon, plată completate → plasare comandă
- [ ] Checkout fără adresă / telefon → validare UI
- [ ] După plasare → coș gol, redirect sau mesaj succes

---

## 2.7 Sesiune & Token

- [ ] Access token expirat → refresh automat în background (fără logout)
- [ ] Refresh token expirat → logout, redirect login
- [ ] Request cu token revocat (după logout pe alt device) → 401
- [ ] Tab multiple → sesiunea shared corect (același refresh cookie)

---

# PARTEA 3: SECURITATE & EDGE CASES

## 3.1 Authorization
- [ ] Bearer token user normal pe /admin/products → 401 sau 403
- [ ] Bearer token admin pe GraphQL currentUser → comportament (admin vs user tokens diferite)
- [ ] Token manipulat / semnătură invalidă → 401

## 3.2 Input & Sanitizare
- [ ] searchProducts / search cu SQL injection-like ("%", "_", "\") → sanitizat
- [ ] Adrese cu caractere speciale, emoji → salvare ok
- [ ] Nume produs/categorie foarte lung → truncare sau eroare

## 3.3 Căi invalide
- [ ] POST /admin/products fără auth → 401
- [ ] GET /graphql cu query malformat → eroare GraphQL
- [ ] ID UUID invalid format → 404 sau eroare

## 3.4 Cookie
- [ ] HttpOnly pe refresh token → nu vizibil în JS
- [ ] SameSite (Lax/Strict) configurat
- [ ] Secure în HTTPS (dacă production)

---

# PARTEA 4: REGRESIE RAPIDĂ (Smoke)

- [ ] Admin: login → dashboard → products → adaugă → editează → logout
- [ ] User: login → catalog → coș → checkout → profil → comenzi → logout
- [ ] Signup → login → updateProfile → changePassword → logout → login cu parola nouă
