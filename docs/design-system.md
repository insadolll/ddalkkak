# DDalKKak (딸깍) v2 Design System

> 작성일: 2026-03-18
> 상태: 초안 (리뷰 필요)

---

## 1. Color Palette

### 1.1 Primary (Teal)

Palette 8 브랜드 컬러 `#078080` 중심으로 10단계 스케일.

| Token | Hex | Tailwind Class | Usage |
|-------|-----|----------------|-------|
| primary-50 | `#f0fdfb` | `bg-primary-50` | Hover tints, selected row backgrounds |
| primary-100 | `#ccfbf1` | `bg-primary-100` | Badge backgrounds, light fills |
| primary-200 | `#99f0e0` | `bg-primary-200` | Focus rings, progress bar tracks |
| primary-300 | `#5ee0ce` | `bg-primary-300` | Illustration accents |
| primary-400 | `#2cc8b5` | `bg-primary-400` | Hover states for primary buttons |
| primary-500 | `#078080` | `bg-primary-500` | **Brand primary. Buttons, links, active indicators** |
| primary-600 | `#066b6b` | `bg-primary-600` | Button hover (dark), sidebar active |
| primary-700 | `#055555` | `bg-primary-700` | Button active/pressed |
| primary-800 | `#044040` | `bg-primary-800` | Dark text on light primary surfaces |
| primary-900 | `#032b2b` | `bg-primary-900` | Rarely used; darkest teal |

### 1.2 Accent (Orange-Red)

Palette 8 액센트 `#f45d48` 중심.

| Token | Hex | Tailwind Class | Usage |
|-------|-----|----------------|-------|
| accent-50 | `#fff7f5` | `bg-accent-50` | Error field backgrounds |
| accent-100 | `#fee2db` | `bg-accent-100` | Warning/error badge backgrounds |
| accent-200 | `#fdc5b7` | `bg-accent-200` | Border for error states |
| accent-300 | `#fa9a84` | `bg-accent-300` | Illustration accents |
| accent-400 | `#f77b60` | `bg-accent-400` | Hover on accent buttons |
| accent-500 | `#f45d48` | `bg-accent-500` | **Brand accent. Destructive actions, important badges, CTAs** |
| accent-600 | `#d94432` | `bg-accent-600` | Accent button hover |
| accent-700 | `#b83424` | `bg-accent-700` | Accent button pressed |
| accent-800 | `#8e2819` | `bg-accent-800` | Dark accent text |
| accent-900 | `#6b1e13` | `bg-accent-900` | Rarely used |

### 1.3 Semantic Colors

| Semantic | Color Family | Tailwind Prefix | Hex (500) | Usage |
|----------|-------------|----------------|-----------|-------|
| Success | Emerald | `emerald-` | `#10b981` | Approved badges, success toasts, confirmed states |
| Warning | Amber | `amber-` | `#f59e0b` | Pending badges, warning toasts, attention needed |
| Error | Red | `red-` | `#ef4444` | System errors, validation errors (distinct from accent) |
| Info | Blue | `blue-` | `#3b82f6` | Informational toasts, help tips |
| Purple | Purple | `purple-` | `#8b5cf6` | Invoice badges, special status indicators |

### 1.4 Neutrals (Gray)

Tailwind 기본 `gray` 스케일 (Zinc-based) 사용. 커스텀 불필요.

| Token | Hex | Usage |
|-------|-----|-------|
| gray-50 | `#f9fafb` | Page backgrounds, subtle fills |
| gray-100 | `#f3f4f6` | TabBar background, divider fills |
| gray-200 | `#e5e7eb` | Borders, dividers |
| gray-300 | `#d1d5db` | Input borders (default), disabled text |
| gray-400 | `#9ca3af` | Placeholder text, muted icons |
| gray-500 | `#6b7280` | Secondary body text |
| gray-600 | `#4b5563` | Body text |
| gray-700 | `#374151` | Strong body text, labels |
| gray-800 | `#1f2937` | Heading text (secondary) |
| gray-900 | `#111827` | Heading text (primary), high-emphasis |

### 1.5 Surface Colors

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| surface | `#f8f5f2` | `bg-surface` | **Main page background (warm off-white)** |
| surface-card | `#ffffff` | `bg-white` | Card backgrounds |
| surface-glass | `rgba(255,255,255,0.72)` | `bg-white/[0.72]` | Glassmorphism panels |
| surface-overlay | `rgba(0,0,0,0.50)` | `bg-black/50` | Modal backdrop, mobile sidebar overlay |

---

## 2. Typography

### 2.1 Font Stack

```
Primary:   "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif
Fallback:  "Inter", sans-serif
Monospace: "JetBrains Mono", "Fira Code", ui-monospace, monospace
```

CDN:
```
https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css
```

### 2.2 Type Scale

| Token | Size | Weight | Line Height | Tailwind Classes | Usage |
|-------|------|--------|-------------|------------------|-------|
| display | 30px | 700 | 1.2 | `text-3xl font-bold tracking-tight` | Page titles |
| heading-1 | 24px | 700 | 1.25 | `text-2xl font-bold tracking-tight` | Section headings |
| heading-2 | 20px | 600 | 1.3 | `text-xl font-semibold` | Card titles |
| heading-3 | 16px | 600 | 1.4 | `text-base font-semibold` | Card subtitles |
| body-lg | 15px | 400 | 1.6 | `text-[15px]` | Large body text |
| body | 14px | 400 | 1.5 | `text-sm` | Default body text |
| body-medium | 14px | 500 | 1.5 | `text-sm font-medium` | Labels, nav items |
| caption | 13px | 400 | 1.4 | `text-[13px]` | Timestamps, helper text |
| caption-sm | 12px | 400 | 1.4 | `text-xs` | Badges, footnotes |
| micro | 11px | 500 | 1.3 | `text-[11px] font-medium` | Badge text, tiny labels |

### 2.3 Typography Contrast Principle

- **Headings**: `font-bold` / `font-semibold`, `text-gray-900`
- **Body text**: `font-normal`, `text-gray-600` / `text-gray-700`
- **Muted/secondary**: `font-normal`, `text-gray-500`
- **Captions**: `font-normal`, `text-gray-400` / `text-gray-500`

---

## 3. Spacing System

Tailwind 기본 4px base. Apple 스타일로 넉넉하게.

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| space-1 | 4px | `p-1` | Icon-to-text inline gap |
| space-2 | 8px | `p-2` | Tight component gaps |
| space-3 | 12px | `p-3` | Default icon-text gap, nav item padding |
| space-4 | 16px | `p-4` | **Standard content padding (mobile)** |
| space-5 | 20px | `p-5` | Card internal padding |
| space-6 | 24px | `p-6` | **Standard content padding (desktop)** |
| space-8 | 32px | `p-8` | Large section separators |
| space-10 | 40px | `p-10` | Page-level vertical spacing |
| space-12 | 48px | `p-12` | Empty state vertical padding |

### Spacing Rules

- **Card padding**: `p-5` (20px)
- **Page padding**: `p-4 lg:p-6`
- **Card grid gap**: `gap-4 lg:gap-6`
- **Section gap**: `space-y-6 lg:space-y-8`
- **Form field spacing**: `space-y-5`

---

## 4. Border Radius System

Apple 스타일 큰 라운딩 (16-20px).

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| radius-sm | 6px | `rounded-sm` | Small pills, inline badges |
| radius-md | 8px | `rounded-md` | Inputs, small buttons |
| radius-lg | 12px | `rounded-lg` | Standard cards, dropdowns, modals |
| radius-xl | 16px | `rounded-xl` | Feature cards, sidebar panels |
| radius-2xl | 20px | `rounded-2xl` | Hero cards, login card, main containers |
| radius-full | 9999px | `rounded-full` | Avatars, circular buttons |

### Component Radius

| Component | Radius | Class |
|-----------|--------|-------|
| Buttons (sm) | 8px | `rounded-md` |
| Buttons (md, lg) | 12px | `rounded-lg` |
| Input fields | 12px | `rounded-lg` |
| Cards (standard) | 16px | `rounded-xl` |
| Cards (hero) | 20px | `rounded-2xl` |
| Modal dialog | 16px | `rounded-xl` |
| Badge/pill | 6px | `rounded-sm` |
| Avatar | 9999px | `rounded-full` |
| Toast | 12px | `rounded-lg` |

---

## 5. Shadow System (Elevation)

5단계 elevation. Subtle Apple 스타일.

| Level | Token | CSS | Tailwind | Usage |
|-------|-------|-----|----------|-------|
| 0 | none | `none` | `shadow-none` | Flat, disabled |
| 1 | sm | `0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)` | `shadow-sm` | Cards at rest, inputs |
| 2 | md | `0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)` | `shadow-md` | Cards on hover, dropdowns |
| 3 | lg | `0 4px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)` | `shadow-lg` | Modals, popovers |
| 4 | xl | `0 8px 32px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.05)` | `shadow-xl` | Drag elements |
| glass | glass | `0 2px 16px rgba(0,0,0,0.04)` | `shadow-glass` | Glassmorphism panels |

---

## 6. Component Specifications

### 6.1 Buttons

**Variants:**

| Variant | Resting | Hover | Disabled |
|---------|---------|-------|----------|
| primary | `bg-primary-500 text-white shadow-sm` | `bg-primary-600 shadow-md` | `opacity-50` |
| secondary | `bg-white text-gray-700 border border-gray-200 shadow-sm` | `bg-gray-50 border-gray-300 shadow-md` | `opacity-50` |
| danger | `bg-accent-500 text-white shadow-sm` | `bg-accent-600 shadow-md` | `opacity-50` |
| ghost | `text-gray-600 bg-transparent` | `bg-gray-100 text-gray-900` | `opacity-50` |
| outline-primary | `bg-transparent text-primary-500 border border-primary-300` | `bg-primary-50 border-primary-400` | `opacity-50` |

**Sizes:**

| Size | Padding | Font | Height | Radius |
|------|---------|------|--------|--------|
| sm | `px-3 py-1.5` | `text-xs` | 30px | `rounded-md` |
| md | `px-4 py-2` | `text-sm` | 36px | `rounded-lg` |
| lg | `px-6 py-2.5` | `text-sm` | 40px | `rounded-lg` |
| xl | `px-8 py-3` | `text-base` | 48px | `rounded-xl` |

**Transition:** `transition-all duration-150 ease-out`

### 6.2 Cards

**Base:** `bg-white rounded-xl border border-gray-200/60 shadow-sm p-5`

**Variants:**

| Variant | Classes | Usage |
|---------|---------|-------|
| Default | `bg-white rounded-xl border border-gray-200/60 shadow-sm` | Standard |
| Elevated | `bg-white rounded-xl shadow-md border-0` | Featured |
| Glass | `bg-white/[0.72] backdrop-blur-xl rounded-xl border border-white/20 shadow-glass` | Overlay |
| Interactive | Default + hover lift | Clickable |
| Outlined | `bg-white rounded-xl border-2 border-primary-200` | Selected |
| Accent-border | Default + `border-l-4 border-l-primary-500` | Status highlight |

**Hover (Interactive):** `hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 ease-out`

**Quotation Card (설계서 8.3):**
```
┌──────────────────────────┐
│ 📄 견적서 #Q-2026-001    │
│ Rev.2 | 고객사A          │
│ ₩15,000,000             │
│ 2026-03-17              │
│  📧 메일발송   📄 PDF    │
└──────────────────────────┘
확정 카드: border-2 border-primary-400 + ★ badge
```

### 6.3 Input Fields

**Base:**
```
rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm
focus: ring-2 ring-primary-500/20 border-primary-500
hover: border-gray-400
error: border-accent-500 bg-accent-50
```

**Label:** `text-sm font-medium text-gray-700`, gap `1.5` below
**Helper:** `text-xs text-gray-500`, gap `1` below
**Error:** `text-xs text-accent-600`, gap `1` below

### 6.4 Modals

**Backdrop:** `bg-black/50` + fade-in 150ms
**Dialog:** `bg-white rounded-xl shadow-lg`
**Entry animation:** scale(0.95) + translateY(8px) → normal, 200ms ease-out

| Size | Max Width | Usage |
|------|-----------|-------|
| sm | 384px | Confirmations |
| md | 448px | Standard forms |
| lg | 512px | Detail views |
| xl | 672px | Complex forms |
| full | 90vw | PDF preview |

### 6.5 Sidebar

**Desktop:** `w-60 bg-white/[0.80] backdrop-blur-xl border-r border-gray-200/60`
**Mobile:** `bg-white` (solid), slide from left 300ms

**Nav Item:** `flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600`
**Nav Active:** `bg-primary-50 text-primary-600 font-semibold`
**Nav Hover:** `hover:bg-gray-100/80 hover:text-gray-900`

### 6.6 Tables vs Cards

**원칙: 단순 테이블 나열 금지.**

| 데이터 | UI |
|--------|-----|
| 프로젝트 목록 | Card grid (2-3 columns) |
| 견적서 목록 | Card grid |
| 거래 목록 | Grouped card (상태/날짜별) |
| 대시보드 위젯 | Card layout |
| 견적서 품목 내역 | Table OK (column 비교 필요) |
| 재무 리포트 | Table OK |
| 관리자 사용자 목록 | Table OK |

**Card Grid:** `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6`

### 6.7 Toast Notifications

**Position:** Top-right, `top-6 right-6`, stacked `gap-3`
**Base:** `min-w-[320px] max-w-[420px] bg-white rounded-lg shadow-lg p-4`

| Type | Icon (Lucide) | Left Border |
|------|--------------|-------------|
| success | `CheckCircle2` | `border-l-4 border-l-emerald-500` |
| error | `XCircle` | `border-l-4 border-l-red-500` |
| warning | `AlertTriangle` | `border-l-4 border-l-amber-500` |
| info | `Info` | `border-l-4 border-l-blue-500` |

**Entry:** slideX(100% → 0) 300ms ease-out
**Auto-dismiss:** 4s (success/info), 6s (warning/error)

### 6.8 Status Badges

**Base:** `inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium border`

| Status | Background | Text | Border |
|--------|-----------|------|--------|
| Draft / Pending | `bg-amber-50` | `text-amber-700` | `border-amber-200` |
| Active / In Progress | `bg-blue-50` | `text-blue-700` | `border-blue-200` |
| Approved / Confirmed | `bg-emerald-50` | `text-emerald-700` | `border-emerald-200` |
| Rejected / Error | `bg-red-50` | `text-red-700` | `border-red-200` |
| Cancelled | `bg-gray-100` | `text-gray-500` | `border-gray-200` |
| Invoice | `bg-purple-50` | `text-purple-700` | `border-purple-200` |
| Complete | `bg-primary-50` | `text-primary-700` | `border-primary-200` |

**Dot indicator (optional):** `<span class="w-1.5 h-1.5 rounded-full bg-{color}-500" />`

### 6.9 Empty States

```
flex flex-col items-center justify-center py-16 text-center
Illustration: unDraw SVG, max-w-[240px], mb-6
Title: text-lg font-semibold text-gray-700 mb-2
Description: text-sm text-gray-500 max-w-[320px] mb-6
CTA: Button variant="primary" size="md"
```

unDraw SVG 컬러는 `#078080`(primary) / `#f45d48`(accent)로 커스텀.

---

## 7. Animation / Transition Specs

| Token | Duration | Easing | Usage |
|-------|----------|--------|-------|
| fast | 100ms | ease-out | Color, opacity |
| normal | 150ms | ease-out | Button states, input focus |
| medium | 200ms | ease-out | Card hover, accordion |
| slow | 300ms | ease-out | Modal, sidebar slide, toast |
| gentle | 400ms | cubic-bezier(0.16,1,0.3,1) | Page transitions |

**Card Hover Lift:** `transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md`
**Drag (dnd-kit):** `opacity-80 shadow-xl scale-105 rotate-[2deg]`
**Drop target:** `ring-2 ring-primary-500/40 bg-primary-50/50`

---

## 8. Glassmorphism Rules

### 적용 대상

| Component | Glass | Notes |
|-----------|-------|-------|
| Sidebar (desktop) | Yes | `bg-white/[0.80] backdrop-blur-xl` |
| Header (desktop) | Yes | `bg-white/[0.80] backdrop-blur-xl` |
| Modal dialog | No | Solid white (가독성) |
| Floating action bar | Yes | `bg-white/[0.85] backdrop-blur-lg` |
| Toast | Optional | `bg-white/[0.92] backdrop-blur-sm` |
| Mobile sidebar | No | Solid white (성능) |

### Recipe

```css
background: rgba(255, 255, 255, 0.72);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.20);
box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
```

### Fallback

```css
@supports not (backdrop-filter: blur(20px)) {
  background: rgba(255, 255, 255, 0.95);
}
```

---

## 9. Responsive Breakpoints

Desktop-first (15명 사내 사용자, 주로 데스크톱).

| Breakpoint | Min Width | Prefix | Usage |
|------------|-----------|--------|-------|
| default | 0px | - | Mobile |
| sm | 640px | `sm:` | Large phones |
| md | 768px | `md:` | Tablets |
| lg | 1024px | `lg:` | Desktop (sidebar visible) |
| xl | 1280px | `xl:` | Large desktop (3-col grids) |

### Layout Rules

- Sidebar: `< lg` hidden, `lg+` visible
- Card grid: `grid-cols-1` → `md:grid-cols-2` → `xl:grid-cols-3`
- Page padding: `p-4 lg:p-6`
- Touch target: min 44px on mobile

---

## 10. Dark Mode

**v2 초기 미포함.** 구조만 대비.

- Surface 색상에 시맨틱 토큰 사용 (`bg-surface`, `bg-surface-card`)
- Text에 `text-gray-*` 사용 (hardcode 금지)
- Border에 opacity 기반 (`border-gray-200/60`)

---

## 11. Icons

**Lucide React (MIT).** 이모지 전면 폐지.

| Context | Size | Tailwind |
|---------|------|----------|
| Inline (body) | 16px | `w-4 h-4` |
| Nav, buttons | 18px | `w-[18px] h-[18px]` |
| Card headers | 20px | `w-5 h-5` |
| Feature icons | 24px | `w-6 h-6` |
| Large decorative | 32-48px | `w-8 h-8` ~ `w-12 h-12` |

### Emoji → Lucide 매핑

| v1 Emoji | v2 Lucide | Menu |
|----------|-----------|------|
| 🏠 | `Home` | Dashboard |
| 📅 | `CalendarDays` | Leave / Calendar |
| 📋 | `ClipboardCheck` | Approval |
| 💳 | `CreditCard` | Expense |
| 📊 | `TrendingUp` | Sales |
| 📄 | `FileText` | Quotation |
| 📥 | `Inbox` | Received Docs |
| 📝 | `BookOpen` | Meeting |
| 👥 | `Users` | Database |
| 💬 | `MessageSquare` | Suggestion |
| 👤 | `User` | Profile |
| ⚙️ | `Settings` | Admin |

---

## 12. Tailwind Config (theme.extend)

```js
theme: {
  extend: {
    colors: {
      primary: {
        50:  '#f0fdfb',
        100: '#ccfbf1',
        200: '#99f0e0',
        300: '#5ee0ce',
        400: '#2cc8b5',
        500: '#078080',
        600: '#066b6b',
        700: '#055555',
        800: '#044040',
        900: '#032b2b',
      },
      accent: {
        50:  '#fff7f5',
        100: '#fee2db',
        200: '#fdc5b7',
        300: '#fa9a84',
        400: '#f77b60',
        500: '#f45d48',
        600: '#d94432',
        700: '#b83424',
        800: '#8e2819',
        900: '#6b1e13',
      },
      surface: {
        DEFAULT: '#f8f5f2',
        card: '#ffffff',
      },
    },
    fontFamily: {
      sans: [
        '"Pretendard Variable"', 'Pretendard',
        '-apple-system', 'BlinkMacSystemFont',
        'system-ui', 'sans-serif',
      ],
      mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
    },
    borderRadius: {
      sm:      '6px',
      DEFAULT: '8px',
      md:      '8px',
      lg:      '12px',
      xl:      '16px',
      '2xl':   '20px',
      '3xl':   '24px',
      full:    '9999px',
    },
    boxShadow: {
      sm:      '0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
      DEFAULT: '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
      md:      '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
      lg:      '0 4px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
      xl:      '0 8px 32px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.05)',
      glass:   '0 2px 16px rgba(0,0,0,0.04)',
    },
    keyframes: {
      'modal-enter': {
        from: { opacity: '0', transform: 'scale(0.95) translateY(8px)' },
        to:   { opacity: '1', transform: 'scale(1) translateY(0)' },
      },
      'toast-enter': {
        from: { opacity: '0', transform: 'translateX(100%)' },
        to:   { opacity: '1', transform: 'translateX(0)' },
      },
      'toast-exit': {
        from: { opacity: '1', transform: 'translateX(0)' },
        to:   { opacity: '0', transform: 'translateX(100%)' },
      },
      'fade-in': {
        from: { opacity: '0' },
        to:   { opacity: '1' },
      },
    },
    animation: {
      'modal-enter': 'modal-enter 200ms ease-out',
      'toast-enter': 'toast-enter 300ms ease-out',
      'toast-exit':  'toast-exit 200ms ease-in',
      'fade-in':     'fade-in 150ms ease-out',
    },
  },
},
```

---

## 13. v1 → v2 주요 변경점

| 항목 | v1 | v2 |
|------|----|----|
| Body 배경 | `#f8fafc` (cool slate) | `#f8f5f2` (warm cream) |
| Font | 브라우저 기본 | Pretendard Variable |
| Primary | Tailwind teal 기본 | `#078080` 중심 커스텀 |
| Accent | Tailwind red 기본 | `#f45d48` 중심 커스텀 |
| Card radius | 8px (`rounded-lg`) | 16px (`rounded-xl`) |
| Modal radius | 8px | 16px |
| Button radius | 6px | 12px |
| Input radius | 6px | 12px |
| Sidebar 아이콘 | Emoji | Lucide React |
| Sidebar 배경 | Solid white | Glassmorphism (desktop) |
| Empty state | Emoji + text | unDraw SVG + CTA |
| Shadow | `shadow-sm` only | 5단계 elevation |
| Toast | 없음 (inline Alert) | Global toast + slide animation |
| 목록 UI | Table 위주 | Card grid + grouping |
| Hover | `hover:bg-gray-50` | Lift + shadow transition |
| Modal 애니메이션 | 없음 (instant) | Scale + translate entry |
