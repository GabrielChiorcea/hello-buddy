# 🎨 Ghid de Tematizare (Theming Guide)

Acest proiect folosește **tokens semantici CSS** — toate culorile sunt definite într-un singur loc.
Pentru a re-branda aplicația, trebuie să modifici **un singur fișier**: `src/index.css`.

---

## Metoda 1 — Schimbare rapidă cu preseturi (30 secunde)

### Deschide `src/config/themes/index.ts`

Schimbă o singură linie:

```ts
// Teme disponibile: 'orange' | 'blue' | 'green' | 'purple'
export const DEFAULT_THEME: ThemeName = 'blue';  // ← schimbă aici
```

Gata! Toată aplicația se re-colorează automat.

---

## Metoda 2 — Personalizare avansată

### 1. Editează un fișier de temă (ex: `src/config/themes/orange.ts`)

Sau creează unul nou copiind un preset existent.

### 2. Schimbă culorile principale

Toate valorile sunt în format **HSL** (`hue saturation% lightness%`).

| Token | Rol | Valoare implicită |
|-------|-----|-------------------|
| `--primary` | Culoarea principală (butoane, linkuri) | `16 90% 50%` (portocaliu) |
| `--primary-foreground` | Text pe fundal primary | `0 0% 100%` (alb) |
| `--accent` | Accent subtil (hover, fundal selectat) | `16 80% 95%` |
| `--background` | Fundal general | `30 25% 98%` |
| `--foreground` | Text principal | `20 14.3% 4.1%` |

**Exemplu — de la portocaliu la albastru:**
```css
/* Înainte (portocaliu) */
--primary: 16 90% 50%;

/* După (albastru) */
--primary: 220 90% 50%;
```

### 3. Culorile de gamification (streak, puncte)

Componentele de streak și puncte au o temă separată:

| Token | Rol | Valoare implicită |
|-------|-----|-------------------|
| `--reward` | Culoarea principală gamification | `43 96% 56%` (auriu) |
| `--reward-light` | Varianta mai deschisă | `48 97% 63%` |
| `--reward-accent` | Accent cald | `25 95% 53%` |
| `--reward-surface` | Fundal card-uri gamification | `220 15% 10%` (întuneric) |
| `--reward-surface-foreground` | Text pe card-urile dark | `40 30% 95%` |
| `--reward-foreground` | Text PE butoane reward | `0 0% 0%` (negru) |

**Exemplu — de la auriu la violet:**
```css
--reward: 270 80% 60%;
--reward-light: 280 85% 70%;
--reward-accent: 260 75% 50%;
```

### 4. Culorile de status (admin dashboard)

| Token | Rol | Valoare implicită |
|-------|-----|-------------------|
| `--status-pending` | În așteptare | `45 93% 47%` (galben) |
| `--status-confirmed` | Confirmate | `217 91% 60%` (albastru) |
| `--status-preparing` | În preparare | `25 95% 53%` (portocaliu) |
| `--status-delivering` | În livrare | `271 91% 65%` (violet) |
| `--status-delivered` | Livrate | `142 76% 36%` (verde) |

### 5. Alte culori semantice

| Token | Rol |
|-------|-----|
| `--success` | Succes / confirmare (verde) |
| `--warning` | Avertisment (galben) |
| `--destructive` | Eroare / ștergere (roșu) |
| `--muted` | Fundaluri subtile |
| `--border` | Borduri |

---

## ⚠️ Notă: Confetti

Fișierul `src/plugins/streak/components/CampaignCard.tsx` conține culori HEX
pentru efectul de confetti (linia ~93). Acestea trebuie actualizate manual dacă
schimbi `--reward`:

```ts
const gold = ['#f59e0b', '#fbbf24', '#d97706', '#fcd34d', '#ffffff'];
```

---

## Fișiere relevante

| Fișier | Ce conține |
|--------|-----------|
| `src/config/themes/index.ts` | **Selectorul de temă** — schimbă `DEFAULT_THEME` |
| `src/config/themes/orange.ts` | Preset portocaliu (default) |
| `src/config/themes/blue.ts` | Preset albastru |
| `src/config/themes/green.ts` | Preset verde |
| `src/config/themes/purple.ts` | Preset violet |
| `src/index.css` | Valorile fallback + animații |
| `tailwind.config.ts` | Maparea tokens → clase Tailwind (nu trebuie modificat) |
| `src/config/texts.ts` | Toate textele UI — pentru traducere/rebranding |

---

## Cum funcționează

```
index.css (--primary: 220 90% 50%)
    ↓
tailwind.config.ts (primary: "hsl(var(--primary))")
    ↓
Componente (className="bg-primary text-primary-foreground")
    ↓
Browser: bg-primary → hsl(220 90% 50%)
```

Schimbi **o linie** în `index.css` → **toate componentele** se actualizează automat.
