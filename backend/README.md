# Backend Food Ordering

Backend Node.js cu GraphQL API și panou de administrare pentru aplicația de food ordering.

## Pornire rapidă

```bash
# 1. Instalare dependențe
cd backend
npm install

# 2. Configurare variabile de mediu
cp .env.example .env
# Editează .env cu datele tale

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
