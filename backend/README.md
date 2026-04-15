# Backend Food Ordering

Backend Node.js cu GraphQL API și panou de administrare pentru aplicația de food ordering.

## Pornire rapidă

```bash
# 1. Instalare dependențe
cd backend
npm install

# 2. Configurare variabile de mediu
# Editează .env.development cu datele tale locale

# 3. Pornire MariaDB cu Docker
docker-compose up -d

# 4. Rulare migrări
npm run migrate

# 5. Populare date inițiale
npm run seed
npm run seed:admin

# 6. Pornire server
npm run dev
```

## Endpoint-uri

| Endpoint | Descriere |
|----------|-----------|
| `http://localhost:4000/graphql` | API GraphQL pentru frontend |
| `http://localhost:4000/admin/*` | API REST pentru admin panel |
| `http://localhost:4000/api/auth/refresh` | Reîmprospătare token |

## Credențiale Admin

- **Email:** admin@foodorder.com
- **Parolă:** admin123secure

⚠️ Schimbați parola la prima autentificare!

## Producție (cPanel / fără TypeScript pe server)

Dacă pe hosting **nu poți rula** `npm run build` (doar `npm install`):

1. **Local sau CI** (generează `dist/`):
   ```bash
   cd backend
   npm install
   npm run build
   ```
2. **Încarci pe server** folderul backend fără să fie nevoie de `src/` pentru runtime, dar ai nevoie minim de:
   - `dist/` (rezultatul build-ului)
   - `package.json` și `package-lock.json`
   - `.env.production` (completat cu valorile de producție)
   - directoare goale sau cu date: `storage/`, `uploads/` dacă le folosești, `logs/` opțional  
   Migrările SQL rămân în `migrations/` dacă le rulezi manual sau din alt mediu.
3. **Pe server (Linux)**:
   ```bash
   npm install
   node dist/index.js
   ```
   Dacă panoul **nu îți permite flag-uri** la `npm install`, **doar `npm install` e suficient** — instalează și devDependencies (mai mult spațiu pe disc), dar aplicația pornește la fel. Opțional, echivalentul lui `--production` în npm recent: `npm install --omit=dev` (dacă poți rula comanda în SSH).

   Poți reduce dependențele fără flag creând **pe server** un fișier `.npmrc` lângă `package.json` cu o singură linie: `omit=dev`, apoi rulezi `npm install`.

   Nu copia `node_modules` de pe alt sistem de operare — module native (`bcrypt`, `sharp`) se instalează corect doar pe mașina țintă.

Comanda de pornire în cPanel „Node.js App” trebuie să indice spre `dist/index.js` (ex. `node dist/index.js`), cu `NODE_ENV=production` și variabilele din `.env.production`.

## Structura

```
backend/
├── src/
│   ├── graphql/      # API public GraphQL
│   ├── admin/        # API admin REST
│   ├── models/       # Modele date
│   ├── middleware/   # Auth, rate limiting
│   └── scripts/      # Migrări, seed
└── migrations/       # Fișiere SQL
```
