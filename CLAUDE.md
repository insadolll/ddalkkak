# 딸깍(DDalKKak) v2 — 사내 통합 관리 시스템

## 개요
- v1(OneDesk, /home/one-desk)에서 매입매출/견적서 모듈을 완전 재설계한 새 프로젝트
- 나머지 모듈(휴가, 결재, 캘린더, DB조회, 대시보드, 건의게시판, 회의록)은 v1에서 이관
- 15명/3팀, 테스트 후 프로덕션 전환

## 스택
- 프론트: React 18 + TypeScript + Tailwind CSS + Vite
- 백엔드: Node.js + Express + TypeScript
- DB: **PostgreSQL** (처음부터, SQLite 단계 없음), Prisma ORM
- 인증: JWT + bcrypt
- **무료/오픈소스만 사용 (MIT, Apache 2.0, ISC)**

## 인프라
- 서버: Ubuntu 24.04, 32GB RAM, PostgreSQL 16
- Express: port **3001** (v1은 3000)
- 외부접속: Cloudflare Tunnel → `officev2.hubiocem.com`
- nginx 사용 안 함 — Express가 API + 정적파일 서빙
- PM2: ddalkkak 계정으로 관리
- v1 참조: /home/one-desk (읽기만, 수정 금지)

## 설계 문서 (반드시 먼저 읽을 것)
- `docs/v2-sales-quotation-spec.md` — **마스터 설계서** (업무 프로세스, 멀티컴퍼니, 자동화)
- `docs/v2-db-schema.md` — DB 스키마 (14개 신규 모델, Prisma)
- `docs/v2-api-design.md` — API 설계 (75개 엔드포인트)
- `docs/v2-design-system.md` — 디자인 시스템 (컬러, 타이포, 컴포넌트, Glass효과)
- `docs/v2-wireframes.md` — 페이지별 와이어프레임 (8개 페이지)
- `docs/v2-quotation-card-design.md` — 견적서 카드 UI 상세 (3변형, 6상태, D&D)
- `docs/v2-screen-flows.md` — 화면 흐름 (12개 시나리오)

## 구조
- `client/src/features/{기능}/` — 프론트 기능별 모듈
- `server/src/modules/{기능}/` — 백엔드 기능별 모듈
- `server/src/middleware/` — 인증, RBAC, 회사컨텍스트
- `docs/` — 설계 문서

## 역할 (RBAC)
- ADMIN: 전체 관리, 양쪽 회사 + 통합 보기
- MANAGER: 본인 회사 프로젝트/견적서 관리
- ACCOUNTANT: 양쪽 회사 조회 + 계산서 상태 변경
- EMPLOYEE: 본인 담당 프로젝트만

## 멀티 컴퍼니
- HUBIOCEM, BTMS — DB 테이블(OurCompany) 기반, 하드코딩 금지
- 회사별 SMTP/IMAP 분리 (도메인별 발송 메일 다름)
- 회사별 견적번호 채번, 로고, 양식

## 에이전트 구성
- 리더 (메인): 설계서 기반 지시, 연동 조율
- 백엔드: Prisma, API, IMAP, PDF/Excel, 메일 — `server/`
- 프론트엔드: 페이지/컴포넌트, ui-ux-pro-max 스킬 사용 — `client/`
- 다른 팀 디렉토리 직접 수정 금지, 메시지로 요청

## 구현 순서 (설계서 참조)
Phase 1: 기반 — DB스키마 + 멀티컴퍼니 + 프로젝트 CRUD
Phase 2: 견적서 — CRUD + 리비전 + 카드UI + 풀→확정 + PDF/메일
Phase 3: 매입매출 — 확정기반 자동산출 + 단건 + 발주서
Phase 4: 자동화 — IMAP + 계산서요청 + 캘린더연동 + 엑셀업로드
Phase 5: 마무리 — 대시보드 + UI마감

## 핵심 규칙
- 설계 문서를 먼저 읽고 구현할 것
- 미확정 사항은 사용자에게 확인 후 진행
- 회사 하드코딩 절대 금지 (DB 기반)
- 세액 = Math.floor(공급가액 × 세율/100), 합계 기준 1회
- 공통 유틸 적극 활용 (반복 코드 금지)
- 2FA는 현재 중단

## 언어
팀원 간 소통과 코드는 영어로 작성. 리더가 나(사용자)에게 보고할 때만 한국어 사용.
