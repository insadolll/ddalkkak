# 딸깍(DDalKKak) v2 — 견적서 카드 UI 상세 설계

> 작성일: 2026-03-18
> 상태: 초안
> 참조: v2-design-system.md, v2-wireframes.md

---

## 1. 카드 변형 (Variants)

견적서 카드는 사용되는 맥락에 따라 3가지 크기로 구분.

| 변형 | 사용처 | 크기 |
|------|--------|------|
| Mini | 프로젝트 상세 풀, 드래그앤드롭 | 작음 (220px) |
| Standard | 견적서 목록 페이지 | 중간 (280px) |
| Expanded | 카드 클릭 시 인라인 확장 | 가변 (풀 너비) |

---

## 2. Mini 카드

프로젝트 상세의 견적서 풀 안에서 사용. 최소 정보만 노출.

### 2.1 기본 상태

```
┌────────────────────────────┐
│ ⠿  Q-2026-001       Rev.2 │
│                            │
│    B사                     │
│    ₩11,200,000             │
│    2026-03-14              │
│                            │
│    [📄 PDF]                │
└────────────────────────────┘
```

| 요소 | 스타일 |
|------|--------|
| 컨테이너 | `w-[220px] bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-white/30 shadow-sm` |
| 드래그 핸들 `⠿` | `GripVertical` Lucide, `w-4 h-4 text-gray-300 cursor-grab` |
| 견적번호 | `text-[14px] font-semibold text-text-primary` |
| 리비전 뱃지 | `bg-gray-100 text-gray-600 text-[11px] rounded-full px-2 py-0.5` |
| 거래처명 | `text-[13px] text-text-secondary mt-2` |
| 금액 | `text-[16px] font-mono font-semibold text-text-primary mt-1` |
| 날짜 | `text-[12px] text-text-muted mt-0.5` |
| 액션 영역 | `mt-3 flex gap-2` |

### 2.2 매출 vs 매입 구분

```
매출 견적서:
┌─ ── ── ── ── ── ── ── ── ──┐     좌측 border
│▍ Q-2026-001         Rev.2  │     border-l-3 border-primary (#078080)
│▍ A사                        │     견적번호 텍스트: text-primary
│▍ ₩15,000,000               │
│▍ ...                        │
└─ ── ── ── ── ── ── ── ── ──┘

매입 견적서:
┌─ ── ── ── ── ── ── ── ── ──┐     좌측 border
│▍ 매입-B사-001        v2    │     border-l-3 border-accent (#F45D48)
│▍ B사                        │     견적번호 텍스트: text-accent
│▍ ₩11,200,000               │
│▍ ...                        │
└─ ── ── ── ── ── ── ── ── ──┘
```

### 2.3 상태별 스타일

| 상태 | 카드 스타일 | 뱃지 |
|------|------------|------|
| 작성중 | 기본 | `bg-gray-100 text-gray-600` "작성중" |
| 발송완료 | 기본 | `bg-info/10 text-info-700` "발송완료" |
| 확정 ★ | `border-2 border-primary bg-primary/[0.03]` | `bg-primary/10 text-primary font-semibold` "확정 ★" |
| 폐기 | `opacity-50` | `bg-gray-100 text-gray-400 line-through` "폐기" |

### 2.4 hover 상태

```css
transition: box-shadow 300ms ease-out, transform 300ms ease-out, border-color 300ms ease-out;

/* hover */
box-shadow: 0 12px 24px -4px rgba(7, 128, 128, 0.10);
transform: translateY(-3px);
border-color: rgba(7, 128, 128, 0.25);

/* 확정 카드 hover */
box-shadow: 0 12px 24px -4px rgba(7, 128, 128, 0.18);
transform: translateY(-3px);
```

### 2.5 액션 버튼 (hover 시 노출)

평상시에는 PDF 버튼만 보이고, hover 시 추가 액션이 페이드인.

```
평상시:
  [📄]

hover 시:
  [📧 메일] [📄 PDF] [⋮ 더보기]

더보기 메뉴:
  ┌──────────────────┐
  │ 📋 발주서로 변환  │
  │ ✏️ 수정           │  ← Lucide Pencil 아이콘
  │ ✓  확정           │
  │ ── ── ── ── ──   │
  │ 🗑 폐기           │  ← text-error
  └──────────────────┘
```

---

## 3. Standard 카드

견적서 목록 페이지에서 사용. Mini보다 정보가 많음.

### 3.1 기본 구조

```
┌────────────────────────────────┐
│  Q-2026-001             Rev.2  │  ← 견적번호 + 리비전
│  A사 장비 납품 견적서           │  ← 제목 (있을 경우)
│                                │
│  수신: A사 / 김부장             │  ← 거래처 + 담당자
│                                │
│  ₩15,000,000                   │  ← 공급가액
│  (세포함 ₩16,500,000)          │  ← 합계 (작은 글씨)
│  2026-03-17                    │  ← 견적일자
│                                │
│  [확정 ★]     [HUBIOCEM]       │  ← 상태 뱃지 + 회사 뱃지
│                                │
│  → A사 장비 납품 프로젝트       │  ← 연결 프로젝트 링크
│                                │
│  [📧 메일] [📄 PDF] [📊 Excel] │  ← 액션 버튼
└────────────────────────────────┘
```

| 요소 | 스타일 |
|------|--------|
| 컨테이너 | `w-full max-w-[280px] bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-white/30 shadow-sm` |
| 좌측 컬러바 | 매출: `border-l-3 border-primary`, 매입: `border-l-3 border-accent` |
| 견적번호 | `text-[15px] font-semibold text-text-primary` |
| 제목 | `text-[13px] text-text-secondary mt-0.5 truncate` |
| 거래처+담당자 | `text-[13px] text-text-secondary mt-3` |
| 공급가액 | `text-[18px] font-mono font-bold text-text-primary mt-2` |
| 세포함 합계 | `text-[12px] font-mono text-text-muted` |
| 날짜 | `text-[12px] text-text-muted mt-1` |
| 상태 뱃지 | 섹션 2.3 참고 |
| 회사 뱃지 | HUBIOCEM: `bg-violet-100 text-violet-700`, BTMS: `bg-blue-100 text-blue-700` |
| 프로젝트 링크 | `text-[12px] text-primary hover:underline cursor-pointer mt-2` |
| 액션 버튼 | `mt-3 pt-3 border-t border-gray-100 flex gap-2` |

### 3.2 프로젝트 미연결 카드

```
┌────────────────────────────────┐
│  Q-2026-005             Rev.0  │
│  단독 견적서                    │
│                                │
│  수신: F사 / 박대리             │
│                                │
│  ₩3,200,000                    │
│  2026-03-18                    │
│                                │
│  [작성중]                       │
│                                │
│  ⚠ 프로젝트 미연결             │  ← text-warning, 연결 유도
│                                │
│  [📧 메일] [📄 PDF]            │
└────────────────────────────────┘
```

---

## 4. Expanded 카드 (인라인 확장)

카드를 클릭하면 같은 자리에서 확장. 모달 대신 맥락 유지.

### 4.1 접힘 → 펼침 전환

```
클릭 전 (Mini):
┌────────────────────────────┐
│ Q-2026-001           Rev.2 │
│ B사 | ₩11,200,000 | 03-14 │
│ [PDF] ★확정                │
└────────────────────────────┘
        │
        │ 클릭 (300ms ease-out)
        ▼
펼침 후 (Expanded):
┌──────────────────────────────────────────────────────┐
│ Q-2026-001                              Rev.2    [×] │
│ B사 견적서 v2                                        │
│ ₩11,200,000                    ★ 확정                │
│                                                      │
│ ─────────────────────────────────────────────────── │
│                                                      │
│ 품목 목록                                            │
│ ┌──────────┬───────┬───────────┬─────────────┐      │
│ │ 품명      │ 수량   │ 단가       │ 금액         │      │
│ ├──────────┼───────┼───────────┼─────────────┤      │
│ │ 분석장비A │   2   │ 3,500,000 │  7,000,000  │      │
│ │ 시약 세트 │  10   │   420,000 │  4,200,000  │      │
│ └──────────┴───────┴───────────┴─────────────┘      │
│                                                      │
│ 공급가액: ₩11,200,000                                │
│ 세액:     ₩ 1,120,000                                │
│ 합계:     ₩12,320,000                                │
│                                                      │
│ ─────────────────────────────────────────────────── │
│                                                      │
│ 리비전 이력                                          │
│ ● Rev.0  최초       03-10                            │
│ ● Rev.1  수량 변경  03-12                            │
│ ◉ Rev.2  단가 조정  03-14  ← 현재                   │
│                                                      │
│ ─────────────────────────────────────────────────── │
│                                                      │
│ 원본 파일                                            │
│ 📎 B사_견적서_v2.pdf                    [다운로드]   │
│                                                      │
│ ─────────────────────────────────────────────────── │
│                                                      │
│ [📧 메일발송] [📄 PDF] [📋 발주서변환] [매출견적생성] │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 4.2 펼침 스타일

| 요소 | 스타일 |
|------|--------|
| 컨테이너 | `bg-white/90 backdrop-blur-xl rounded-2xl p-5 shadow-lg ring-1 ring-primary/10` |
| 닫기 [×] | `w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center cursor-pointer` |
| 구분선 | `border-t border-gray-100 my-4` |
| 품목 테이블 | 컴팩트: `text-[13px] py-2 px-3` |
| 금액 요약 | `text-right font-mono text-[14px]` |
| 리비전 이력 | 미니 타임라인 (세로, 컴팩트) |
| 원본 파일 | 파일명 + 다운로드 링크 |
| 액션 버튼 그룹 | `flex flex-wrap gap-2 mt-4` |

### 4.3 전환 애니메이션

```css
/* grid-template-rows 트릭 */
.card-expand {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows 300ms ease-out, opacity 250ms ease-out;
}
.card-expand.open {
  grid-template-rows: 1fr;
  opacity: 1;
}
.card-expand > .inner {
  overflow: hidden;
}

/* 펼침 시 다른 카드 */
/* 같은 풀 내 다른 카드는 살짝 축소 (시각적 포커스) */
.sibling-card-when-expanded {
  opacity: 0.6;
  transform: scale(0.98);
  transition: opacity 300ms, transform 300ms;
}
```

---

## 5. 드래그앤드롭 상태

### 5.1 드래그 시작 (카드를 잡았을 때)

```
원래 위치 (잔상):
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│                               │    border-2 border-dashed border-primary/30
│     (빈 영역)                 │    bg-primary/5
│                               │    rounded-2xl
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘

드래그 오버레이 (마우스 따라다님):
┌────────────────────────────┐
│ Q-2026-001           Rev.2 │    shadow-2xl
│ B사 | ₩11,200,000         │    scale(1.05)
│ [PDF] ★확정                │    rotate(2deg)
└────────────────────────────┘    opacity-90
                                  z-50
                                  cursor-grabbing
```

### 5.2 드롭 영역 (프로젝트 견적서 풀)

```
드롭 가능 (카드가 위에 있을 때):
┌══════════════════════════════════════════════════════┐
║  ▾  매입 견적서 풀 (3건)                              ║
║  ═══════════════════════════════════════════════════  ║
║                                                       ║
║  [카드A] [카드B] [카드C]  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐    ║
║                           │  여기에 놓으세요     │    ║
║                           │  + 견적서 추가       │    ║
║                           └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘    ║
║                                                       ║
└══════════════════════════════════════════════════════┘

드롭 영역 하이라이트:
  border-2 border-dashed border-primary
  bg-primary/[0.05]
  텍스트: text-primary text-[13px]
  아이콘: Plus (Lucide) w-5 h-5

드롭 불가 영역 (예: 매출 풀에 매입 카드):
  border-2 border-dashed border-error/50
  bg-error/[0.03]
  텍스트: "매입 견적서는 매출 풀에 넣을 수 없습니다" text-error
  cursor: not-allowed
```

### 5.3 드롭 완료

```
카드가 목표 위치에 착지:
  300ms ease-out 슬라이드
  착지 후 잠깐 ring-2 ring-primary (500ms 후 fade-out)
  토스트: "견적서가 매입 풀에 추가되었습니다" (success)
```

---

## 6. 특수 상태

### 6.1 매입→매출 자동생성 표시

매입 견적서로부터 자동 생성된 매출 견적서에 출처 표시.

```
┌────────────────────────────────┐
│  Q-2026-001             Rev.0  │
│  A사 견적서                     │
│                                │
│  ₩15,000,000                   │
│  마진 25.3%                    │  ← text-success, 마진률 표시
│                                │
│  ↑ B사 견적 v2 기반             │  ← text-muted, 출처 링크
│  [확정]                         │
│                                │
│  [📧 메일] [📄 PDF]            │
└────────────────────────────────┘
```

### 6.2 발주서 변환 카드

견적서에서 발주서로 변환된 경우 시각적으로 구분.

```
┌────────────────────────────────┐
│  📋 PO-2026-001         Rev.0  │  ← 아이콘 변경 (FileText → ClipboardList)
│  B사 발주서                     │
│  [발주서]                       │  ← 전용 뱃지 bg-violet-100 text-violet-700
│                                │
│  ₩11,200,000                   │
│  2026-03-20                    │
│                                │
│  ↑ 매입 견적서 B사 v2 기반      │  ← 출처 링크
│                                │
│  [📧 발송] [📄 PDF]            │
└────────────────────────────────┘
```

### 6.3 메일 수집 카드 (IMAP 자동)

자동 수집된 매입 견적서. 품목 미입력 상태.

```
┌────────────────────────────────┐
│  📨 수신-2026-0315-001         │  ← 수신 아이콘 (Mail → Inbox)
│  B사 | 자동 수집                │
│  [입력 필요]                    │  ← bg-warning/10 text-warning-700
│                                │
│  금액: 미입력                   │  ← text-muted, italic
│  수신: 2026-03-15 14:32        │
│                                │
│  📎 B사_견적서.pdf              │  ← 첨부파일 표시
│                                │
│  [품목 입력하기]                 │  ← Primary 버튼, 클릭 → 입력 폼
└────────────────────────────────┘

품목 입력 완료 후 → 일반 매입 견적서 카드로 전환
```

### 6.4 만료 임박 / 만료 카드

견적 유효기간 기반.

```
만료 임박 (D-3 이하):
┌────────────────────────────────┐
│  Q-2026-001             Rev.2  │
│  ...                           │
│  ⚠ 유효기간 D-2                │  ← text-warning, 깜빡임 없이 아이콘만
└────────────────────────────────┘

만료됨:
┌────────────────────────────────┐
│  Q-2026-001             Rev.2  │  ← 전체 opacity-60
│  ...                           │
│  ✕ 유효기간 만료 (03-15)       │  ← text-error
└────────────────────────────────┘
```

---

## 7. 카드 그리드 레이아웃

### 7.1 프로젝트 상세 (견적서 풀 내부)

```
가로 스크롤 (카드 수가 많을 때):
┌─────────────────────────────────────────────────────────┐
│ [카드1] [카드2] [카드3] [카드4] [카드5] →              │
└─────────────────────────────────────────────────────────┘

  flex flex-nowrap overflow-x-auto gap-4 pb-2
  스크롤바: thin, 커스텀 (primary 색상)
  snap: scroll-snap-type: x mandatory
        scroll-snap-align: start (각 카드)
```

### 7.2 견적서 목록 (그리드)

```
데스크탑 (1280px+):  4열
  grid grid-cols-4 gap-5

데스크탑 (1024px+):  3열
  grid grid-cols-3 gap-5

태블릿 (768px+):    2열
  grid grid-cols-2 gap-4

모바일 (~767px):    1열
  grid grid-cols-1 gap-3
  카드 max-w 제한 해제 → 풀 너비
```

---

## 8. 인터랙션 상세

### 8.1 카드 클릭 동작

| 맥락 | 클릭 동작 |
|------|----------|
| 견적서 목록 | 견적서 상세 페이지로 이동 (`/quotations/:id`) |
| 프로젝트 상세 풀 | 인라인 확장 (Expanded 카드) |
| 드래그 중 | 드래그 동작 (클릭 무시) |

### 8.2 우클릭 / 길게 누르기

```
컨텍스트 메뉴 (커스텀):
┌──────────────────┐
│ 📄 상세 보기      │
│ 📧 메일 발송      │
│ 📋 발주서로 변환  │
│ ✏  수정           │  ← Lucide Pencil
│ ✓  확정           │
│ ── ── ── ── ──   │
│ 📑 복제           │
│ 🗑 폐기           │  ← text-error
└──────────────────┘
```

### 8.3 키보드 접근성

| 키 | 동작 |
|----|------|
| `Tab` | 카드 간 포커스 이동 |
| `Enter` / `Space` | 카드 클릭 (확장 or 이동) |
| `Escape` | 확장 카드 닫기 |
| `Arrow Left/Right` | 같은 풀 내 카드 이동 (가로 스크롤 시) |

### 8.4 포커스 스타일

```
카드 포커스 (키보드):
  ring-2 ring-primary/40 ring-offset-2
  outline: none

포커스 시 액션 버튼도 함께 노출 (hover와 동일)
```

---

## 9. 반응형 대응

### 9.1 모바일 (< 768px)

```
Mini 카드 → 가로 풀 너비:
┌──────────────────────────────────────┐
│ Q-2026-001  Rev.2          ★ 확정   │
│ B사 | ₩11,200,000 | 03-14          │
│                                      │
│ [📧 메일] [📄 PDF] [⋮]             │
└──────────────────────────────────────┘

  1행으로 압축 (견적번호 + 거래처 + 금액 + 날짜)
  액션 버튼 항상 표시 (hover 불가)
  드래그앤드롭 → 길게 누르기로 시작
```

### 9.2 태블릿 (768px ~ 1023px)

```
Mini 카드 유지, 2열 그리드
Standard 카드 유지, 2열 그리드
Expanded → 풀 너비 (2열 합침)
```

---

## 10. 빈 상태

### 10.1 견적서 풀 비어있을 때

```
┌────────────────────────────────────────────────┐
│  ▾  매입 견적서 풀 (0건)         [+ 견적 등록] │
│  ────────────────────────────────────────────  │
│                                                │
│         [unDraw 일러스트: empty_cart]           │
│                                                │
│      아직 매입 견적서가 없습니다                 │
│      거래처에서 견적서를 받으면 등록해주세요      │
│                                                │
│      [+ 견적서 등록]    또는 드래그하여 추가      │
│                                                │
└────────────────────────────────────────────────┘
```

### 10.2 견적서 목록 비어있을 때

```
┌────────────────────────────────────────────────┐
│                                                │
│       [unDraw 일러스트: no_data]               │
│                                                │
│     견적서가 없습니다                           │
│     첫 번째 견적서를 만들어보세요               │
│                                                │
│     [+ 새 견적서 작성]                          │
│                                                │
└────────────────────────────────────────────────┘
```

---

## 부록: 카드 컴포넌트 Props (참조용)

```typescript
interface QuotationCardProps {
  // 데이터
  quotation: {
    id: string;
    number: string;          // Q-2026-001
    revision: number;        // 2
    title?: string;          // 견적서 제목
    type: 'sales' | 'purchase';
    status: 'draft' | 'sent' | 'confirmed' | 'void';
    supplierAmount: number;  // 공급가액
    taxAmount: number;       // 세액
    totalAmount: number;     // 합계
    date: string;            // 견적일자
    validUntil?: string;     // 유효기간
    company: 'HUBIOCEM' | 'BTMS';
    counterpart: {           // 거래처
      name: string;
      contactPerson?: string;
    };
    project?: {              // 연결 프로젝트
      id: string;
      name: string;
    };
    sourceQuotation?: {      // 출처 견적서 (자동생성 시)
      id: string;
      number: string;
    };
    marginRate?: number;     // 마진률 (매출 견적서)
    attachments?: { name: string; url: string }[];
    items?: QuotationItem[]; // 품목 (Expanded에서 사용)
    revisions?: Revision[];  // 리비전 이력 (Expanded에서 사용)
  };

  // 변형
  variant: 'mini' | 'standard' | 'expanded';

  // 상태
  isExpanded?: boolean;
  isDragging?: boolean;
  isDragOverlay?: boolean;

  // 이벤트
  onClick?: () => void;
  onExpand?: () => void;
  onCollapse?: () => void;
  onMailSend?: () => void;
  onPdfDownload?: () => void;
  onExcelDownload?: () => void;
  onConvertToPO?: () => void;
  onConfirm?: () => void;
  onVoid?: () => void;
  onDuplicate?: () => void;
  onGenerateSalesQuotation?: () => void;  // 매입→매출
}
```
