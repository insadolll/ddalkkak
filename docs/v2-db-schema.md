# 딸깍(DDalKKak) v2 — DB 스키마 설계

> 작성일: 2026-03-18
> 상태: 초안
> DB: PostgreSQL (처음부터), Prisma ORM
> 참조: v2-sales-quotation-spec.md (업무 프로세스), v1 schema.prisma (참고)

---

## 설계 원칙

1. **회사 하드코딩 금지** → `OurCompany` 테이블 기반
2. **세율 가변** → 품목별 `taxRate` 필드, 기본값 10
3. **세액 = Math.floor(공급가액 × 세율/100)** — 합계 기준 1회 계산
4. **견적서 풀 개념** → 프로젝트에 매입/매출 견적서 다수 연결, 확정 플래그
5. **수정계산서** → Invoice에 연결된 CreditNote 별도 모델
6. **v1 유지 모델** → Employee, Department, Leave, Approval, Calendar, Meeting, Suggestion, ITAsset, Expense, AuditLog 등은 v1 그대로 이관 (변경 최소화)

---

## 모델 관계 개요

```
OurCompany (우리 회사: HUBIOCEM, BTMS)
    │
    ├── Employee (소속)
    ├── Project (소유)
    ├── Quotation (발행 주체)
    ├── Invoice (계산서)
    └── QuotationNumberSeq (견적번호 채번)

Company (거래처: 고객사, 매입처)
    │
    ├── CompanyContact (담당자)
    └── Project (고객사/매입처로 연결)

Project (프로젝트)
    │
    ├── Quotation[] (견적서 풀 — 매입/매출)
    ├── PurchaseOrder[] (발주서)
    ├── ProjectAttachment[] (첨부 문서)
    ├── Invoice[] (계산서)
    ├── TransactionStatement[] (거래명세서)
    ├── ProjectMemo[] (메모/히스토리)
    └── CalendarEvent (결제 마감일 연동)

Quotation (견적서)
    │
    ├── QuotationItem[] (품목)
    ├── QuotationRevision[] (리비전 이력)
    ├── PurchaseOrder? (발주서 변환)
    └── Quotation? (매입→매출 출처 연결)

Invoice (계산서)
    │
    └── CreditNote[] (수정계산서)

SingleTransaction (단건 거래 — 프로젝트 없음)

ReceivedMail (IMAP 자동 수집)

Notification (인앱 알림)
```

---

## 신규/변경 모델 상세

### OurCompany (우리 회사)

v1의 하드코딩된 `company: "HUBIOCEM" | "BTMS"` 를 테이블로 전환.

```prisma
model OurCompany {
  id               String   @id @default(cuid())
  code             String   @unique        // "HUBIOCEM", "BTMS"
  name             String                  // "휴바이오켐", "BTM서비스"
  nameEn           String?                 // "HUBIOCEM Co., Ltd."
  bizNumber        String?                 // 사업자등록번호
  representative   String?                 // 대표자
  address          String?
  phone            String?
  fax              String?
  email            String?                 // 대표 메일
  domain           String?                 // 메일 도메인 (hubiocem.com, btms.co.kr 등)
  logoPath         String?                 // 로고 이미지 경로
  stampPath        String?                 // 직인 이미지 경로

  // SMTP 메일 발송 설정 (회사별 도메인 → 발송 메일 다름)
  smtpHost         String?                 // smtp.office365.com
  smtpPort         Int?     @default(587)
  smtpUser         String?                 // 발송 계정 (noreply@hubiocem.com 등)
  smtpPassword     String?                 // 앱 비밀번호 (암호화 저장)
  smtpFromName     String?                 // 발신자 표시명 ("휴바이오켐")

  // 견적서 양식 설정
  quotationPrefix  String   @default("Q")  // 견적번호 접두사: Q, HB 등
  poPrefix         String   @default("PO") // 발주서 접두사
  dsPrefix         String   @default("DS") // 거래명세서 접두사

  // IMAP 메일 수집 설정
  imapHost         String?                 // outlook.office365.com
  imapPort         Int?     @default(993)
  imapUser         String?                 // 메일 계정
  imapPassword     String?                 // 앱 비밀번호 (암호화 저장)
  imapFolder       String?  @default("견적수신") // 모니터링 폴더
  imapEnabled      Boolean  @default(false)

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  employees          Employee[]
  projects           Project[]
  quotations         Quotation[]
  purchaseOrders     PurchaseOrder[]
  invoices           Invoice[]
  singleTransactions SingleTransaction[]
  numberSequences    NumberSequence[]
  receivedMails      ReceivedMail[]

  @@map("our_companies")
}
```

### Employee 변경점

v1 `company String` → v2 `ourCompanyId` FK로 변경.
v1 `role: "ADMIN" | "MANAGER" | "EMPLOYEE"` → v2 `"ADMIN" | "MANAGER" | "ACCOUNTANT" | "EMPLOYEE"` 추가.

```prisma
// v2 변경 부분만 표시 (나머지 v1 그대로)
model Employee {
  // ... v1 필드 유지 ...

  // 변경: company String → ourCompanyId FK
  ourCompanyId String
  ourCompany   OurCompany @relation(fields: [ourCompanyId], references: [id])

  // 변경: role에 ACCOUNTANT 추가
  role         String     @default("EMPLOYEE") // ADMIN | MANAGER | ACCOUNTANT | EMPLOYEE

  // v2 신규 관계
  managedProjects    Project[]          @relation("ProjectManager")
  createdQuotations  Quotation[]        @relation("QuotationCreator")
  authoredQuotations Quotation[]        @relation("QuotationAuthor")
  revisionAuthors    QuotationRevision[] @relation("RevisionAuthor")
  notifications      Notification[]
  projectMemos       ProjectMemo[]

  @@index([ourCompanyId])
}
```

### NumberSequence (자동 채번)

회사별, 문서 유형별 번호 시퀀스. 견적번호, 발주번호, 거래명세서 번호 등.

```prisma
model NumberSequence {
  id           String @id @default(cuid())
  ourCompanyId String
  docType      String // QUOTATION | PURCHASE_ORDER | TRANSACTION_STATEMENT | INVOICE
  year         Int    // 2026
  lastNumber   Int    @default(0)

  ourCompany OurCompany @relation(fields: [ourCompanyId], references: [id])

  @@unique([ourCompanyId, docType, year])
  @@map("number_sequences")
}
```

생성 로직:
```
Q-2026-001  → OurCompany.quotationPrefix + year + padded sequence
PO-2026-001 → OurCompany.poPrefix + year + padded sequence
```

---

### Project (프로젝트)

v1 `SalesProject` → v2 `Project`로 이름 변경 + 구조 개선.

```prisma
model Project {
  id            String    @id @default(cuid())
  ourCompanyId  String                            // 소속 회사
  name          String                            // 프로젝트명

  // 거래처
  clientId      String?                           // 고객사 (Company)
  supplierId    String?                           // 주 매입처 (Company) — 복수 매입처는 견적서로 관리

  // 담당/관리
  managerId     String?                           // 프로젝트 담당자 (Employee)

  // 기간
  startDate     DateTime?
  endDate       DateTime?                         // 예상 종료일

  // 상태 & 단계
  status        String    @default("ACTIVE")      // ACTIVE | ON_HOLD | COMPLETED | CANCELLED
  stage         String    @default("SETUP")       // SETUP | QUOTE_RECEIVED | QUOTE_SENT | ORDER_CONFIRMED | DELIVERY | INVOICE | DONE

  // 확정 금액 (견적서 확정 시 자동 갱신)
  confirmedSalesAmount    Int @default(0)          // 확정 매출 공급가액
  confirmedSalesTax       Int @default(0)          // 확정 매출 세액
  confirmedPurchaseAmount Int @default(0)          // 확정 매입 공급가액
  confirmedPurchaseTax    Int @default(0)          // 확정 매입 세액

  memo          String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  ourCompany    OurCompany @relation(fields: [ourCompanyId], references: [id])
  client        Company?   @relation("ProjectClient", fields: [clientId], references: [id])
  supplier      Company?   @relation("ProjectSupplier", fields: [supplierId], references: [id])
  manager       Employee?  @relation("ProjectManager", fields: [managerId], references: [id])

  quotations            Quotation[]
  purchaseOrders        PurchaseOrder[]
  attachments           ProjectAttachment[]
  invoices              Invoice[]
  transactionStatements TransactionStatement[]
  memos                 ProjectMemo[]

  @@index([ourCompanyId])
  @@index([clientId])
  @@index([supplierId])
  @@index([managerId])
  @@index([status])
  @@index([stage])
  @@map("projects")
}
```

#### 단계(stage) 정의

| stage | 의미 | 타임라인 위치 |
|-------|------|-------------|
| `SETUP` | 프로젝트 수립 | 1 |
| `QUOTE_RECEIVED` | 매입 견적서 수령 | 2 |
| `QUOTE_SENT` | 매출 견적서 발송 | 3 |
| `ORDER_CONFIRMED` | 수주 확정 | 4 |
| `DELIVERY` | 납품/발주 진행 | 5 |
| `INVOICE` | 계산서 처리 | 6 |
| `DONE` | 완료 | 7 |

- 단계는 자동 진행되지 않음 — 사용자가 명시적으로 변경
- 단계 역행 가능 (예: 수주 확정 후 다시 견적 진행으로)

---

### Quotation (견적서)

매출/매입 통합 모델. v1 대비 `direction` 추가, 풀 개념 반영.

```prisma
model Quotation {
  id              String    @id @default(cuid())
  ourCompanyId    String                            // 발행/수신 주체 (우리 회사)
  projectId       String?                           // 연결 프로젝트 (null = 독립 견적서)

  // 견적서 식별
  quotationNo     String    @unique                 // Q-2026-001, 매입은 외부번호 or 자동채번
  direction       String                            // SALES | PURCHASE
  docType         String    @default("QUOTATION")   // QUOTATION | PURCHASE_ORDER (발주서 변환 시)

  // 기본 정보
  title           String?                           // 견적서 제목
  quotationDate   DateTime?                         // 견적일자
  validUntil      DateTime?                         // 유효기간
  paymentTerms    String?                           // 결제조건 ("납품 후 30일" 등)

  // 거래처 (상대방)
  counterpartId   String?                           // 거래처 (Company)
  contactName     String?                           // 담당자명
  contactPhone    String?
  contactEmail    String?

  // 작성자 (우리측)
  authorId        String?                           // 작성자 (Employee)
  authorName      String?                           // 스냅샷 (퇴사 대비)
  authorPosition  String?
  authorPhone     String?
  authorEmail     String?

  // 금액 (합계 — 품목에서 자동 집계)
  supplyAmount    Int       @default(0)             // 공급가액
  taxAmount       Int       @default(0)             // 세액 = Math.floor(supplyAmount * taxRate / 100)
  totalAmount     Int       @default(0)             // 합계 = 공급가액 + 세액
  defaultTaxRate  Float     @default(10)            // 기본 세율 (%)

  // 리비전
  revision        Int       @default(0)             // 현재 리비전 번호

  // 상태
  status          String    @default("DRAFT")       // DRAFT | SENT | CONFIRMED | VOID
  isConfirmed     Boolean   @default(false)         // 프로젝트 풀에서 확정 여부
  confirmedAt     DateTime?

  // 매입→매출 출처 추적
  sourceQuotationId String?                         // 매입 견적서 ID (자동 생성 시)
  marginRate        Float?                          // 마진율 (%)

  // 메일 발송 이력
  lastSentAt      DateTime?
  sentCount       Int       @default(0)

  // 매입 견적서 전용: 원본 파일
  originalFilePath String?                          // 매입처 원본 견적서 파일 경로

  // IMAP 수집 연결
  receivedMailId  String?                           // ReceivedMail ID (자동 수집된 경우)

  // 생성자
  createdById     String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  ourCompany       OurCompany  @relation(fields: [ourCompanyId], references: [id])
  project          Project?    @relation(fields: [projectId], references: [id])
  counterpart      Company?    @relation("QuotationCounterpart", fields: [counterpartId], references: [id])
  author           Employee?   @relation("QuotationAuthor", fields: [authorId], references: [id])
  sourceQuotation  Quotation?  @relation("QuotationSource", fields: [sourceQuotationId], references: [id])
  derivedQuotations Quotation[] @relation("QuotationSource")
  createdBy        Employee?   @relation("QuotationCreator", fields: [createdById], references: [id])
  receivedMail     ReceivedMail? @relation(fields: [receivedMailId], references: [id])

  items            QuotationItem[]
  revisions        QuotationRevision[]
  purchaseOrder    PurchaseOrder?       @relation("POFromQuotation")
  invoices         Invoice[]            @relation("InvoiceQuotation")

  @@index([ourCompanyId])
  @@index([projectId])
  @@index([direction])
  @@index([status])
  @@index([isConfirmed])
  @@index([counterpartId])
  @@index([quotationDate])
  @@index([sourceQuotationId])
  @@map("quotations")
}
```

### QuotationItem (견적서 품목)

```prisma
model QuotationItem {
  id           String   @id @default(cuid())
  quotationId  String
  sortOrder    Int      @default(0)

  name         String                    // 품명
  spec         String?                   // 규격/모델
  unit         String?                   // 단위 (EA, SET, BOX 등)
  quantity     Int      @default(1)      // 수량
  unitPrice    Int      @default(0)      // 단가
  amount       Int      @default(0)      // 금액 = 수량 × 단가
  taxRate      Float    @default(10)     // 세율 (%) — 면세 품목은 0
  remark       String?                   // 비고

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  quotation Quotation @relation(fields: [quotationId], references: [id], onDelete: Cascade)

  @@index([quotationId])
  @@map("quotation_items")
}
```

### QuotationRevision (리비전 이력)

```prisma
model QuotationRevision {
  id           String   @id @default(cuid())
  quotationId  String
  revision     Int                        // 리비전 번호 (0, 1, 2...)

  snapshot     String                     // JSON: 해당 시점의 전체 견적서 데이터
  changeNote   String?                    // 변경 사유 ("단가 변경", "품목 추가" 등)
  changedById  String?
  createdAt    DateTime @default(now())

  quotation Quotation @relation(fields: [quotationId], references: [id], onDelete: Cascade)
  changedBy Employee? @relation("RevisionAuthor", fields: [changedById], references: [id])

  @@unique([quotationId, revision])
  @@index([quotationId])
  @@map("quotation_revisions")
}
```

---

### PurchaseOrder (발주서)

견적서에서 변환된 발주서. 독립 모델로 분리 (docType 전환 대신).

```prisma
model PurchaseOrder {
  id              String    @id @default(cuid())
  ourCompanyId    String
  projectId       String?
  poNo            String    @unique               // PO-2026-001

  // 출처 견적서
  sourceQuotationId String?  @unique              // 원본 견적서 (1:1)

  // 수신처 (매입처)
  supplierId      String?
  contactName     String?
  contactEmail    String?

  // 납품 정보
  deliveryDate    DateTime?                       // 납품 요청일
  deliveryPlace   String?                         // 납품 장소

  // 금액 (견적서에서 복사)
  supplyAmount    Int       @default(0)
  taxAmount       Int       @default(0)
  totalAmount     Int       @default(0)

  // 상태
  status          String    @default("DRAFT")     // DRAFT | SENT | ACKNOWLEDGED
  sentAt          DateTime?

  memo            String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  ourCompany       OurCompany @relation(fields: [ourCompanyId], references: [id])
  project          Project?   @relation(fields: [projectId], references: [id])
  sourceQuotation  Quotation? @relation("POFromQuotation", fields: [sourceQuotationId], references: [id])
  supplier         Company?   @relation("POSupplier", fields: [supplierId], references: [id])

  items            PurchaseOrderItem[]

  @@index([ourCompanyId])
  @@index([projectId])
  @@index([supplierId])
  @@index([status])
  @@map("purchase_orders")
}

model PurchaseOrderItem {
  id              String @id @default(cuid())
  purchaseOrderId String
  sortOrder       Int    @default(0)

  name            String
  spec            String?
  unit            String?
  quantity        Int    @default(1)
  unitPrice       Int    @default(0)
  amount          Int    @default(0)
  taxRate         Float  @default(10)
  remark          String?

  purchaseOrder PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)

  @@index([purchaseOrderId])
  @@map("purchase_order_items")
}
```

---

### Invoice (계산서 — 상태 추적)

실제 발행은 외부(홈택스/더존). 딸깍은 상태 관리만.

```prisma
model Invoice {
  id             String    @id @default(cuid())
  ourCompanyId   String
  projectId      String?
  invoiceNo      String?                           // 외부 세금계산서 번호 (수기 입력)

  // 유형
  direction      String                            // SALES | PURCHASE

  // 연결
  quotationId    String?                           // 관련 견적서

  // 거래처
  counterpartId  String?

  // 금액
  supplyAmount   Int       @default(0)
  taxAmount      Int       @default(0)
  totalAmount    Int       @default(0)

  // 상태
  status         String    @default("NOT_ISSUED")  // NOT_ISSUED | REQUESTED | ISSUED | PAID
  requestedAt    DateTime?                         // 경영지원에게 요청한 시점
  issuedAt       DateTime?                         // 발행 확인 시점
  paidAt         DateTime?                         // 입금/지급 확인 시점

  // 결제 일정
  dueDate        DateTime?                         // 결제 마감일
  calendarEventId String?                          // 캘린더 자동 등록 ID

  // 요청/처리
  requestedById  String?                           // 요청자 (담당자)
  processedById  String?                           // 처리자 (경영지원)

  memo           String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  ourCompany    OurCompany @relation(fields: [ourCompanyId], references: [id])
  project       Project?   @relation(fields: [projectId], references: [id])
  quotation     Quotation? @relation("InvoiceQuotation", fields: [quotationId], references: [id])
  counterpart   Company?   @relation("InvoiceCounterpart", fields: [counterpartId], references: [id])

  creditNotes   CreditNote[]

  @@index([ourCompanyId])
  @@index([projectId])
  @@index([direction])
  @@index([status])
  @@index([dueDate])
  @@index([counterpartId])
  @@map("invoices")
}
```

### CreditNote (수정계산서)

원본 Invoice에 연결된 마이너스 계산서.

```prisma
model CreditNote {
  id            String    @id @default(cuid())
  invoiceId     String                              // 원본 계산서
  creditNoteNo  String?                             // 수정계산서 번호 (INV-2026-001-C1)

  // 사유
  reason        String                              // CONTRACT_CHANGE | RETURN | PRICE_ADJUST | ERROR_CORRECTION | OTHER
  reasonDetail  String?                             // 상세 사유

  // 수정 금액 (음수)
  supplyAmount  Int       @default(0)               // 수정 공급가액 (음수)
  taxAmount     Int       @default(0)               // 수정 세액 (음수)
  totalAmount   Int       @default(0)               // 수정 합계 (음수)

  // 상태
  status        String    @default("NOT_ISSUED")    // NOT_ISSUED | REQUESTED | ISSUED
  issuedAt      DateTime?

  memo          String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  invoice Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  @@index([invoiceId])
  @@map("credit_notes")
}
```

실질 금액 계산:
```
실질 매출 = Invoice.totalAmount + SUM(CreditNote.totalAmount)
         = 16,500,000 + (-1,100,000) = 15,400,000
```

---

### TransactionStatement (거래명세서)

프로젝트 데이터 기반 자동 완성 → PDF/메일 발송.

```prisma
model TransactionStatement {
  id             String    @id @default(cuid())
  ourCompanyId   String
  projectId      String?
  statementNo    String    @unique                 // DS-2026-001

  // 거래처
  counterpartId  String?
  contactName    String?

  // 금액
  supplyAmount   Int       @default(0)
  taxAmount      Int       @default(0)
  totalAmount    Int       @default(0)

  // 발행 정보
  issueDate      DateTime?

  // 메일 발송
  lastSentAt     DateTime?

  memo           String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  ourCompany  OurCompany @relation(fields: [ourCompanyId], references: [id])
  project     Project?   @relation(fields: [projectId], references: [id])
  counterpart Company?   @relation("StatementCounterpart", fields: [counterpartId], references: [id])

  items       TransactionStatementItem[]

  @@index([ourCompanyId])
  @@index([projectId])
  @@index([counterpartId])
  @@map("transaction_statements")
}

model TransactionStatementItem {
  id            String @id @default(cuid())
  statementId   String
  sortOrder     Int    @default(0)

  name          String
  spec          String?
  unit          String?
  quantity      Int    @default(1)
  unitPrice     Int    @default(0)
  amount        Int    @default(0)
  remark        String?

  statement TransactionStatement @relation(fields: [statementId], references: [id], onDelete: Cascade)

  @@index([statementId])
  @@map("transaction_statement_items")
}
```

---

### SingleTransaction (단건 거래)

프로젝트 없이 단순 매입/매출. v1의 `SalesTransaction(projectId=null)` 역할.

```prisma
model SingleTransaction {
  id             String    @id @default(cuid())
  ourCompanyId   String
  direction      String                           // SALES | PURCHASE

  counterpartId  String?                          // 거래처
  itemDesc       String                           // 품목 설명

  supplyAmount   Int                              // 공급가액
  taxRate        Float     @default(10)           // 세율 (%)
  taxAmount      Int                              // 세액
  totalAmount    Int                              // 합계

  tradeDate      DateTime                         // 거래일
  memo           String?
  attachmentPath String?                          // 증빙 파일

  createdById    String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  ourCompany  OurCompany @relation(fields: [ourCompanyId], references: [id])
  counterpart Company?   @relation("SingleTxCounterpart", fields: [counterpartId], references: [id])

  @@index([ourCompanyId])
  @@index([direction])
  @@index([tradeDate])
  @@index([counterpartId])
  @@map("single_transactions")
}
```

---

### ProjectAttachment (프로젝트 첨부 문서)

COA, MSDS, 인허가 서류 등 유형 태그 + 자유 첨부.

```prisma
model ProjectAttachment {
  id           String    @id @default(cuid())
  projectId    String

  fileName     String                             // 원본 파일명
  filePath     String                             // 서버 저장 경로
  fileSize     Int                                // bytes
  mimeType     String?                            // application/pdf 등

  docType      String    @default("OTHER")        // COA | MSDS | IMPORT_CERT | LICENSE | CONTRACT | OTHER
  docTypeLabel String?                            // 사용자 지정 라벨 (기타인 경우)

  uploadedById String?
  createdAt    DateTime  @default(now())

  project    Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@index([docType])
  @@map("project_attachments")
}
```

---

### ProjectMemo (프로젝트 메모/히스토리)

프로젝트 내 메모, 변경 이력, 코멘트.

```prisma
model ProjectMemo {
  id         String   @id @default(cuid())
  projectId  String
  authorId   String?

  type       String   @default("MEMO")            // MEMO | STAGE_CHANGE | SYSTEM
  content    String                               // 메모 내용 or 시스템 메시지

  createdAt  DateTime @default(now())

  project Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  author  Employee? @relation(fields: [authorId], references: [id])

  @@index([projectId])
  @@index([createdAt])
  @@map("project_memos")
}
```

---

### ReceivedMail (IMAP 자동 수집)

서버가 IMAP 폴링으로 수집한 메일 정보.

```prisma
model ReceivedMail {
  id             String    @id @default(cuid())
  ourCompanyId   String

  // 메일 메타정보
  messageId      String    @unique               // IMAP message ID (중복 방지)
  fromAddress    String                           // 발신자 이메일
  fromName       String?                          // 발신자 이름
  subject        String                           // 메일 제목
  receivedAt     DateTime                         // 수신 시각

  // 첨부 파일
  attachments    String?                          // JSON: [{name, path, size}]

  // 처리 상태
  status         String    @default("PENDING")    // PENDING | REGISTERED | IGNORED

  // 매칭
  matchedCompanyId String?                        // 발신자 → 거래처 자동 매칭

  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  ourCompany     OurCompany @relation(fields: [ourCompanyId], references: [id])
  matchedCompany Company?   @relation("MailSender", fields: [matchedCompanyId], references: [id])
  quotation      Quotation?                       // 등록된 견적서 (1:1)

  @@index([ourCompanyId])
  @@index([status])
  @@index([fromAddress])
  @@index([receivedAt])
  @@map("received_mails")
}
```

---

### Notification (인앱 알림)

```prisma
model Notification {
  id           String    @id @default(cuid())
  recipientId  String                              // 수신자

  type         String                              // MAIL_RECEIVED | QUOTATION_CONFIRMED | INVOICE_REQUESTED | PAYMENT_DUE | STAGE_CHANGED
  title        String
  message      String?

  // 링크
  linkType     String?                             // PROJECT | QUOTATION | INVOICE
  linkId       String?                             // 해당 리소스 ID

  isRead       Boolean   @default(false)
  readAt       DateTime?

  createdAt    DateTime  @default(now())

  recipient Employee @relation(fields: [recipientId], references: [id])

  @@index([recipientId])
  @@index([isRead])
  @@index([createdAt])
  @@map("notifications")
}
```

---

### Company (거래처) — v1 확장

v1 모델 유지 + v2 관계 추가.

```prisma
model Company {
  // ... v1 필드 그대로 유지 ...

  // v2 신규 관계 추가
  clientProjects       Project[]             @relation("ProjectClient")
  supplierProjects     Project[]             @relation("ProjectSupplier")
  quotationsReceived   Quotation[]           @relation("QuotationCounterpart")
  purchaseOrdersReceived PurchaseOrder[]     @relation("POSupplier")
  invoices             Invoice[]             @relation("InvoiceCounterpart")
  statements           TransactionStatement[] @relation("StatementCounterpart")
  singleTransactions   SingleTransaction[]   @relation("SingleTxCounterpart")
  receivedMails        ReceivedMail[]        @relation("MailSender")
}
```

---

## RBAC 권한 매트릭스

| 리소스 | ADMIN | MANAGER | ACCOUNTANT | EMPLOYEE |
|--------|-------|---------|------------|----------|
| 프로젝트 CRUD | 전체 | 본인 회사 | 조회만 (양쪽) | 본인 담당만 |
| 견적서 CRUD | 전체 | 본인 회사 | 조회만 (양쪽) | 본인 담당만 |
| 발주서 생성 | ✓ | ✓ | ✗ | ✗ |
| 계산서 상태변경 | ✓ | ✓ | ✓ (핵심 역할) | 요청만 |
| 수정계산서 발행 | ✓ | ✓ | ✓ | ✗ |
| 거래명세서 | ✓ | ✓ | 조회만 | 본인 담당만 |
| 단건 거래 등록 | ✓ | ✓ | 조회만 | ✗ |
| 리포트 조회 | 전체 | 본인 회사 | 양쪽 | ✗ |
| 회사 전환 | ✓ (+ 통합) | ✗ | ✓ | ✗ |
| 거래처 관리 | ✓ | ✓ | 조회만 | 조회만 |

---

## v1 → v2 모델 매핑

| v1 모델 | v2 모델 | 변경 |
|---------|---------|------|
| — | **OurCompany** | 신규 (회사 하드코딩 대체) |
| — | **NumberSequence** | 신규 (자동 채번) |
| SalesProject | **Project** | 이름 변경 + stage 추가 + 확정금액 |
| SalesTransaction | **SingleTransaction** | 단건 전용으로 분리 |
| Quotation | **Quotation** | direction, isConfirmed, sourceQuotationId 추가 |
| QuotationItem | **QuotationItem** | taxRate, spec, unit 추가, 불필요 필드 제거 |
| QuotationRevision | **QuotationRevision** | 거의 동일 |
| InvoiceRequest | **Invoice** | 상태 추적 모델로 확장 |
| — | **CreditNote** | 신규 (수정계산서) |
| — | **PurchaseOrder** | 신규 (발주서) |
| — | **PurchaseOrderItem** | 신규 |
| — | **TransactionStatement** | 신규 (거래명세서) |
| — | **TransactionStatementItem** | 신규 |
| — | **ProjectAttachment** | 신규 (ReceivedDocument 역할 흡수) |
| — | **ProjectMemo** | 신규 |
| — | **ReceivedMail** | 신규 (IMAP 수집) |
| — | **Notification** | 신규 |
| ReceivedDocument | 삭제 | ProjectAttachment + ReceivedMail로 분리 |
| Employee | Employee | company→ourCompanyId FK, ACCOUNTANT 역할 추가 |
| Company | Company | 관계 추가 |

---

## 인덱스 전략

### 복합 인덱스 (쿼리 성능)

```prisma
// 프로젝트 목록 (회사별 + 상태 필터)
@@index([ourCompanyId, status])

// 견적서 목록 (회사별 + 방향 + 상태)
@@index([ourCompanyId, direction, status])

// 프로젝트별 견적서 (풀 조회)
@@index([projectId, direction, isConfirmed])

// 계산서 마감 알림 (기한별)
@@index([dueDate, status])

// 단건 거래 (기간별 집계)
@@index([ourCompanyId, direction, tradeDate])
```

---

## 마이그레이션 참고

v2는 PostgreSQL 처음부터 사용하므로 SQLite→PG 마이그레이션 불필요.
v1 운영 데이터가 있는 경우 엑셀 일괄 업로드 기능(시나리오 10)으로 이관.

```
v2 초기 세팅 순서:
1. prisma migrate dev --name init
2. OurCompany 시드 데이터 (HUBIOCEM, BTMS)
3. Department 시드 데이터
4. Admin 계정 시드
5. 기존 거래처(Company) 데이터 이관 (v1 DB에서 export → v2 import)
```
