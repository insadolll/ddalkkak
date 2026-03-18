# 딸깍(DDalKKak) v2 — 디자인 시스템

> 작성일: 2026-03-18
> 상태: 확정 (v1 Palette 8 + Glassmorphism 계승, Apple 스타일 강화)

---

## 1. 컬러 팔레트

### 1.1 기본 컬러 (Palette 8 계승 + 미세 조정)

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--color-primary` | `#078080` | 주요 액션, 링크, 활성 상태 |
| `--color-primary-light` | `#0D9488` | hover, 서브 강조 |
| `--color-primary-dark` | `#065F5F` | 눌림 상태, 진한 강조 |
| `--color-accent` | `#F45D48` | CTA, 알림, 중요 뱃지 |
| `--color-accent-light` | `#F97316` | hover 시 accent |
| `--color-surface` | `#F8F5F2` | 페이지 배경 |
| `--color-card` | `rgba(255,255,255,0.80)` | 카드 배경 (Glass) |
| `--color-card-solid` | `#FFFFFF` | 불투명 카드 (테이블 등) |

### 1.2 텍스트 컬러

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--color-text-primary` | `#0F172A` | 제목, 주요 텍스트 (slate-900) |
| `--color-text-secondary` | `#475569` | 부제목, 설명 (slate-600) |
| `--color-text-muted` | `#64748B` | 힌트, 비활성 (slate-500) |
| `--color-text-inverse` | `#FFFFFF` | 어두운 배경 위 텍스트 |

### 1.3 상태 컬러

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--color-success` | `#22C55E` | 완료, 확정, 수익 |
| `--color-warning` | `#F59E0B` | 주의, 대기, 검토중 |
| `--color-error` | `#EF4444` | 오류, 거절, 손실 |
| `--color-info` | `#3B82F6` | 정보, 안내 |

### 1.4 프로젝트 단계 컬러

| 단계 | 컬러 | Tailwind |
|------|-------|----------|
| 수립 | `#3B82F6` (blue) | `bg-blue-500` |
| 견적 진행 | `#F59E0B` (amber) | `bg-amber-500` |
| 수주 확정 | `#078080` (teal) | `bg-primary` |
| 납품 진행 | `#8B5CF6` (violet) | `bg-violet-500` |
| 계산서 처리 | `#F45D48` (accent) | `bg-accent` |
| 완료 | `#22C55E` (green) | `bg-green-500` |

---

## 2. 타이포그래피

### 2.1 폰트 패밀리

```
주 폰트: Pretendard (한글 + 영문, 무료, Apple SD Gothic 대체)
보조 폰트: Inter (영문 숫자 강조용, Google Fonts)
코드/숫자: Fira Code (금액, 견적번호 등)
```

**Tailwind 설정:**
```js
fontFamily: {
  sans: ['Pretendard', 'Inter', 'system-ui', 'sans-serif'],
  mono: ['Fira Code', 'monospace'],
}
```

### 2.2 타입 스케일

| 레벨 | 크기 | 굵기 | 행간 | 용도 |
|------|------|------|------|------|
| Display | 36px (2.25rem) | 700 | 1.2 | 대시보드 숫자, 히어로 |
| H1 | 28px (1.75rem) | 700 | 1.3 | 페이지 제목 |
| H2 | 22px (1.375rem) | 600 | 1.35 | 섹션 제목 |
| H3 | 18px (1.125rem) | 600 | 1.4 | 카드 제목, 서브섹션 |
| Body | 15px (0.9375rem) | 400 | 1.6 | 본문 |
| Small | 13px (0.8125rem) | 400 | 1.5 | 캡션, 메타 정보 |
| Tiny | 11px (0.6875rem) | 500 | 1.4 | 뱃지, 태그 내부 |

### 2.3 금액 표시

```
폰트: Fira Code (mono)
포맷: ₩15,000,000 (천단위 콤마)
정렬: 우측 정렬
색상: 매출 = primary, 매입 = text-primary, 수익 = success, 손실 = error
```

---

## 3. 간격 & 레이아웃

### 3.1 간격 체계

| 토큰 | 값 | 용도 |
|------|-----|------|
| `xs` | 4px | 아이콘-텍스트 간격 |
| `sm` | 8px | 인라인 요소 간격 |
| `md` | 16px | 카드 내부 패딩 |
| `lg` | 24px | 섹션 간 간격 |
| `xl` | 32px | 카드 간 간격 |
| `2xl` | 48px | 페이지 섹션 간 |

### 3.2 레이아웃

```
사이드바: 260px (고정, 접힘 시 72px)
헤더: 64px (고정)
콘텐츠 최대폭: max-w-7xl (1280px)
콘텐츠 패딩: px-6 py-6
카드 그리드:
  - 3열 (1024px+)
  - 2열 (768px~1023px)
  - 1열 (~767px)
카드 간격: gap-5 (20px)
```

### 3.3 라운딩

| 요소 | 값 | Tailwind |
|------|-----|----------|
| 카드 | 16px | `rounded-2xl` |
| 버튼 | 12px | `rounded-xl` |
| 입력 필드 | 10px | `rounded-[10px]` |
| 뱃지/태그 | 9999px | `rounded-full` |
| 모달 | 20px | `rounded-[20px]` |
| 아바타 | 50% | `rounded-full` |

---

## 4. Glassmorphism 효과

### 4.1 Glass 카드 (기본)

```css
background: rgba(255, 255, 255, 0.80);
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.30);
box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
```

**Tailwind:**
```
bg-white/80 backdrop-blur-xl border border-white/30 shadow-sm
```

### 4.2 Glass 레벨

| 레벨 | 배경 | 블러 | 용도 |
|------|------|------|------|
| L1 (연한) | `bg-white/60` | `blur(12px)` | 사이드바, 오버레이 |
| L2 (표준) | `bg-white/80` | `blur(16px)` | 카드, 패널 |
| L3 (진한) | `bg-white/90` | `blur(20px)` | 모달, 드롭다운 |

### 4.3 Glass 사용 시 주의

- Light mode에서 텍스트 대비 4.5:1 이상 유지
- 이미지/패턴 배경 위에서 Glass가 가장 효과적
- `surface` (#F8F5F2) 위에선 border가 보이지 않을 수 있으므로 `border-gray-200/50` 대체

---

## 5. 컴포넌트 스타일 가이드

### 5.1 버튼

#### Primary

```
bg-primary text-white rounded-xl px-5 py-2.5 font-medium
hover: bg-primary-light shadow-md
active: bg-primary-dark scale-[0.98]
disabled: opacity-50 cursor-not-allowed
transition: all 200ms ease-out
```

#### Secondary (Ghost)

```
bg-white/60 text-primary border border-primary/20 rounded-xl px-5 py-2.5
hover: bg-primary/5 border-primary/40
active: bg-primary/10
```

#### Accent (CTA)

```
bg-accent text-white rounded-xl px-5 py-2.5 font-semibold
hover: bg-accent-light shadow-lg shadow-accent/25
active: scale-[0.98]
```

#### Icon Button

```
w-9 h-9 rounded-xl flex items-center justify-center
hover: bg-gray-100
아이콘 크기: w-[18px] h-[18px]
cursor-pointer 필수
aria-label 필수
```

#### 버튼 크기

| 크기 | 패딩 | 폰트 | 높이 |
|------|------|------|------|
| sm | `px-3 py-1.5` | 13px | 32px |
| md | `px-5 py-2.5` | 15px | 40px |
| lg | `px-7 py-3` | 16px | 48px |

### 5.2 카드

#### 기본 카드

```
bg-white/80 backdrop-blur-xl rounded-2xl p-5
border border-white/30 shadow-sm
hover: shadow-md translate-y-[-2px]
transition: all 300ms ease-out
cursor-pointer (클릭 가능한 경우)
```

#### 견적서 미니 카드

```
bg-white/80 backdrop-blur-xl rounded-2xl p-4
border border-white/30 shadow-sm
hover: shadow-lg translate-y-[-3px] border-primary/30
확정 카드: border-2 border-primary bg-primary/5
```

구조:
```
┌─────────────────────────────┐
│ [아이콘] 견적번호   [뱃지]  │  ← H3, 뱃지(Rev.N)
│ 거래처명                     │  ← text-secondary
│                              │
│ ₩15,000,000                 │  ← font-mono, Display
│ 2026-03-17                  │  ← text-muted, Small
│                              │
│ [메일발송] [PDF] [더보기]   │  ← 아이콘 버튼 그룹
└─────────────────────────────┘
```

#### 통계 카드

```
bg-white/80 backdrop-blur-xl rounded-2xl p-5
border border-white/30 shadow-sm

구조:
┌─────────────────────────────┐
│ [아이콘]  라벨               │  ← Small, text-muted
│                              │
│ ₩45,230,000                 │  ← Display, font-mono
│ ▲ 12.5% vs 전월             │  ← Small, success/error
└─────────────────────────────┘
```

### 5.3 뱃지 / 태그

```
rounded-full px-2.5 py-0.5 text-[11px] font-medium
inline-flex items-center gap-1
```

| 타입 | 스타일 |
|------|--------|
| 상태 (기본) | `bg-{색상}/10 text-{색상}-700` |
| 확정 | `bg-primary/10 text-primary font-semibold` |
| 위험 | `bg-error/10 text-error-700` |
| 정보 | `bg-info/10 text-info-700` |
| 회사 | `bg-violet-100 text-violet-700` (HUBIOCEM) / `bg-blue-100 text-blue-700` (BTMS) |

### 5.4 입력 필드

```
w-full bg-white/60 border border-gray-200 rounded-[10px]
px-4 py-2.5 text-[15px]
placeholder: text-gray-400
focus: border-primary ring-2 ring-primary/20 outline-none
disabled: bg-gray-100 text-gray-400 cursor-not-allowed
transition: border-color 200ms, box-shadow 200ms
```

#### 라벨

```
block text-[13px] font-medium text-text-secondary mb-1.5
필수 표시: <span class="text-error ml-0.5">*</span>
```

#### 에러 상태

```
border-error ring-2 ring-error/20
에러 메시지: text-[12px] text-error mt-1 flex items-center gap-1
```

### 5.5 테이블

v2에서는 테이블 최소화, 카드/리스트 우선. 불가피한 경우:

```
bg-white/90 backdrop-blur-xl rounded-2xl overflow-hidden
border border-white/30 shadow-sm
```

| 부분 | 스타일 |
|------|--------|
| 헤더 | `bg-gray-50/80 text-[12px] font-semibold text-text-muted uppercase tracking-wider px-4 py-3` |
| 셀 | `px-4 py-3.5 text-[14px] border-b border-gray-100` |
| hover 행 | `hover:bg-primary/[0.03]` |
| 금액 셀 | `text-right font-mono` |
| 모바일 | `overflow-x-auto` 래퍼 또는 카드 레이아웃 전환 |

### 5.6 모달

```
배경: bg-black/40 backdrop-blur-sm (오버레이)
모달: bg-white/95 backdrop-blur-2xl rounded-[20px] shadow-2xl
최대폭: max-w-lg (기본), max-w-2xl (넓은)
패딩: p-6
애니메이션: scale(0.95) opacity-0 → scale(1) opacity-1 (200ms ease-out)
```

### 5.7 토스트 / 알림

```
bg-white/90 backdrop-blur-xl rounded-xl shadow-lg
border-l-4 border-{상태색상}
px-4 py-3 flex items-center gap-3
위치: top-right, 아래로 쌓임
진입: slide-in-right (300ms)
퇴장: fade-out (200ms)
자동 닫힘: 5초
```

### 5.8 사이드바

```
bg-white/60 backdrop-blur-2xl border-r border-white/30
w-[260px] 고정, 접힘 시 w-[72px]
```

| 요소 | 스타일 |
|------|--------|
| 메뉴 아이템 | `px-3 py-2.5 rounded-xl text-text-secondary hover:bg-primary/5 hover:text-primary` |
| 활성 아이템 | `bg-primary/10 text-primary font-medium` |
| 아이콘 | `w-5 h-5 mr-3` (Lucide) |
| 그룹 라벨 | `text-[11px] font-semibold text-text-muted uppercase tracking-widest px-3 mt-4 mb-2` |
| 회사 전환 | `mx-3 mb-4 rounded-xl bg-surface p-2 flex items-center gap-2` |

### 5.9 드롭다운 / 셀렉트

```
bg-white/90 backdrop-blur-xl rounded-xl shadow-lg
border border-gray-200/50
py-1 min-w-[180px]
진입: scale-y(0.95) opacity-0 → scale-y(1) opacity-1 (150ms)
transform-origin: top
```

항목:
```
px-3 py-2 text-[14px] rounded-lg mx-1
hover: bg-primary/5 text-primary
선택됨: bg-primary/10 text-primary font-medium
```

### 5.10 아코디언 (접기/펼치기 섹션)

프로젝트 상세, 견적서 상세 등에서 정보를 구조화하는 핵심 패턴.

```
bg-white/80 backdrop-blur-xl rounded-2xl
border border-white/30 shadow-sm
overflow-hidden
```

#### 단일 아코디언 아이템

```
┌──────────────────────────────────────────┐
│  ▸  매입 견적서 풀 (3건)          [뱃지] │  ← 헤더 (항상 보임)
├──────────────────────────────────────────┤
│                                          │
│  [견적카드A] [견적카드B] [견적카드C]     │  ← 본문 (접힘/펼침)
│                                          │
└──────────────────────────────────────────┘
```

| 부분 | 스타일 |
|------|--------|
| 헤더 | `px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-primary/[0.03]` |
| 화살표 | `w-5 h-5 text-text-muted transition-transform 200ms` → 펼침 시 `rotate-90` |
| 제목 | `text-[15px] font-semibold text-text-primary flex items-center gap-2` |
| 건수 뱃지 | `bg-primary/10 text-primary text-[11px] rounded-full px-2 py-0.5` |
| 본문 | `px-5 pb-5` |
| 구분선 | `border-t border-gray-100` (아이템 사이) |

#### 애니메이션

```css
/* 본문 영역 */
.accordion-body {
  display: grid;
  grid-template-rows: 0fr;          /* 접힌 상태 */
  opacity: 0;
  transition: grid-template-rows 250ms ease-out, opacity 200ms ease-out;
}
.accordion-body.open {
  grid-template-rows: 1fr;          /* 펼친 상태 */
  opacity: 1;
}
.accordion-body > div {
  overflow: hidden;
}
```

> `grid-template-rows` 트릭으로 높이 애니메이션을 GPU 친화적으로 구현.
> `max-height` 방식보다 부드럽고 정확함.

#### 그룹 아코디언

프로젝트 상세에서 여러 섹션을 묶는 패턴:

```
┌──────────────────────────────────────────┐
│  ▾  기본 정보                            │  ← 펼침 (기본)
│  ─────────────────────────────────────   │
│  프로젝트명: XXXX                        │
│  고객사: YYYY         매입처: ZZZZ       │
│  기간: 2026-03 ~ 2026-06                │
├──────────────────────────────────────────┤
│  ▸  매입 견적서 풀 (3건)                 │  ← 접힘
├──────────────────────────────────────────┤
│  ▸  매출 견적서 풀 (2건)                 │  ← 접힘
├──────────────────────────────────────────┤
│  ▸  첨부 문서 (5건)                      │  ← 접힘
├──────────────────────────────────────────┤
│  ▸  계산서 / 결제 일정                   │  ← 접힘
└──────────────────────────────────────────┘
```

- 독립 개폐: 각 섹션 독립적으로 열고 닫힘 (한 번에 하나만 X)
- 기본 상태: 첫 번째 섹션만 펼침
- 전체 펼치기/접기 버튼 우상단에 배치

### 5.11 확장 카드 (Expandable Card)

카드를 클릭하면 인라인으로 상세 정보가 나타나는 패턴.
모달 없이 맥락을 유지한 채 디테일을 볼 수 있음.

#### 접힌 상태 (Summary)

```
┌────────────────────────────────────────────┐
│  [아이콘]  견적서 #Q-2026-001              │
│           Rev.2 | 매입처A | ₩15,000,000    │
│           2026-03-17        [확정 뱃지]    │
└────────────────────────────────────────────┘
```

#### 펼친 상태 (Detail)

```
┌────────────────────────────────────────────┐
│  [아이콘]  견적서 #Q-2026-001        [×]   │  ← 닫기 버튼 추가
│           Rev.2 | 매입처A | ₩15,000,000    │
│           2026-03-17        [확정 뱃지]    │
│  ───────────────────────────────────────   │
│                                            │
│  품목 목록                                 │
│  ┌──────┬────┬───────┬──────────┐         │
│  │ 품명  │ 수량 │ 단가   │ 금액     │         │
│  ├──────┼────┼───────┼──────────┤         │
│  │ 부품A │  10 │ 500K  │ 5,000K   │         │
│  │ 부품B │   5 │ 2,000K│ 10,000K  │         │
│  └──────┴────┴───────┴──────────┘         │
│                                            │
│  리비전 이력                                │
│  • Rev.0 — 최초 (03-10)                    │
│  • Rev.1 — 단가 변경 (03-14)              │
│  • Rev.2 — 품목 추가 (03-17) ← 현재      │
│                                            │
│  [메일발송] [PDF] [발주서 생성] [확정]     │
└────────────────────────────────────────────┘
```

| 상태 | 스타일 |
|------|--------|
| 접힌 카드 | `rounded-2xl p-4 cursor-pointer hover:shadow-md hover:translate-y-[-2px]` |
| 펼친 카드 | `rounded-2xl p-5 shadow-lg ring-1 ring-primary/10` |
| 전환 | `height: auto` (grid-rows 트릭), 300ms ease-out |
| 펼침 시 | hover 효과 비활성화, 배경 약간 밝게 (`bg-white/90`) |

### 5.12 탭 (Tabs)

수평 탭으로 콘텐츠 영역을 전환하는 패턴.

```
┌──────────────────────────────────────────┐
│  [ 매입 견적서 ]  [ 매출 견적서 ]  [ 첨부 ] │  ← 탭 헤더
│  ─────────────────────────────────────   │
│                                          │
│         (선택된 탭 콘텐츠)               │
│                                          │
└──────────────────────────────────────────┘
```

| 부분 | 스타일 |
|------|--------|
| 탭 바 | `flex gap-1 bg-gray-100/80 rounded-xl p-1` |
| 비활성 탭 | `px-4 py-2 rounded-lg text-[14px] text-text-muted hover:text-text-primary cursor-pointer` |
| 활성 탭 | `px-4 py-2 rounded-lg text-[14px] bg-white shadow-sm text-primary font-medium` |
| 전환 | 활성 인디케이터 슬라이드 (`transform: translateX`) 200ms |
| 콘텐츠 | 페이드 전환 (`opacity`) 150ms |

### 5.13 타임라인 (프로젝트 진행 상태)

프로젝트 단계를 시각적으로 보여주는 세로 타임라인.

```
  ● 프로젝트 수립                    2026-03-10
  │  고객사: A사, 매입처: B사
  │
  ● 매입 견적서 수령                 2026-03-12
  │  B사 견적서 Rev.1 등록
  │
  ◉ 매출 견적서 발송                 2026-03-15    ← 현재 단계
  │  1차 견적서 발송 완료
  │
  ○ 수주 확정                        —
  │
  ○ 납품/발주                        —
  │
  ○ 계산서 처리                      —
```

| 부분 | 스타일 |
|------|--------|
| 완료 노드 `●` | `w-3 h-3 rounded-full bg-primary` |
| 현재 노드 `◉` | `w-4 h-4 rounded-full bg-primary ring-4 ring-primary/20 animate-pulse` |
| 미완료 노드 `○` | `w-3 h-3 rounded-full border-2 border-gray-300 bg-white` |
| 연결선 (완료) | `w-0.5 bg-primary` |
| 연결선 (미완료) | `w-0.5 bg-gray-200` |
| 단계명 | `text-[14px] font-medium` (완료: text-primary, 미완료: text-muted) |
| 날짜 | `text-[12px] text-text-muted` 우측 정렬 |
| 설명 | `text-[13px] text-text-secondary ml-6 mt-1` |

### 5.14 프로그레스 바

프로젝트 진행률, 매출 달성률 등에 사용.

```
매출 목표 달성률
██████████████░░░░░░░  72%    ₩36,000,000 / ₩50,000,000
```

| 부분 | 스타일 |
|------|--------|
| 트랙 | `h-2.5 bg-gray-100 rounded-full overflow-hidden` |
| 게이지 | `h-full bg-primary rounded-full transition-all 500ms ease-out` |
| 라벨 | `text-[13px] text-text-secondary flex justify-between mb-1.5` |
| 퍼센트 | `text-[13px] font-semibold text-primary` |
| 색상 분기 | 0~30% `bg-error`, 30~70% `bg-warning`, 70~100% `bg-primary`, 100%+ `bg-success` |

### 5.15 드래그 앤 드롭 (dnd-kit)

견적서 카드를 프로젝트에 드래그하여 연결/등록하는 인터랙션.

| 상태 | 스타일 |
|------|--------|
| 평상시 | 일반 카드 스타일 |
| 드래그 시작 | `opacity-50 scale-[1.03] shadow-2xl rotate-[2deg] cursor-grabbing` |
| 드래그 중 | 원래 위치에 `border-2 border-dashed border-primary/30 bg-primary/5` 잔상 |
| 드롭 영역 hover | `border-2 border-dashed border-primary bg-primary/10` 하이라이트 |
| 드롭 영역 비활성 | `border-2 border-dashed border-gray-300` |
| 드롭 완료 | 카드가 목표 위치로 `300ms ease-out` 슬라이드 + 잠깐 `ring-2 ring-primary` 피드백 |
| 드래그 핸들 | 좌측 `⠿` 그립 아이콘 (`GripVertical`, Lucide), `cursor-grab` |

```
드래그 오버레이 (DragOverlay):
  원본 카드와 동일한 모양
  shadow-2xl 강조
  scale(1.03)
  약간 회전 rotate(2deg) → 움직이는 느낌
  z-50
```

---

## 6. 아이콘 & 일러스트

### 6.1 아이콘

```
라이브러리: Lucide React (MIT)
기본 크기: w-5 h-5 (20px)
소형: w-4 h-4 (16px)
대형: w-6 h-6 (24px)
색상: currentColor (부모 텍스트 색상 상속)
stroke-width: 1.75 (기본보다 약간 가늘게 → 우아한 느낌)
```

**아이콘 금지 사항:**
- 이모지를 UI 아이콘으로 사용 금지 (SVG만)
- 여러 아이콘 셋 혼용 금지

### 6.2 일러스트

```
라이브러리: unDraw (무료, SVG)
색상: primary (#078080) 으로 커스텀
용도: 빈 상태, 온보딩, 에러 페이지
크기: max-w-[240px] (빈 상태), max-w-[320px] (에러 페이지)
```

빈 상태 구성:
```
┌──────────────────────────────────┐
│                                  │
│      [unDraw 일러스트 SVG]       │
│                                  │
│   아직 프로젝트가 없습니다        │  ← H3, text-primary
│   새 프로젝트를 만들어보세요      │  ← Body, text-muted
│                                  │
│      [ + 새 프로젝트 ]           │  ← Primary 버튼
│                                  │
└──────────────────────────────────┘
```

---

## 7. 애니메이션 & 트랜지션

### 7.1 원칙

```
속도: 150~300ms (마이크로 인터랙션)
이징: ease-out (대부분), ease-in-out (모달)
prefers-reduced-motion 존중 필수
transform/opacity만 사용 (GPU 가속)
width/height 애니메이션 금지 (레이아웃 리플로우)
```

### 7.2 표준 트랜지션

| 인터랙션 | 속성 | 시간 |
|----------|------|------|
| 버튼 hover | `color, background, shadow` | 200ms |
| 카드 hover | `shadow, transform` | 300ms |
| 모달 진입 | `opacity, transform(scale)` | 200ms |
| 모달 퇴장 | `opacity` | 150ms |
| 토스트 진입 | `transform(translateX)` | 300ms |
| 드롭다운 | `opacity, transform(scaleY)` | 150ms |
| 페이지 전환 | `opacity` | 200ms |
| 아코디언 | `max-height, opacity` | 250ms |

### 7.3 카드 hover 효과

```css
/* 기본 카드 */
transition: box-shadow 300ms ease-out, transform 300ms ease-out;
&:hover {
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

/* 견적서 카드 (강조) */
&:hover {
  box-shadow: 0 15px 30px -5px rgba(7, 128, 128, 0.12);
  transform: translateY(-3px);
  border-color: rgba(7, 128, 128, 0.3);
}
```

### 7.4 로딩 상태

```
스켈레톤: bg-gray-200 animate-pulse rounded-xl
스피너: border-2 border-primary/20 border-t-primary rounded-full animate-spin
버튼 로딩: 텍스트 → 스피너 교체, disabled 상태
```

---

## 8. 반응형 브레이크포인트

| 이름 | 범위 | 용도 |
|------|------|------|
| `sm` | 640px+ | 모바일 가로 |
| `md` | 768px+ | 태블릿 |
| `lg` | 1024px+ | 데스크탑 |
| `xl` | 1280px+ | 넓은 데스크탑 |
| `2xl` | 1536px+ | 울트라 와이드 |

### 주요 반응형 패턴

| 요소 | 모바일 | 태블릿 | 데스크탑 |
|------|--------|--------|----------|
| 사이드바 | 숨김 (햄버거) | 접힌 상태 (72px) | 펼침 (260px) |
| 카드 그리드 | 1열 | 2열 | 3열 |
| 통계 카드 | 2열 | 4열 | 4열 |
| 테이블 | 카드로 전환 | 스크롤 | 풀 테이블 |
| 모달 | 풀스크린 | 중앙 | 중앙 |

---

## 9. 접근성 (A11y)

### 필수 체크리스트

- [ ] 텍스트 대비 4.5:1 이상 (WCAG AA)
- [ ] 모든 인터랙티브 요소 `cursor-pointer`
- [ ] 포커스 링: `ring-2 ring-primary/40 ring-offset-2` (키보드 탐색)
- [ ] 아이콘 버튼에 `aria-label`
- [ ] 폼 입력에 `<label>` 연결
- [ ] 이미지에 `alt` 텍스트
- [ ] `prefers-reduced-motion` 시 애니메이션 비활성화
- [ ] 색상만으로 정보 전달 금지 (아이콘/텍스트 병행)
- [ ] 모달 열림 시 포커스 트랩
- [ ] Tab 순서 = 시각적 순서

---

## 10. Tailwind 커스텀 설정 (참조용)

```js
// tailwind.config.js (v2 전용)
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#078080',
          light: '#0D9488',
          dark: '#065F5F',
        },
        accent: {
          DEFAULT: '#F45D48',
          light: '#F97316',
        },
        surface: '#F8F5F2',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Pretendard', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
      backdropBlur: {
        xl: '16px',
        '2xl': '20px',
      },
    },
  },
}
```

---

## 부록: 컴포넌트 체크리스트

v2 구현 시 필요한 공통 컴포넌트:

| 컴포넌트 | 우선순위 | 비고 |
|----------|----------|------|
| `Button` | P0 | Primary, Secondary, Accent, Ghost, Icon |
| `Card` | P0 | Glass 카드, 통계 카드 |
| `QuotationCard` | P0 | 견적서 미니 카드 (전용) |
| `Badge` | P0 | 상태, 회사, 단계 |
| `Input` | P0 | Text, Number, Date, Select |
| `Modal` | P0 | 기본, 확인, 폼 |
| `Toast` | P0 | 성공, 에러, 경고, 정보 |
| `Sidebar` | P0 | 회사 전환 포함 |
| `EmptyState` | P1 | unDraw + CTA |
| `Skeleton` | P1 | 카드, 테이블, 리스트 |
| `Table` | P1 | 정렬, 페이지네이션 |
| `Dropdown` | P1 | 메뉴, 셀렉트 |
| `Tabs` | P1 | 수평 탭바 |
| `Timeline` | P2 | 프로젝트 진행 상태 |
| `Accordion` | P2 | 섹션 접기/펼치기 |
| `DragCard` | P2 | dnd-kit 연동 견적서 카드 |
| `ProgressBar` | P2 | 프로젝트 진행률 |
| `Avatar` | P2 | 사용자, 거래처 |
