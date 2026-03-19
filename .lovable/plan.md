

# Plan: Marketing-Optimize Campaigns & Tier Bar (Gamified)

Focus pe transformarea campaniilor streak și a tier bar-ului din componente informative în componente care **împing acțiunea** — urgency, FOMO, progress visualization.

---

## 1. Streak Campaign Block — Urgency & Push

**Fișier:** `src/plugins/streak/components/StreakCampaignBlock.tsx`

- **Countdown urgency**: Sub header, dacă o campanie se termină în ≤7 zile → banner roșu pulsant „Se termină în X zile! Nu pierde Y puncte bonus"
- **Personalized CTA pentru neînscriși**: Dacă user-ul e autentificat dar nu e înscris → mesaj evidențiat „Ai ratat Z puncte luna trecută. Înscrie-te acum!"
- **Section title mai agresiv**: „Câștigă puncte BONUS" în loc de „Campanii Active"

---

## 2. Gamified Campaign Card — FOMO & Triggers

**Fișier:** `src/plugins/streak/components/styles/gamifiedCard.tsx`

- **Urgency badge prominent**: Când rămân ≤3 zile → badge roșu animat (pulse) „ULTIMA ȘANSĂ!" în loc de simplu „X zile rămase"
- **Loss aversion text**: Când user-ul e înscris dar nu a completat → „Ai deja X/Y comenzi — nu pierde progresul!" cu font bold pe ce pierde
- **Reward highlight mai vizibil**: Punctele câștigate afișate ca un card separat cu glow — „Câștigi +150 puncte" cu iconița de cadou mai mare
- **Social proof fake**: „432 participanți" badge mic sub header (număr static/random seed per campaign)

---

## 3. Campaign Join Button — Conversion Push

**Fișier:** `src/plugins/streak/components/CampaignJoinButton.tsx`

- **CTA text mai agresiv**: „Participă acum" → „Câștigă {bonusPoints} puncte — Începe acum!"
- **Enrolled state cu urgency**: „Înscris — Continuă seria!" → „Streak activ! Comandă azi pentru a nu pierde progresul"
- **Micro-animation**: Butonul de join pulsează ușor la fiecare 3 secunde pentru a atrage atenția

---

## 4. Gamified Tier Bar — Progress & Push

**Fișier:** `src/components/layout/tierStyles/gamifiedTier.tsx`

- **Next reward teaser prominent**: Secțiunea „La nivelul următor" transformată într-un card cu border glow — „Încă X XP și deblochezi: Puncte x2.0! + Produse gratuite noi"
- **Loss aversion**: Dacă progresul e >50% → text „Ești la jumătate! Nu te opri acum"
- **Milestone celebration**: La 75%+ progres → sparkle animation pe bară + text „Aproape acolo!"
- **Micro-CTA**: Link/buton „Comandă acum" sub next tier teaser care duce la catalog

---

## 5. Tier Progress Bar (wrapper) — Unauthenticated Push

**Fișier:** `src/components/layout/TierProgressBar.tsx`

- **FOMO pentru neautentificați**: Tier grid-ul existent + text „Alți clienți câștigă deja puncte bonus! Autentifică-te pentru a nu pierde"
- **Animated arrow** pe butonul de login

---

## 6. Free Products Tier Grid — Urgency

**Fișier:** `src/components/layout/tierStyles/FreeProductsTierGrid.tsx`

- **Badge „GRATIS" mai vizibil**: Fiecare produs cu un badge verde „GRATIS" în loc de text simplu
- **Urgency text**: „Disponibil doar pentru rangul tău — comandă acum!"

---

## Rezumat

| Componentă | Fișier | Ce adăugăm |
|---|---|---|
| Campaign Block | `StreakCampaignBlock.tsx` | Countdown, push CTA |
| Campaign Card | `styles/gamifiedCard.tsx` | FOMO badges, loss aversion, social proof |
| Join Button | `CampaignJoinButton.tsx` | Agresive CTA text, pulse |
| Tier Bar | `gamifiedTier.tsx` | Next reward glow, milestones, micro-CTA |
| Tier Wrapper | `TierProgressBar.tsx` | FOMO neautentificați |
| Free Products Grid | `FreeProductsTierGrid.tsx` | GRATIS badges, urgency |

Toate modificările sunt frontend-only, doar pe varianta gamified.

