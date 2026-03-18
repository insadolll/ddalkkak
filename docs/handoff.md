# DDalKKak v2 — 세션 이어하기 가이드

> 작성일: 2026-03-18
> 이전 세션에서 Phase 1~5 + 버그픽스 완료

## 현재 상태

### 접속 정보
- URL: https://officev2.hubiocem.com
- Admin: admin@hubiocem.com / Admin1234!
- 전체 직원: Ddalkkak2026! (기본 비밀번호)

### 서버
- Express port 3001, PM2 `ddalkkak-server`
- PostgreSQL: ddalkkak@127.0.0.1:5432/ddalkkak (pw: ddalkkak2026)
- 빌드: `cd /home/ddalkkak/server && npm run build`
- 클라이언트: `cd /home/ddalkkak/client && npx vite build`
- 배포: `pm2 stop ddalkkak-server && sleep 2 && pm2 start ddalkkak-server`
- Git: `github.com/insadolll/ddalkkak` (main)

### 코드 구조
```
server/src/
  index.ts              — 라우트 등록 (trust proxy, rate-limit 1000)
  middleware/            — auth, rbac, company-context
  modules/
    auth/               — login, logout, refresh, password, me
    our-company/        — HUBIOCEM/BTMS 회사 관리
    company/            — 거래처 CRUD + data.go.kr lookup
    employee/           — 직원 CRUD (smtpPassword 암호화)
    department/         — 부서 CRUD
    project/            — CRUD + stage + bulk-upload
    quotation/          — CRUD + confirm/void/revision + excel/pdf/mail
    purchase-order/     — 견적서→발주서 변환
    single-transaction/ — 단건 거래
    invoice/            — 계산서 상태 + CreditNote
    report/             — summary, monthly
    leave/              — 휴가
    approval/           — 전자결재
    calendar/           — 캘린더
    meeting/            — 업무회의
    suggestion/         — 건의게시판
  utils/
    prisma.ts, jwt.ts, response.ts, tax.ts
    number-sequence.ts  — 자동 채번
    mailer.ts           — per-employee SMTP
    crypto.ts           — AES-256-GCM 암호화
    excel-generator.ts  — 엑셀 양식 채우기
    pdf-generator.ts    — PDFKit 견적서 PDF

client/src/
  services/api.ts       — Axios + interceptors
  hooks/useAuth.ts      — AuthContext + selectedCompanyId
  components/
    Layout.tsx           — 사이드바 + 헤더
    ProtectedRoute.tsx
    QuotationDropZone.tsx — dnd-kit
    CompanyLookupModal.tsx — data.go.kr
  features/
    auth/                — LoginPage
    dashboard/           — DashboardPage (실데이터)
    project/             — List, Detail, FormModal
    quotation/           — List, Detail, FormModal, SendMailModal
    company/             — CompanyListPage (카드 + 상세 모달)
    accounting/          — AccountingPage + SingleTransactionFormModal
    settings/            — EmployeeList, EmployeeForm, DepartmentPage
    calendar/            — CalendarPage, CalendarFormModal
    leave/               — LeavePage, LeaveFormModal
    approval/            — ApprovalPage, ApprovalFormModal
    meeting/             — MeetingPage
    suggestion/          — SuggestionPage, SuggestionFormModal
```

### DB
- 42 테이블, Prisma ORM
- 스키마: server/prisma/schema.prisma
- 마이그레이션: `cd server && npx prisma migrate dev --name xxx`

### 남은 이슈 (우선순위)
1. 견적서 수정 폼 연결 (existing prop 전달)
2. 매입매출 실사용 테스트
3. 사내DB 페이지
4. SMTP 실테스트
5. 로컬 폴더 감시 (IMAP 대안)
6. v1 프론트 모듈 실사용 테스트

### 주의사항
- 빌드 후 반드시 PM2 재시작 (stop → 2초 대기 → start)
- `npx vite build`는 반드시 `/home/ddalkkak/client`에서 실행
- `npm run build`는 `/home/ddalkkak/server`에서 실행
- 비밀번호 저장은 AES-256 암호화 (crypto.ts)
- 세액 = Math.floor(공급가액 × 세율/100)
- 회사 하드코딩 금지 (DB 기반)
