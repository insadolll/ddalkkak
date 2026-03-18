# 딸깍(DDalKKak) v2 — API 엔드포인트 설계

> 작성일: 2026-03-18
> 상태: 초안
> 참조: v2-db-schema.md, v2-sales-quotation-spec.md, v2-screen-flows.md

---

## 설계 원칙

1. **RESTful** — 리소스 기반, HTTP 메서드 활용
2. **멀티 컴퍼니** — 모든 요청에 `x-company-id` 헤더 또는 쿼리로 회사 필터
3. **RBAC** — 미들웨어에서 역할별 접근 제어
4. **페이지네이션** — 목록은 `?page=1&limit=20` 기본
5. **일관된 응답** — `{ success, data, error, pagination }`
6. **v1 유지 모듈** — 휴가, 결재, 캘린더, 회의록, 건의, DB조회 등은 기존 API 그대로

---

## 공통 사항

### 인증 헤더

```
Authorization: Bearer <JWT>
```

### 회사 컨텍스트

```
x-company-id: <OurCompany.id>
```

- 일반 사용자: 소속 회사 고정 (헤더 무시)
- ADMIN: 헤더 값 또는 `all` (통합)
- ACCOUNTANT: 헤더 값으로 전환 가능 (`all` 불가)

### 공통 응답 형식

```json
// 성공 (단건)
{
  "success": true,
  "data": { ... }
}

// 성공 (목록)
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}

// 에러
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "접근 권한이 없습니다"
  }
}
```

### 공통 쿼리 파라미터

| 파라미터 | 타입 | 용도 |
|----------|------|------|
| `page` | number | 페이지 (기본 1) |
| `limit` | number | 페이지당 건수 (기본 20, 최대 100) |
| `sort` | string | 정렬 필드 (예: `createdAt`) |
| `order` | string | `asc` \| `desc` (기본 desc) |
| `search` | string | 통합 검색어 |

---

## 1. OurCompany (우리 회사)

| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/our-companies` | 회사 목록 | 로그인 |
| GET | `/api/our-companies/:id` | 회사 상세 | 로그인 |
| PUT | `/api/our-companies/:id` | 회사 정보 수정 | ADMIN |
| PUT | `/api/our-companies/:id/smtp` | SMTP 설정 수정 | ADMIN |
| PUT | `/api/our-companies/:id/imap` | IMAP 설정 수정 | ADMIN |
| POST | `/api/our-companies/:id/imap/test` | IMAP 연결 테스트 | ADMIN |
| POST | `/api/our-companies/:id/smtp/test` | SMTP 발송 테스트 | ADMIN |

### PUT `/api/our-companies/:id`

```json
// Request
{
  "name": "휴바이오켐",
  "bizNumber": "123-45-67890",
  "representative": "홍길동",
  "address": "서울시...",
  "phone": "02-1234-5678",
  "email": "info@hubiocem.com",
  "domain": "hubiocem.com",
  "quotationPrefix": "Q",
  "poPrefix": "PO",
  "dsPrefix": "DS"
}
```

---

## 2. Project (프로젝트)

| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/projects` | 프로젝트 목록 | ALL (필터링) |
| GET | `/api/projects/:id` | 프로젝트 상세 | ALL (필터링) |
| POST | `/api/projects` | 프로젝트 생성 | ADMIN, MANAGER |
| PUT | `/api/projects/:id` | 프로젝트 수정 | ADMIN, MANAGER |
| DELETE | `/api/projects/:id` | 프로젝트 삭제 | ADMIN |
| PUT | `/api/projects/:id/stage` | 단계 변경 | ADMIN, MANAGER |
| GET | `/api/projects/:id/summary` | 금액 요약 (확정 기준) | ALL |
| GET | `/api/projects/:id/timeline` | 타임라인 이력 | ALL |

### GET `/api/projects`

쿼리 파라미터:

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `status` | string | ACTIVE, ON_HOLD, COMPLETED, CANCELLED |
| `stage` | string | SETUP ~ DONE |
| `clientId` | string | 고객사 필터 |
| `managerId` | string | 담당자 필터 |
| `startDateFrom` | date | 시작일 범위 (from) |
| `startDateTo` | date | 시작일 범위 (to) |
| `groupBy` | string | `status` \| `client` \| `manager` \| `month` |

### GET `/api/projects/:id` — 응답

```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "A사 장비 납품",
    "stage": "QUOTE_SENT",
    "status": "ACTIVE",
    "client": { "id": "...", "name": "A사" },
    "supplier": { "id": "...", "name": "B사" },
    "manager": { "id": "...", "name": "홍길동" },
    "startDate": "2026-03-10",
    "endDate": "2026-06-30",
    "summary": {
      "confirmedSalesAmount": 15000000,
      "confirmedSalesTax": 1500000,
      "confirmedPurchaseAmount": 11200000,
      "confirmedPurchaseTax": 1120000,
      "profit": 3800000,
      "profitRate": 25.3
    },
    "quotationCounts": {
      "salesTotal": 3,
      "salesConfirmed": 1,
      "purchaseTotal": 2,
      "purchaseConfirmed": 1
    },
    "attachmentCount": 5,
    "invoiceStatus": {
      "sales": "REQUESTED",
      "purchase": "NOT_ISSUED"
    }
  }
}
```

### PUT `/api/projects/:id/stage`

```json
// Request
{
  "stage": "ORDER_CONFIRMED",
  "note": "고객사 발주서 수령 완료"   // ProjectMemo에 자동 기록
}
```

---

## 3. Quotation (견적서)

### 3.1 CRUD

| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/quotations` | 견적서 목록 | ALL (필터링) |
| GET | `/api/quotations/:id` | 견적서 상세 | ALL (필터링) |
| POST | `/api/quotations` | 견적서 생성 | ADMIN, MANAGER, EMPLOYEE |
| PUT | `/api/quotations/:id` | 견적서 수정 | ADMIN, MANAGER, 작성자 |
| DELETE | `/api/quotations/:id` | 견적서 삭제 | ADMIN |

### GET `/api/quotations`

쿼리 파라미터:

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `direction` | string | SALES \| PURCHASE |
| `status` | string | DRAFT, SENT, CONFIRMED, VOID |
| `projectId` | string | 프로젝트 필터 |
| `counterpartId` | string | 거래처 필터 |
| `isConfirmed` | boolean | 확정 여부 |
| `dateFrom` | date | 견적일 범위 |
| `dateTo` | date | 견적일 범위 |

### POST `/api/quotations` — 생성

```json
// Request
{
  "direction": "SALES",
  "projectId": "...",               // optional (독립 견적서 가능)
  "title": "A사 장비 납품 견적서",
  "quotationDate": "2026-03-17",
  "validUntil": "2026-04-16",
  "paymentTerms": "납품 후 30일",
  "counterpartId": "...",
  "contactName": "김부장",
  "contactEmail": "kim@a-company.com",
  "defaultTaxRate": 10,
  "items": [
    {
      "name": "분석장비A",
      "spec": "Model-X",
      "unit": "EA",
      "quantity": 2,
      "unitPrice": 5000000,
      "taxRate": 10,
      "remark": ""
    },
    {
      "name": "설치비",
      "quantity": 1,
      "unitPrice": 3000000,
      "taxRate": 10
    }
  ],
  "memo": ""
}

// Response
{
  "success": true,
  "data": {
    "id": "...",
    "quotationNo": "Q-2026-001",
    "revision": 0,
    "supplyAmount": 13000000,
    "taxAmount": 1300000,          // Math.floor(13000000 * 0.1)
    "totalAmount": 14300000,
    ...
  }
}
```

### 3.2 견적서 액션

| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| POST | `/api/quotations/:id/confirm` | 확정 (풀에서 선택) | ADMIN, MANAGER |
| POST | `/api/quotations/:id/void` | 폐기 | ADMIN, MANAGER |
| POST | `/api/quotations/:id/revision` | 새 리비전 생성 | ADMIN, MANAGER, 작성자 |
| GET | `/api/quotations/:id/revisions` | 리비전 이력 조회 | ALL |
| POST | `/api/quotations/:id/send-mail` | 메일 발송 (딸깍) | ADMIN, MANAGER, 작성자 |
| GET | `/api/quotations/:id/pdf` | PDF 다운로드 | ALL |
| GET | `/api/quotations/:id/excel` | Excel 다운로드 | ALL |
| POST | `/api/quotations/:id/duplicate` | 견적서 복제 | ADMIN, MANAGER, 작성자 |

### POST `/api/quotations/:id/confirm`

```json
// Request
{ "note": "고객 최종 합의 완료" }

// 서버 처리:
// 1. quotation.isConfirmed = true, confirmedAt = now
// 2. project.confirmedSalesAmount / confirmedPurchaseAmount 재계산
// 3. 결제조건 기반 → Invoice 자동 생성 (status: NOT_ISSUED)
// 4. 결제조건 파싱 → CalendarEvent 자동 생성 (결제 마감일)
// 5. ProjectMemo에 확정 기록
// 6. Notification 발송 (프로젝트 관련자)

// Response
{
  "success": true,
  "data": {
    "quotation": { ... },
    "invoiceCreated": true,
    "calendarEventCreated": true
  }
}
```

### POST `/api/quotations/:id/revision`

```json
// Request
{
  "changeNote": "단가 변경 (부품A)",
  "items": [ ... ]                 // 수정된 품목 목록 (전체 교체)
}

// 서버 처리:
// 1. 현재 상태를 QuotationRevision에 스냅샷 저장
// 2. quotation.revision += 1
// 3. 품목 업데이트
// 4. 금액 재계산
```

### POST `/api/quotations/:id/send-mail`

```json
// Request
{
  "to": ["kim@a-company.com"],
  "cc": ["lee@a-company.com"],
  "subject": "견적서 송부의 건 - Q-2026-001 (Rev.2)",
  "body": "안녕하세요, 휴바이오켐 홍길동입니다.\n\n요청하신 견적서를 송부드립니다.",
  "attachPdf": true,
  "additionalFiles": []            // 추가 첨부 파일 경로
}

// 서버 처리:
// 1. OurCompany SMTP 설정으로 메일 발송
// 2. PDF 자동 생성 → 첨부
// 3. quotation.lastSentAt, sentCount 갱신
// 4. status → SENT (DRAFT인 경우)
```

### 3.3 매입→매출 자동 생성

| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| POST | `/api/quotations/:id/generate-sales` | 매입 기반 매출 견적서 생성 | ADMIN, MANAGER |

```json
// Request
{
  "marginType": "rate",            // "rate" | "amount"
  "marginValue": 25,               // 25% or 금액
  "distributeMethod": "uniform",   // "uniform" (균등) | "per_item" (품목별)
  "perItemMargins": []             // distributeMethod=per_item 시 품목별 설정
}

// 서버 처리:
// 1. 매입 견적서 품목 복사
// 2. 마진 반영 단가 계산
// 3. 새 매출 견적서 생성 (sourceQuotationId 연결)
// 4. 같은 프로젝트에 자동 연결

// Response
{
  "success": true,
  "data": {
    "id": "...",
    "quotationNo": "Q-2026-002",
    "sourceQuotationId": "...",
    "marginRate": 25.3,
    "supplyAmount": 15000000,
    ...
  }
}
```

### 3.4 매입 견적서 등록 (수동)

일반 견적서 생성과 동일하지만 `direction: "PURCHASE"` + 원본 파일 업로드.

| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| POST | `/api/quotations/purchase` | 매입 견적서 등록 | ADMIN, MANAGER, EMPLOYEE |

```json
// Request (multipart/form-data)
{
  "projectId": "...",
  "counterpartId": "...",
  "items": [ ... ],
  "originalFile": <File>            // 매입처 원본 PDF
}

// 서버 처리:
// 1. 파일 저장 → originalFilePath
// 2. 견적서 생성 (direction: PURCHASE)
// 3. ProjectAttachment에도 원본 파일 등록
```

---

## 4. PurchaseOrder (발주서)

| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/purchase-orders` | 발주서 목록 | ALL (필터링) |
| GET | `/api/purchase-orders/:id` | 발주서 상세 | ALL |
| POST | `/api/purchase-orders/from-quotation/:quotationId` | 견적서→발주서 변환 | ADMIN, MANAGER |
| PUT | `/api/purchase-orders/:id` | 발주서 수정 | ADMIN, MANAGER |
| POST | `/api/purchase-orders/:id/send-mail` | 발주서 메일 발송 | ADMIN, MANAGER |
| GET | `/api/purchase-orders/:id/pdf` | PDF 다운로드 | ALL |

### POST `/api/purchase-orders/from-quotation/:quotationId`

```json
// Request
{
  "deliveryDate": "2026-04-15",
  "deliveryPlace": "서울 본사",
  "memo": ""
}

// 서버 처리:
// 1. 견적서 품목 복사 → PurchaseOrderItem
// 2. 문구 자동 변경 (견적서→발주서)
// 3. 같은 프로젝트에 연결
// 4. PO 번호 자동 채번

// Response
{
  "success": true,
  "data": {
    "id": "...",
    "poNo": "PO-2026-001",
    "sourceQuotationId": "...",
    ...
  }
}
```

---

## 5. Invoice (계산서)

| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/invoices` | 계산서 목록 | ALL (필터링) |
| GET | `/api/invoices/:id` | 계산서 상세 | ALL |
| PUT | `/api/invoices/:id/status` | 상태 변경 | ADMIN, MANAGER, ACCOUNTANT |
| POST | `/api/invoices/:id/request` | 계산서 처리 요청 (메일) | ADMIN, MANAGER, EMPLOYEE |

### PUT `/api/invoices/:id/status`

```json
// Request
{
  "status": "ISSUED",
  "invoiceNo": "20260317-12345678",   // 외부 세금계산서 번호
  "memo": "홈택스에서 발행 완료"
}

// 권한:
// - ACCOUNTANT: REQUESTED → ISSUED, ISSUED → PAID 가능
// - MANAGER: 모든 전환 가능
```

### POST `/api/invoices/:id/request`

```json
// Request
{
  "recipientId": "...",              // 경영지원 담당자
  "memo": "3월 계산서 처리 부탁드립니다"
}

// 서버 처리:
// 1. status → REQUESTED
// 2. 경영지원에게 메일 발송 (프로젝트 링크 포함)
// 3. Notification 생성
```

---

## 6. CreditNote (수정계산서)

| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/invoices/:invoiceId/credit-notes` | 수정계산서 목록 | ALL |
| POST | `/api/invoices/:invoiceId/credit-notes` | 수정계산서 생성 | ADMIN, MANAGER, ACCOUNTANT |
| PUT | `/api/credit-notes/:id/status` | 상태 변경 | ADMIN, MANAGER, ACCOUNTANT |

### POST `/api/invoices/:invoiceId/credit-notes`

```json
// Request
{
  "reason": "PRICE_ADJUST",
  "reasonDetail": "최종 협상 단가 변경",
  "supplyAmount": -1000000,
  "taxAmount": -100000,
  "totalAmount": -1100000
}

// 서버 처리:
// 1. CreditNote 생성
// 2. 실질 금액 재계산 (프로젝트 요약 갱신)
```

---

## 7. TransactionStatement (거래명세서)

| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/transaction-statements` | 거래명세서 목록 | ALL |
| POST | `/api/transaction-statements/from-project/:projectId` | 프로젝트 기반 자동 생성 | ADMIN, MANAGER |
| PUT | `/api/transaction-statements/:id` | 거래명세서 수정 | ADMIN, MANAGER |
| GET | `/api/transaction-statements/:id/pdf` | PDF 다운로드 | ALL |
| POST | `/api/transaction-statements/:id/send-mail` | 메일 발송 | ADMIN, MANAGER |

### POST `/api/transaction-statements/from-project/:projectId`

```json
// Request
{
  "counterpartId": "...",
  "issueDate": "2026-03-20",
  "memo": ""
}

// 서버 처리:
// 1. 프로젝트 확정 견적서 품목 → 거래명세서 품목 자동 채움
// 2. DS 번호 자동 채번
// 3. 금액 자동 계산
```

---

## 8. SingleTransaction (단건 거래)

| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/single-transactions` | 단건 거래 목록 | ALL (필터링) |
| POST | `/api/single-transactions` | 단건 거래 등록 | ADMIN, MANAGER |
| PUT | `/api/single-transactions/:id` | 단건 거래 수정 | ADMIN, MANAGER |
| DELETE | `/api/single-transactions/:id` | 단건 거래 삭제 | ADMIN |

### GET `/api/single-transactions`

쿼리 파라미터:

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `direction` | string | SALES \| PURCHASE |
| `counterpartId` | string | 거래처 |
| `dateFrom` | date | 거래일 범위 |
| `dateTo` | date | 거래일 범위 |

---

## 9. Reports (리포트/집계)

| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/reports/summary` | 종합 요약 (대시보드용) | ALL |
| GET | `/api/reports/monthly` | 월별 매출/매입 추이 | ADMIN, MANAGER, ACCOUNTANT |
| GET | `/api/reports/by-counterpart` | 거래처별 집계 | ADMIN, MANAGER, ACCOUNTANT |
| GET | `/api/reports/by-project` | 프로젝트별 수익 | ADMIN, MANAGER, ACCOUNTANT |
| GET | `/api/reports/export` | Excel 다운로드 | ADMIN, MANAGER, ACCOUNTANT |

### GET `/api/reports/summary`

대시보드 통계 카드용.

```json
// Query: ?year=2026&month=3

// Response
{
  "success": true,
  "data": {
    "activeProjects": 12,
    "activeProjectsDelta": 3,               // vs 전월
    "monthlySales": 45200000,
    "monthlySalesDelta": 12.5,              // %
    "monthlyPurchase": 32100000,
    "monthlyPurchaseDelta": -3.2,
    "profitRate": 28.9,
    "profitRateDelta": 2.1,
    "recentProjects": [ ... ],              // 최근 5건
    "pendingActions": [ ... ]               // 할 일 목록
  }
}
```

### GET `/api/reports/monthly`

```json
// Query: ?year=2026

// Response
{
  "success": true,
  "data": [
    { "month": 1, "sales": 38000000, "purchase": 28000000, "profit": 10000000, "profitRate": 26.3, "projectCount": 8 },
    { "month": 2, "sales": 42000000, "purchase": 31000000, "profit": 11000000, "profitRate": 26.2, "projectCount": 10 },
    { "month": 3, "sales": 45200000, "purchase": 32100000, "profit": 13100000, "profitRate": 29.0, "projectCount": 12 }
  ]
}
```

---

## 10. ProjectAttachment (첨부 문서)

| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/projects/:projectId/attachments` | 첨부 목록 | ALL |
| POST | `/api/projects/:projectId/attachments` | 파일 업로드 | ADMIN, MANAGER, EMPLOYEE |
| DELETE | `/api/attachments/:id` | 파일 삭제 | ADMIN, MANAGER |
| GET | `/api/attachments/:id/download` | 파일 다운로드 | ALL |

### POST `/api/projects/:projectId/attachments`

```
Content-Type: multipart/form-data

file: <File>
docType: "COA"                    // COA | MSDS | IMPORT_CERT | LICENSE | CONTRACT | OTHER
docTypeLabel: ""                  // OTHER인 경우 사용자 지정 라벨
```

---

## 11. ProjectMemo (메모/히스토리)

| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/projects/:projectId/memos` | 메모 목록 | ALL |
| POST | `/api/projects/:projectId/memos` | 메모 작성 | ALL |
| DELETE | `/api/memos/:id` | 메모 삭제 | ADMIN, 작성자 |

시스템 메모 (`type: "SYSTEM"`)는 자동 생성:
- 단계 변경 시: "단계가 '견적 진행'에서 '수주 확정'으로 변경되었습니다"
- 견적서 확정 시: "매출 견적서 Q-2026-001 (Rev.2)이 확정되었습니다"
- 메일 발송 시: "견적서가 kim@a-company.com으로 발송되었습니다"

---

## 12. ReceivedMail (IMAP 자동 수집)

| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/received-mails` | 수신 메일 목록 | ADMIN, MANAGER |
| GET | `/api/received-mails/:id` | 수신 메일 상세 | ADMIN, MANAGER |
| POST | `/api/received-mails/:id/register` | 견적서로 등록 | ADMIN, MANAGER |
| POST | `/api/received-mails/:id/ignore` | 무시 처리 | ADMIN, MANAGER |
| POST | `/api/received-mails/poll` | 수동 폴링 (즉시) | ADMIN |

### POST `/api/received-mails/:id/register`

수신 메일 → 매입 견적서 변환.

```json
// Request
{
  "projectId": "...",               // 연결할 프로젝트
  "counterpartId": "...",           // 거래처 (자동 매칭 or 수동)
  "items": [                        // 품목 (수기 입력)
    { "name": "분석장비A", "quantity": 2, "unitPrice": 3500000, "taxRate": 10 }
  ]
}

// 서버 처리:
// 1. Quotation 생성 (direction: PURCHASE, receivedMailId 연결)
// 2. 첨부파일 → ProjectAttachment
// 3. ReceivedMail.status → REGISTERED
```

### IMAP 폴링 (서버 내부 — cron/interval)

```
5분마다 자동 실행:
1. OurCompany 중 imapEnabled=true 인 회사 조회
2. IMAP 연결 → 설정된 폴더 조회
3. 새 메일 감지 (messageId 중복 체크)
4. 첨부파일 다운로드 → 파일 서버 보관
5. ReceivedMail 레코드 생성
6. 발신자 이메일 → Company 자동 매칭
7. 담당자에게 Notification 발송
```

---

## 13. Notification (알림)

| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/notifications` | 내 알림 목록 | 로그인 |
| GET | `/api/notifications/unread-count` | 미읽음 건수 | 로그인 |
| PUT | `/api/notifications/:id/read` | 읽음 처리 | 로그인 |
| PUT | `/api/notifications/read-all` | 전체 읽음 | 로그인 |

### GET `/api/notifications`

```json
// Query: ?unreadOnly=true&limit=10

// Response
{
  "success": true,
  "data": [
    {
      "id": "...",
      "type": "MAIL_RECEIVED",
      "title": "B사에서 새 견적서가 수신되었습니다",
      "message": "A사 장비 납품 프로젝트",
      "linkType": "PROJECT",
      "linkId": "...",
      "isRead": false,
      "createdAt": "2026-03-18T14:32:00Z"
    }
  ]
}
```

---

## 14. NumberSequence (채번)

내부 사용 — 별도 API 없음. 서버 내부에서 자동 처리.

```typescript
// 서비스 내부 함수
async function getNextNumber(ourCompanyId: string, docType: string): Promise<string> {
  const year = new Date().getFullYear();
  const company = await prisma.ourCompany.findUnique({ where: { id: ourCompanyId } });

  // 트랜잭션으로 시퀀스 증가 (동시성 안전)
  const seq = await prisma.numberSequence.upsert({
    where: { ourCompanyId_docType_year: { ourCompanyId, docType, year } },
    update: { lastNumber: { increment: 1 } },
    create: { ourCompanyId, docType, year, lastNumber: 1 },
  });

  const prefix = docType === 'QUOTATION' ? company.quotationPrefix
               : docType === 'PURCHASE_ORDER' ? company.poPrefix
               : company.dsPrefix;

  return `${prefix}-${year}-${String(seq.lastNumber).padStart(3, '0')}`;
  // Q-2026-001, PO-2026-001, DS-2026-001
}
```

---

## 15. Bulk Upload (엑셀 일괄 업로드)

| Method | Path | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/bulk/template` | 업로드 양식 다운로드 | ADMIN |
| POST | `/api/bulk/validate` | 업로드 데이터 검증 | ADMIN |
| POST | `/api/bulk/import` | 검증 통과 데이터 일괄 등록 | ADMIN |

### POST `/api/bulk/validate`

```
Content-Type: multipart/form-data
file: <Excel File>

// Response
{
  "success": true,
  "data": {
    "total": 20,
    "valid": 18,
    "errors": 2,
    "rows": [
      { "row": 1, "status": "valid", "data": { "name": "A사 장비납품", ... } },
      { "row": 3, "status": "error", "errors": ["프로젝트명 누락"] },
      ...
    ]
  }
}
```

### POST `/api/bulk/import`

```json
// Request
{
  "rows": [1, 2, 4, 5, ...],       // 등록할 행 번호 (검증 통과 건)
  "skipErrors": true
}
```

---

## 16. 기존 v1 API (유지)

변경 없이 그대로 이관하는 API:

| 모듈 | 경로 | 비고 |
|------|------|------|
| 인증 | `/api/auth/*` | login, refresh, logout, profile |
| 휴가 | `/api/leaves/*` | CRUD + 승인 |
| 결재 | `/api/approvals/*` | CRUD + 결재 흐름 |
| 캘린더 | `/api/calendar/*` | CRUD (v2에서 결제마감일 자동등록 추가) |
| 회의록 | `/api/meetings/*` | CRUD |
| 건의 | `/api/suggestions/*` | CRUD |
| DB조회 | `/api/companies/*`, `/api/it-assets/*`, `/api/ip-entries/*` | 조회 |
| 법인카드 | `/api/expenses/*` | CRUD |

### v2에서 캘린더 API 확장

```
// 기존 유지
GET/POST/PUT/DELETE /api/calendar/*

// v2 추가: 결제 마감일 자동 등록 (내부에서 호출)
// 견적서 확정 시 서버 내부에서 CalendarEvent 자동 생성
// eventType: "PAYMENT_DUE"
// 별도 API 불필요 — 견적서 confirm 액션에 포함
```

---

## 미들웨어 설계

### 인증 미들웨어 (`authMiddleware`)

```
1. JWT 검증
2. Employee 조회
3. req.user = { id, role, ourCompanyId, ... }
```

### 회사 컨텍스트 미들웨어 (`companyContextMiddleware`)

```
1. x-company-id 헤더 확인
2. ADMIN: 헤더 값 사용 (all 가능)
3. ACCOUNTANT: 헤더 값 사용 (all 불가)
4. MANAGER/EMPLOYEE: 소속 회사 강제
5. req.companyFilter = { ourCompanyId } 또는 {} (all)
```

### RBAC 미들웨어 (`requireRole(...roles)`)

```typescript
// 사용 예
router.post('/projects', authMiddleware, companyContextMiddleware, requireRole('ADMIN', 'MANAGER'), createProject);
router.get('/projects', authMiddleware, companyContextMiddleware, listProjects);  // 내부에서 역할별 필터
```

### 소유권 필터 (`ownershipFilter`)

```
EMPLOYEE: 본인 담당 프로젝트/견적서만 조회
  → WHERE managerId = req.user.id (프로젝트)
  → WHERE authorId = req.user.id OR project.managerId = req.user.id (견적서)

MANAGER: 본인 회사 전체
  → WHERE ourCompanyId = req.user.ourCompanyId

ACCOUNTANT: 양쪽 회사 조회, 수정 불가
  → WHERE 없음 (전체), 단 PUT/DELETE 차단

ADMIN: 전체
  → WHERE 없음
```

---

## 엔드포인트 총 수

| 카테고리 | 엔드포인트 수 |
|----------|-------------|
| OurCompany | 7 |
| Project | 8 |
| Quotation | 14 |
| PurchaseOrder | 6 |
| Invoice | 4 |
| CreditNote | 3 |
| TransactionStatement | 5 |
| SingleTransaction | 4 |
| Reports | 5 |
| ProjectAttachment | 4 |
| ProjectMemo | 3 |
| ReceivedMail | 5 |
| Notification | 4 |
| BulkUpload | 3 |
| **v2 신규 합계** | **75** |
| v1 유지 (인증,휴가,결재 등) | ~40 |
| **전체** | **~115** |
