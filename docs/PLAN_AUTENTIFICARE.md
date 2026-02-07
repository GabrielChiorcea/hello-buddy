# Plan de execuție – Îmbunătățiri autentificare (User & Admin)

> **Status**: Implementat (feb 2025) – Faze 1 și 2 completate.

## 1. Rezumat analiză

### Ce funcționează bine
- **Refresh token HttpOnly** – OWASP compliant, protecție XSS
- **Token rotation** – la fiecare refresh, vechiul token e revocat
- **Cookie-uri separate** – User (`/`) vs Admin (`/admin`) – izolare corectă
- **Verificare rol admin** – din DB, nu din token
- **Security logging** – evenimente autentificare logate
- **Rate limiting admin** – 5 încercări / 30 min (adminAuthLimiter)
- **User blocked** – `verifyCredentials` exclude `is_blocked = TRUE`
- **Validare Login user** – Zod schema, sanitizare input

---

## 2. Probleme identificate și îmbunătățiri propuse

### 2.1 SECURITATE

| # | Problemă | Severitate | Descriere |
|---|----------|------------|-----------|
| 1 | **Login User fără rate limiting specific** | Mediu | `login` merge prin GraphQL (`/graphql`), nu prin `/api/auth/`. Folosește doar `apiLimiter` (100 req/15 min). Admin are 5/30 min. |
| 2 | **Credențiale demo în UI** | Mediu | Login user și Admin afișează parole în clar (`test123`, `admin123secure`). Riscuri în producție. |
| 3 | **Admin refresh nu verifică `isBlocked`** | Mediu | Admin blocat poate încă obține access token prin refresh până la expirarea refresh token-ului. |
| 4 | **Apollo errorLink – cod mort** | Scăzut | `localStorage.removeItem('authToken')` – token-ul e în Redux, nu în localStorage. |

### 2.2 UX / CONSISTENȚĂ

| # | Problemă | Severitate | Descriere |
|---|----------|------------|-----------|
| 5 | **Admin Login fără validare** | Scăzut | User Login folosește Zod; Admin Login nu validează email/parolă înainte de submit. |
| 6 | **Mesaje eroare inconsistente** | Scăzut | User: toast; Admin: Alert inline. Comportament diferit. |
| 7 | **Lipsă „Remember me”** | Scăzut | Nu există opțiune pentru sesiune persistentă vs. session-only. |
| 8 | **Lipsă „Ai uitat parola?”** | Scăzut | `texts.auth.forgotPassword` există, dar nu e folosit în UI. |

### 2.3 FIABILITATE

| # | Problemă | Severitate | Descriere |
|---|----------|------------|-----------|
| 9 | **Admin redirect după login** | Scăzut | `adminLogin` e fire-and-forget; redirect-ul depinde de `isAuthenticated` în `useEffect`. Dacă thunk-ul se finalizează înainte de re-render, poate exista race condition. |
| 10 | **Lipsă `disabled` pe inputs Admin** | Scăzut | La Login user, inputs sunt `disabled={isLoading}`; la Admin nu. |

---

## 3. Plan de execuție (prioritizat)

### Faza 1 – Securitate (prioritate ridicată)

| Ordine | Task | Estimare | Detalii |
|--------|------|----------|---------|
| 1.1 | **Rate limiting pentru login GraphQL** | 1–2 h | Middleware Express care verifică `operationName`/body pentru mutația `login` și aplică un limiter strict (ex. 10/15 min per IP+email) pe `/graphql`, sau mutație login într-un endpoint REST cu `authLimiter`. |
| 1.2 | **Verificare `isBlocked` în admin refresh** | 30 min | În `admin auth refreshToken`: după `findById`, return 403 dacă `user.isBlocked`. |
| 1.3 | **Credențiale demo condiționate** | 30 min | Afișare credențiale demo doar când `import.meta.env.DEV` sau `VITE_SHOW_DEMO_CREDENTIALS=true`. |
| 1.4 | **Curățare Apollo errorLink** | 15 min | Eliminare `localStorage.removeItem`; folosire doar Redux pentru logout și redirect. |

### Faza 2 – Consistență UX (prioritate medie)

| Ordine | Task | Estimare | Detalii |
|--------|------|----------|---------|
| 2.1 | **Validare Admin Login** | 45 min | Zod schema pentru email/parolă, erori per câmp ca la User Login. |
| 2.2 | **Inputs disabled la Admin** | 15 min | Adăugare `disabled={isLoading}` pe câmpurile Admin Login. |
| 2.3 | **Unificare feedback erori** | 30 min | Aliniere: toast vs. Alert inline; alegere abordare comună pentru ambele formulare. |
| 2.4 | **Link „Ai uitat parola?”** | N/A | Doar placeholder UI (fără backend) sau plan pentru flux de reset parolă. |

### Faza 3 – Opțional (lower priority)

| Ordine | Task | Estimare | Detalii |
|--------|------|----------|---------|
| 3.1 | **Remember me** | 2–3 h | Cookie cu `maxAge` mai mare când e bifat; implică schimbări în cookie options. |
| 3.2 | **Refactor Admin redirect** | 30 min | `adminLogin` să returneze promise; redirect în `handleSubmit` după `unwrap()`, nu în `useEffect`. |
| 3.3 | **Mesaj specific pentru cont blocat** | Discutat | `verifyCredentials` poate returna cod special pentru blocat; risc de informație despre existența contului. |

---

## 4. Ordine recomandată de implementare

```
1.1 → 1.2 → 1.3 → 1.4     (Faza 1 – Securitate)
2.1 → 2.2 → 2.3           (Faza 2 – UX)
3.x                        (După prioritate)
```

---

## 5. Fișiere de modificat (referință)

| Task | Backend | Frontend |
|------|---------|----------|
| 1.1 | `index.ts`, `rateLimiter.ts`, eventual middleware GraphQL | - |
| 1.2 | `admin/controllers/auth.ts` | - |
| 1.3 | - | `Login.tsx`, `AdminLogin.tsx` |
| 1.4 | - | `graphql/client.ts` |
| 2.1 | - | `AdminLogin.tsx` |
| 2.2 | - | `AdminLogin.tsx` |
| 2.3 | - | `Login.tsx`, `AdminLogin.tsx` |

---

## 6. Note

- **GraphQL rate limiting**: Alternativă la middleware custom – mutația `login` poate fi mutată pe un endpoint REST (ex. `POST /api/auth/login`) protejat de `authLimiter`, păstrând GraphQL doar pentru operațiuni autentificate.
- **Credențiale demo**: În producție, cel mai bine să nu apară deloc.
- **Cont blocat**: Mesaj explicit „Cont blocat” poate divulga existența contului; abordarea actuală („Email sau parolă incorectă”) e mai sigură.
