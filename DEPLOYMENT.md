# Deploy în producție (frontend + backend)

Ghid pentru publicarea aplicației pe hosting tip **cPanel** (LiteSpeed/Apache), cu **domeniu pentru site** și **subdomeniu pentru API** (ex.: `https://gabriel.weburl.ro` + `https://back.gabriel.weburl.ro`).

---

## Arhitectură tipică

| Rol | URL exemplu | Ce se încarcă |
|-----|----------------|----------------|
| **Frontend** (Vite + React) | `https://gabriel.weburl.ro` | Conținutul folderului `dist/` după `npm run build` |
| **Backend** (Node + Express + GraphQL) | `https://back.gabriel.weburl.ro` | Aplicația Node care rulează `dist/index.js`, plus `backend/.env.production` pe server |

Variabilele `VITE_*` se **îngheață la build** în bundle-ul JS. Schimbarea lor pe server **fără rebuild** nu are efect la frontend.

---

## Punct critic: GraphQL trebuie să fie `.../graphql/` (cu slash final)

Pe multe servere (LiteSpeed/Apache), URL-ul **`/graphql`** (fără slash) răspunde cu **redirect 301** către **`/graphql/`**.

Browserul trimite mai întâi **OPTIONS** (preflight CORS) pentru GraphQL. **La preflight, redirect-ul nu este urmat**, apare eroarea de tip *„Redirect is not allowed for a preflight request”* sau mesaje CORS înșelătoare.

**Ce trebuie făcut:**

1. În **`.env.production`** (la rădăcina proiectului frontend), setează:
   - `VITE_GRAPHQL_ENDPOINT=https://back.TAU-DOMENIU.ro/graphql/`  
   - **Obligatoriu slash-ul final** după `graphql`.

2. În cod există și o siguranță în `src/config/runtimeApi.ts`: dacă path-ul este exact `/graphql`, este normalizat la `/graphql/`. Totuși, env-ul corect + rebuild evită surprize.

3. După deploy, în **DevTools → Network**, verifică că request-urile GraphQL merg la **`POST .../graphql/`** (cu slash), nu la `.../graphql`.

---

## Frontend (Vite + React)

### 0. Strategie simplă: doar 2 fișiere env

Pentru frontend păstrează doar:

- **`.env.development`** — folosit de `npm run dev`
- **`.env.production`** — folosit de `npm run build`

Fișierele active sunt direct:

- `.env.development`
- `.env.production`

### 1. Variabile de mediu (înainte de build)

Fișier pentru build: **`.env.production`** în rădăcina repo-ului (lângă `package.json`), **nu** în `backend/`.

Exemplu (înlocuiește domeniile cu ale tale):

```env
VITE_GRAPHQL_ENDPOINT=https://back.exemplu.ro/graphql/
VITE_API_BASE_URL=https://back.exemplu.ro
```

- `VITE_GRAPHQL_ENDPOINT` — URL-ul complet al endpoint-ului Apollo (cu **`https://`** și **slash final** la `/graphql/`).
- `VITE_API_BASE_URL` — baza pentru REST (refresh sesiune, upload-uri etc.), **fără** slash la final (în cod se normalizează).

Opțional: `VITE_APP_LOGO_URL` dacă îl folosești.

`/.env.development` este pentru `npm run dev`, iar `/.env.production` pentru `npm run build`.

### 2. Build local sau în CI

```bash
cd /calea/catre/proiect
npm install
# dezvoltare (citește .env.development)
npm run dev
# build producție (citește .env.production)
npm run build
# sau explicit mod production:
npm run build:production
```

Rezultatul este folderul **`dist/`** (HTML, JS, CSS, asset-uri).

### 3. Ce încarci pe hosting (frontend)

- Tot conținutul din **`dist/`** în document root-ul domeniului public (ex. `public_html` pentru `gabriel.weburl.ro`), sau în subfolderul configurat pentru acel domeniu.

Nu este nevoie de Node pentru servirea statică a frontend-ului dacă hosting-ul servește fișierele direct; Vite produce deja asset-uri cu hash în nume (cache busting).

### 4. Verificări după deploy

- Site-ul se încarcă pe HTTPS.
- În Network: apeluri către API pe subdomeniul backend, **GraphQL cu `/graphql/`**.
- Dacă folosești cookie-uri de sesiune pe domenii diferite (site vs API), confirmă pe backend că `FRONTEND_URL` și setările de cookie (domain, `SameSite`, `Secure`) sunt aliniate cu producția.

---

## Backend (Node + Express + GraphQL)

### 1. Variabile pe server

În backend folosim strict două fișiere:

- `backend/.env.development` (local)
- `backend/.env.production` (server/cPanel)

Pe server completezi `backend/.env.production`:

- `NODE_ENV=production`
- `PORT` — portul pe care îl ascultă procesul (trebuie să coincidă cu ce configurezi în cPanel / reverse proxy).
- **MySQL/MariaDB:** `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (credențiale din cPanel).
- **JWT:** `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (valori lungi, random, diferite între ele).
- **CORS:** `FRONTEND_URL`, `ADMIN_URL` — URL-urile site-ului (ex. `https://gabriel.weburl.ro`), **fără path la final** (doar originea). Opțional `CORS_EXTRA_ORIGINS` pentru `www` sau alte origini.
- **Redis** (dacă folosești rate limiting cu Redis): `REDIS_URL`.
- **Stripe** și altele din exemplu, dacă aplică.

Codul normalizează originea CORS; evită slash-uri în plus la `FRONTEND_URL`.

### 2. Build backend local sau în CI (recomandat: nu compila TypeScript pe server)

```bash
cd backend
npm install
npm run build
```

Rezultat: folderul **`backend/dist/`**.

### 3. Ce încarci pe server (backend)

Minim necesar pentru runtime:

- `dist/` (output-ul build-ului)
- `package.json` și `package-lock.json`
- `.env.production` (completat pe server)
- `migrations/` dacă rulezi migrările manual de pe server sau din alt mediu
- Directoare folosite de app: ex. `uploads/`, `storage/`, `logs/` după cum cere aplicația

**Nu copia `node_modules` de pe Windows/Mac pe Linux** — modulele native (`bcrypt`, `sharp` etc.) trebuie instalate pe server.

### 4. Instalare dependențe pe server

În SSH, în folderul backend:

```bash
npm install
```

Dacă vrei să omizi devDependencies (dacă mediul permite):

```bash
npm install --omit=dev
```

Sau un fișier **`.npmrc`** lângă `package.json` cu linia `omit=dev`, apoi `npm install`.

### 5. Pornire în cPanel / Node.js App

- **Comandă de start:** ex. `node dist/index.js`
- **Variabile de mediu:** `NODE_ENV=production` + restul din `.env.production` (sau setate în panou).

Backend-ul este configurat cu **`trust proxy`** pentru a lucra corect în spatele LiteSpeed/Apache (inclusiv pentru rate limiting și `X-Forwarded-For`).

### 6. Migrări bază de date

Rulează migrările SQL (ex. din `migrations/`) pe baza de date de producție **înainte** sau imediat după primul deploy, conform scripturilor din `backend/package.json` (ex. `npm run migrate` dacă există și ai acces SSH).

---

## Checklist rapid

- [ ] Frontend: `.env.production` cu `VITE_GRAPHQL_ENDPOINT=.../graphql/` (**slash final**)
- [ ] Frontend: `npm run build` → încărcat **`dist/`** pe domeniul public
- [ ] Backend: `backend/.env.production` completat (DB, JWT, CORS, Redis)
- [ ] Backend: build local → `dist/` + `package.json` → `npm install` pe server → `node dist/index.js`
- [ ] Migrări DB rulate pe producție
- [ ] Network: verificat `POST .../graphql/` și absența erorilor de redirect la OPTIONS

---

## Probleme frecvente

| Simptom | Cauză probabilă |
|--------|------------------|
| CORS / „Redirect is not allowed for a preflight request” | URL GraphQL fără **`/`** final → 301 la preflight. Folosește **`/graphql/`** și rebuild frontend. |
| `401` pe `/api/auth/refresh` | Utilizator nelogat sau cookie de refresh lipsă / expirat; se separă de problema CORS de mai sus. |
| Rate limit / erori legate de IP | Backend folosește `trust proxy`; asigură-te că aplicația Node e în spatele proxy-ului corect configurat. |

---

## Fișiere de referință în repo

| Fișier | Rol |
|--------|-----|
| `.env.development` | Variabile Vite pentru dezvoltare locală |
| `.env.production` | Variabile Vite pentru build producție |
| `backend/.env.development` | Variabile backend local |
| `backend/.env.production` | Variabile backend producție |
| `src/config/runtimeApi.ts` | Rezolvare URL-uri API + normalizare `/graphql/` |
| `backend/README.md` | Detalii suplimentare despre backend și migrări |
