

# Plan: Marketing & Conversion Optimization

Transformarea proiectului dintr-un produs de dev într-un produs optimizat de marketer, cu urgency, psychology triggers și vizualizare clară a recompenselor.

---

## Zona 1: URGENCY & FOMO în Coș

**Fișiere:** `src/pages/cartStyles/gamifiedCart.tsx`, `src/pages/cartStyles/shared.tsx`

- **Progress bar animat „Livrare gratuită"**: Bară vizuală colorată care arată cât mai lipsește până la pragul de 75 RON (ex: „Mai adaugă 19 RON pentru livrare GRATUITĂ!"). Când e deblocat → confetti visual + text verde „Livrare gratuită deblocată!"
- **Progress bar „Produs gratuit"**: Similiar, bară vizuală pentru pragul de 50 RON. Text „Mai adaugă X RON și primești [Fanta] GRATIS!" cu imagine mică a produsului gratuit
- **Countdown timer vizual**: „Coșul tău expiră în 15:00" — timer fake care creează urgență (doar UI, nu blochează nimic)
- **Mesaj abandon**: Când user-ul dă pe „Continuă cumpărăturile" → toast cu „Ai X RON în coș, nu pierde reducerile!"

**Date noi în `shared.tsx`:**
- `freeDeliveryProgress: { threshold, current, remaining, unlocked }`
- `cartExpiryMinutes: number` (constant, doar UI)

---

## Zona 2: CHECKOUT — Evidențierea recompenselor

**Fișiere:** `src/pages/checkoutStyles/shared.tsx` (OrderSummaryContent)

- **Reward activ vizibil**: Dacă user-ul are puncte aplicate → card highlight cu iconița de puncte, suma economisită și câte puncte rămân
- **Produse gratuite evidențiate**: Item-urile gratuite din sumar afișate cu badge verde „GRATIS" + preț tăiat (~~8 RON~~) și „-8 RON"
- **Savings summary**: Sub total → banner verde „Economisești X RON la această comandă!" (puncte + produse gratuite + livrare gratuită)
- **Progres tier**: Mini-bar cu „Această comandă îți aduce +Y XP → mai ai Z XP până la [nivel următor]"
- **Urgency CTA**: Butonul de submit schimbat din „Plasează comanda" → „Finalizează acum — economisești X RON"

---

## Zona 3: PSYCHOLOGY TRIGGERS pe ProductCard

**Fișiere:** `src/components/common/productCardStyles/gamifiedCard.tsx`

- **Badge „Popular"** pe produsele recomandate (când `product.isRecommended === true`)
- **Badge „Ultimele bucăți"** random/configurat pentru urgency
- **Preț tăiat vizual** când produsul e gratuit: ~~8 RON~~ → GRATIS

---

## Zona 4: Home Page — Push & Urgency

**Fișiere:** `src/pages/homeStyles/gamifiedHome.tsx`

- **Hero personalizat**: Dacă user-ul e autentificat → „Bine ai revenit, [Nume]! Ai [X] puncte de folosit" în loc de textul generic
- **Banner „Ofertă limitată"** sub hero: „Produse GRATIS pentru nivelul tău — doar astăzi!" (dacă are campanii active)
- **CTA final personalizat**: Dacă coșul nu e gol → „Ai [X] produse în coș. Finalizează comanda!" cu buton direct spre checkout

---

## Zona 5: Checkout Success — Reinforce & Upsell

**Fișiere:** `src/pages/CheckoutSuccess.tsx`

- **Puncte câștigate prominent**: Card mare animat „Ai câștigat +X puncte!" cu progres vizual spre următorul reward
- **Next reward teaser**: „Încă Y puncte și poți folosi o reducere de Z RON!"
- **CTA „Comandă din nou"** mai prominent, cu mesaj „Comandă din nou și câștigi alte X puncte"

---

## Zona 6: Navbar Cart Badge — Micro-urgency

**Fișiere:** `src/components/layout/navbarStyles/shared.tsx`

- **Pulse animation** pe badge-ul de coș când are items (atenție vizuală constantă)
- **Tooltip rapid** la hover: „X produse · Y RON — finalizează acum"

---

## Rezumat tehnic

| Zonă | Fișiere principale | Complexitate |
|------|-------------------|-------------|
| Coș urgency bars | `cartStyles/gamifiedCart.tsx`, `shared.tsx` | Medie |
| Checkout rewards | `checkoutStyles/shared.tsx` | Medie |
| ProductCard badges | `gamifiedCard.tsx` | Mică |
| Home personalizat | `gamifiedHome.tsx` | Mică |
| Success upsell | `CheckoutSuccess.tsx` | Mică |
| Navbar pulse | `navbarStyles/shared.tsx` | Mică |

Toate modificările sunt doar frontend (UI/UX). Nu necesită migrări sau schimbări backend. Datele necesare (puncte, tier, campanii gratuite) sunt deja disponibile în store/user state.

