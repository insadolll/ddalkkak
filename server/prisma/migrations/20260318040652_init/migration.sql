-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'ACCOUNTANT', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProjectStage" AS ENUM ('SETUP', 'QUOTE_RECEIVED', 'QUOTE_SENT', 'ORDER_CONFIRMED', 'DELIVERY', 'INVOICE', 'DONE');

-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('SALES', 'PURCHASE');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'SENT', 'CONFIRMED', 'VOID');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('NOT_ISSUED', 'REQUESTED', 'ISSUED', 'PAID');

-- CreateEnum
CREATE TYPE "CreditNoteReason" AS ENUM ('CONTRACT_CHANGE', 'RETURN', 'PRICE_ADJUST', 'ERROR_CORRECTION', 'OTHER');

-- CreateEnum
CREATE TYPE "POStatus" AS ENUM ('DRAFT', 'SENT', 'ACKNOWLEDGED');

-- CreateEnum
CREATE TYPE "CreditNoteStatus" AS ENUM ('NOT_ISSUED', 'REQUESTED', 'ISSUED');

-- CreateEnum
CREATE TYPE "MailStatus" AS ENUM ('PENDING', 'REGISTERED', 'IGNORED');

-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('COA', 'MSDS', 'IMPORT_CERT', 'LICENSE', 'CONTRACT', 'OTHER');

-- CreateEnum
CREATE TYPE "MemoType" AS ENUM ('MEMO', 'STAGE_CHANGE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('ANNUAL', 'SICK', 'HALF', 'OTHER');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "StepStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('PERSONAL', 'TEAM', 'COMPANY');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('WEEKLY', 'MONTHLY');

-- CreateTable
CREATE TABLE "our_companies" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "bizNumber" TEXT,
    "representative" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "fax" TEXT,
    "email" TEXT,
    "domain" TEXT,
    "logoPath" TEXT,
    "stampPath" TEXT,
    "smtpHost" TEXT,
    "smtpPort" INTEGER DEFAULT 587,
    "smtpUser" TEXT,
    "smtpPassword" TEXT,
    "smtpFromName" TEXT,
    "quotationPrefix" TEXT NOT NULL DEFAULT 'Q',
    "poPrefix" TEXT NOT NULL DEFAULT 'PO',
    "dsPrefix" TEXT NOT NULL DEFAULT 'DS',
    "imapHost" TEXT,
    "imapPort" INTEGER DEFAULT 993,
    "imapUser" TEXT,
    "imapPassword" TEXT,
    "imapFolder" TEXT DEFAULT '견적수신',
    "imapEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "our_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "employeeNo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "position" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinDate" TIMESTAMP(3) NOT NULL,
    "ourCompanyId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "number_sequences" (
    "id" TEXT NOT NULL,
    "ourCompanyId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "number_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "bizNumber" TEXT,
    "representative" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "taxEmail" TEXT,
    "memo" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_contacts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "memo" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "ourCompanyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientId" TEXT,
    "supplierId" TEXT,
    "managerId" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "stage" "ProjectStage" NOT NULL DEFAULT 'SETUP',
    "confirmedSalesAmount" INTEGER NOT NULL DEFAULT 0,
    "confirmedSalesTax" INTEGER NOT NULL DEFAULT 0,
    "confirmedPurchaseAmount" INTEGER NOT NULL DEFAULT 0,
    "confirmedPurchaseTax" INTEGER NOT NULL DEFAULT 0,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" TEXT NOT NULL,
    "ourCompanyId" TEXT NOT NULL,
    "projectId" TEXT,
    "quotationNo" TEXT NOT NULL,
    "direction" "Direction" NOT NULL,
    "title" TEXT,
    "quotationDate" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "paymentTerms" TEXT,
    "counterpartId" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "authorId" TEXT,
    "authorName" TEXT,
    "authorPosition" TEXT,
    "authorPhone" TEXT,
    "authorEmail" TEXT,
    "supplyAmount" INTEGER NOT NULL DEFAULT 0,
    "taxAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "defaultTaxRate" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" TIMESTAMP(3),
    "sourceQuotationId" TEXT,
    "marginRate" DOUBLE PRECISION,
    "lastSentAt" TIMESTAMP(3),
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "originalFilePath" TEXT,
    "receivedMailId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_items" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "spec" TEXT,
    "unit" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" INTEGER NOT NULL DEFAULT 0,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_revisions" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "snapshot" TEXT NOT NULL,
    "changeNote" TEXT,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotation_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "ourCompanyId" TEXT NOT NULL,
    "projectId" TEXT,
    "poNo" TEXT NOT NULL,
    "sourceQuotationId" TEXT,
    "supplierId" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "deliveryDate" TIMESTAMP(3),
    "deliveryPlace" TEXT,
    "supplyAmount" INTEGER NOT NULL DEFAULT 0,
    "taxAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "status" "POStatus" NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "spec" TEXT,
    "unit" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" INTEGER NOT NULL DEFAULT 0,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "remark" TEXT,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "ourCompanyId" TEXT NOT NULL,
    "projectId" TEXT,
    "invoiceNo" TEXT,
    "direction" "Direction" NOT NULL,
    "quotationId" TEXT,
    "counterpartId" TEXT,
    "supplyAmount" INTEGER NOT NULL DEFAULT 0,
    "taxAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'NOT_ISSUED',
    "requestedAt" TIMESTAMP(3),
    "issuedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "calendarEventId" TEXT,
    "requestedById" TEXT,
    "processedById" TEXT,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_notes" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "creditNoteNo" TEXT,
    "reason" "CreditNoteReason" NOT NULL,
    "reasonDetail" TEXT,
    "supplyAmount" INTEGER NOT NULL DEFAULT 0,
    "taxAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "status" "CreditNoteStatus" NOT NULL DEFAULT 'NOT_ISSUED',
    "issuedAt" TIMESTAMP(3),
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_statements" (
    "id" TEXT NOT NULL,
    "ourCompanyId" TEXT NOT NULL,
    "projectId" TEXT,
    "statementNo" TEXT NOT NULL,
    "counterpartId" TEXT,
    "contactName" TEXT,
    "supplyAmount" INTEGER NOT NULL DEFAULT 0,
    "taxAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "issueDate" TIMESTAMP(3),
    "lastSentAt" TIMESTAMP(3),
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_statement_items" (
    "id" TEXT NOT NULL,
    "statementId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "spec" TEXT,
    "unit" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" INTEGER NOT NULL DEFAULT 0,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "remark" TEXT,

    CONSTRAINT "transaction_statement_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "single_transactions" (
    "id" TEXT NOT NULL,
    "ourCompanyId" TEXT NOT NULL,
    "direction" "Direction" NOT NULL,
    "counterpartId" TEXT,
    "itemDesc" TEXT NOT NULL,
    "supplyAmount" INTEGER NOT NULL,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "taxAmount" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "tradeDate" TIMESTAMP(3) NOT NULL,
    "memo" TEXT,
    "attachmentPath" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "single_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_attachments" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT,
    "docType" "DocType" NOT NULL DEFAULT 'OTHER',
    "docTypeLabel" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_memos" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "authorId" TEXT,
    "type" "MemoType" NOT NULL DEFAULT 'MEMO',
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_memos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "received_mails" (
    "id" TEXT NOT NULL,
    "ourCompanyId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "fromName" TEXT,
    "subject" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "attachments" TEXT,
    "status" "MailStatus" NOT NULL DEFAULT 'PENDING',
    "matchedCompanyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "received_mails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "linkType" TEXT,
    "linkId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_balances" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "totalDays" DOUBLE PRECISION NOT NULL DEFAULT 15.0,
    "usedDays" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "remainingDays" DOUBLE PRECISION NOT NULL DEFAULT 15.0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaves" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalDays" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "reviewerId" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leaves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "authorId" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "totalSteps" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_steps" (
    "id" TEXT NOT NULL,
    "approvalDocumentId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "approverId" TEXT NOT NULL,
    "status" "StepStatus" NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "actionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "eventType" "EventType" NOT NULL DEFAULT 'PERSONAL',
    "ownerId" TEXT NOT NULL,
    "departmentId" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meetings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "meetingType" "MeetingType" NOT NULL,
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "meetingTime" TEXT,
    "memo" TEXT,
    "announcement" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_work_items" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "category" TEXT,
    "client" TEXT,
    "content" TEXT NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT '진행중',
    "assignee" TEXT,
    "remarks" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_work_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_plan_items" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "category" TEXT,
    "client" TEXT,
    "content" TEXT NOT NULL,
    "targetDate" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT '보통',
    "assignee" TEXT,
    "remarks" TEXT,
    "calendarEventId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_issues" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "category" TEXT,
    "client" TEXT,
    "content" TEXT NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT '보통',
    "actionStatus" TEXT NOT NULL DEFAULT '확인중',
    "assignee" TEXT,
    "remarks" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_decisions" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "category" TEXT,
    "content" TEXT NOT NULL,
    "deadline" TEXT,
    "assignee" TEXT,
    "remarks" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_reports" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "prevMonth" TEXT NOT NULL DEFAULT '',
    "currentMonth" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_records" (
    "id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER NOT NULL DEFAULT 0,
    "month" INTEGER NOT NULL DEFAULT 0,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_items" (
    "id" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "useDate" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "corpOrPersonal" TEXT NOT NULL DEFAULT '법인',
    "cardOrCash" TEXT NOT NULL DEFAULT '카드',
    "category" TEXT NOT NULL DEFAULT '',
    "corpCardAmount" INTEGER NOT NULL DEFAULT 0,
    "corpCashAmount" INTEGER NOT NULL DEFAULT 0,
    "persCardAmount" INTEGER NOT NULL DEFAULT 0,
    "persCashAmount" INTEGER NOT NULL DEFAULT 0,
    "merchantName" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "personInCharge" TEXT NOT NULL DEFAULT '',
    "cancelStatus" TEXT NOT NULL DEFAULT '정상',
    "approvalNo" TEXT NOT NULL DEFAULT '',
    "vatAmount" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "expense_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suggestions" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '기타',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "it_assets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "ip" TEXT,
    "os" TEXT,
    "specs" TEXT,
    "location" TEXT,
    "purpose" TEXT,
    "status" TEXT NOT NULL DEFAULT '운영중',
    "memo" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "it_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_accounts" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "encryptedPassword" TEXT,
    "port" INTEGER,
    "url" TEXT,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ip_entries" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "subnet" TEXT,
    "gateway" TEXT,
    "type" TEXT NOT NULL DEFAULT '유선',
    "hostname" TEXT,
    "location" TEXT,
    "assignedTo" TEXT,
    "status" TEXT NOT NULL DEFAULT '사용중',
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ip_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_history" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signature_profiles" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "signatureImg" TEXT,
    "stampConfig" TEXT,
    "stampImg" TEXT,
    "nameplateConfig" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "signature_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT,
    "targetId" TEXT,
    "targetType" TEXT,
    "detail" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "our_companies_code_key" ON "our_companies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE INDEX "departments_name_idx" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employeeNo_key" ON "employees"("employeeNo");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE INDEX "employees_email_idx" ON "employees"("email");

-- CreateIndex
CREATE INDEX "employees_employeeNo_idx" ON "employees"("employeeNo");

-- CreateIndex
CREATE INDEX "employees_departmentId_idx" ON "employees"("departmentId");

-- CreateIndex
CREATE INDEX "employees_ourCompanyId_idx" ON "employees"("ourCompanyId");

-- CreateIndex
CREATE INDEX "employees_role_idx" ON "employees"("role");

-- CreateIndex
CREATE INDEX "employees_isActive_idx" ON "employees"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "number_sequences_ourCompanyId_docType_year_key" ON "number_sequences"("ourCompanyId", "docType", "year");

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_key" ON "companies"("name");

-- CreateIndex
CREATE INDEX "companies_name_idx" ON "companies"("name");

-- CreateIndex
CREATE INDEX "companies_bizNumber_idx" ON "companies"("bizNumber");

-- CreateIndex
CREATE INDEX "companies_createdById_idx" ON "companies"("createdById");

-- CreateIndex
CREATE INDEX "company_contacts_companyId_idx" ON "company_contacts"("companyId");

-- CreateIndex
CREATE INDEX "company_contacts_createdById_idx" ON "company_contacts"("createdById");

-- CreateIndex
CREATE INDEX "projects_ourCompanyId_idx" ON "projects"("ourCompanyId");

-- CreateIndex
CREATE INDEX "projects_clientId_idx" ON "projects"("clientId");

-- CreateIndex
CREATE INDEX "projects_supplierId_idx" ON "projects"("supplierId");

-- CreateIndex
CREATE INDEX "projects_managerId_idx" ON "projects"("managerId");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "projects_stage_idx" ON "projects"("stage");

-- CreateIndex
CREATE INDEX "projects_ourCompanyId_status_idx" ON "projects"("ourCompanyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_quotationNo_key" ON "quotations"("quotationNo");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_receivedMailId_key" ON "quotations"("receivedMailId");

-- CreateIndex
CREATE INDEX "quotations_ourCompanyId_idx" ON "quotations"("ourCompanyId");

-- CreateIndex
CREATE INDEX "quotations_projectId_idx" ON "quotations"("projectId");

-- CreateIndex
CREATE INDEX "quotations_direction_idx" ON "quotations"("direction");

-- CreateIndex
CREATE INDEX "quotations_status_idx" ON "quotations"("status");

-- CreateIndex
CREATE INDEX "quotations_isConfirmed_idx" ON "quotations"("isConfirmed");

-- CreateIndex
CREATE INDEX "quotations_counterpartId_idx" ON "quotations"("counterpartId");

-- CreateIndex
CREATE INDEX "quotations_quotationDate_idx" ON "quotations"("quotationDate");

-- CreateIndex
CREATE INDEX "quotations_sourceQuotationId_idx" ON "quotations"("sourceQuotationId");

-- CreateIndex
CREATE INDEX "quotations_ourCompanyId_direction_status_idx" ON "quotations"("ourCompanyId", "direction", "status");

-- CreateIndex
CREATE INDEX "quotations_projectId_direction_isConfirmed_idx" ON "quotations"("projectId", "direction", "isConfirmed");

-- CreateIndex
CREATE INDEX "quotation_items_quotationId_idx" ON "quotation_items"("quotationId");

-- CreateIndex
CREATE INDEX "quotation_revisions_quotationId_idx" ON "quotation_revisions"("quotationId");

-- CreateIndex
CREATE UNIQUE INDEX "quotation_revisions_quotationId_revision_key" ON "quotation_revisions"("quotationId", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_poNo_key" ON "purchase_orders"("poNo");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_sourceQuotationId_key" ON "purchase_orders"("sourceQuotationId");

-- CreateIndex
CREATE INDEX "purchase_orders_ourCompanyId_idx" ON "purchase_orders"("ourCompanyId");

-- CreateIndex
CREATE INDEX "purchase_orders_projectId_idx" ON "purchase_orders"("projectId");

-- CreateIndex
CREATE INDEX "purchase_orders_supplierId_idx" ON "purchase_orders"("supplierId");

-- CreateIndex
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders"("status");

-- CreateIndex
CREATE INDEX "purchase_order_items_purchaseOrderId_idx" ON "purchase_order_items"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "invoices_ourCompanyId_idx" ON "invoices"("ourCompanyId");

-- CreateIndex
CREATE INDEX "invoices_projectId_idx" ON "invoices"("projectId");

-- CreateIndex
CREATE INDEX "invoices_direction_idx" ON "invoices"("direction");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_dueDate_idx" ON "invoices"("dueDate");

-- CreateIndex
CREATE INDEX "invoices_counterpartId_idx" ON "invoices"("counterpartId");

-- CreateIndex
CREATE INDEX "invoices_dueDate_status_idx" ON "invoices"("dueDate", "status");

-- CreateIndex
CREATE INDEX "credit_notes_invoiceId_idx" ON "credit_notes"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_statements_statementNo_key" ON "transaction_statements"("statementNo");

-- CreateIndex
CREATE INDEX "transaction_statements_ourCompanyId_idx" ON "transaction_statements"("ourCompanyId");

-- CreateIndex
CREATE INDEX "transaction_statements_projectId_idx" ON "transaction_statements"("projectId");

-- CreateIndex
CREATE INDEX "transaction_statements_counterpartId_idx" ON "transaction_statements"("counterpartId");

-- CreateIndex
CREATE INDEX "transaction_statement_items_statementId_idx" ON "transaction_statement_items"("statementId");

-- CreateIndex
CREATE INDEX "single_transactions_ourCompanyId_idx" ON "single_transactions"("ourCompanyId");

-- CreateIndex
CREATE INDEX "single_transactions_direction_idx" ON "single_transactions"("direction");

-- CreateIndex
CREATE INDEX "single_transactions_tradeDate_idx" ON "single_transactions"("tradeDate");

-- CreateIndex
CREATE INDEX "single_transactions_counterpartId_idx" ON "single_transactions"("counterpartId");

-- CreateIndex
CREATE INDEX "single_transactions_ourCompanyId_direction_tradeDate_idx" ON "single_transactions"("ourCompanyId", "direction", "tradeDate");

-- CreateIndex
CREATE INDEX "project_attachments_projectId_idx" ON "project_attachments"("projectId");

-- CreateIndex
CREATE INDEX "project_attachments_docType_idx" ON "project_attachments"("docType");

-- CreateIndex
CREATE INDEX "project_memos_projectId_idx" ON "project_memos"("projectId");

-- CreateIndex
CREATE INDEX "project_memos_createdAt_idx" ON "project_memos"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "received_mails_messageId_key" ON "received_mails"("messageId");

-- CreateIndex
CREATE INDEX "received_mails_ourCompanyId_idx" ON "received_mails"("ourCompanyId");

-- CreateIndex
CREATE INDEX "received_mails_status_idx" ON "received_mails"("status");

-- CreateIndex
CREATE INDEX "received_mails_fromAddress_idx" ON "received_mails"("fromAddress");

-- CreateIndex
CREATE INDEX "received_mails_receivedAt_idx" ON "received_mails"("receivedAt");

-- CreateIndex
CREATE INDEX "notifications_recipientId_idx" ON "notifications"("recipientId");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "leave_balances_employeeId_key" ON "leave_balances"("employeeId");

-- CreateIndex
CREATE INDEX "leave_balances_employeeId_idx" ON "leave_balances"("employeeId");

-- CreateIndex
CREATE INDEX "leave_balances_year_idx" ON "leave_balances"("year");

-- CreateIndex
CREATE INDEX "leaves_employeeId_idx" ON "leaves"("employeeId");

-- CreateIndex
CREATE INDEX "leaves_status_idx" ON "leaves"("status");

-- CreateIndex
CREATE INDEX "leaves_startDate_idx" ON "leaves"("startDate");

-- CreateIndex
CREATE INDEX "leaves_endDate_idx" ON "leaves"("endDate");

-- CreateIndex
CREATE INDEX "leaves_reviewerId_idx" ON "leaves"("reviewerId");

-- CreateIndex
CREATE INDEX "approval_documents_authorId_idx" ON "approval_documents"("authorId");

-- CreateIndex
CREATE INDEX "approval_documents_status_idx" ON "approval_documents"("status");

-- CreateIndex
CREATE INDEX "approval_documents_currentStep_idx" ON "approval_documents"("currentStep");

-- CreateIndex
CREATE INDEX "approval_documents_submittedAt_idx" ON "approval_documents"("submittedAt");

-- CreateIndex
CREATE INDEX "approval_steps_approvalDocumentId_idx" ON "approval_steps"("approvalDocumentId");

-- CreateIndex
CREATE INDEX "approval_steps_approverId_idx" ON "approval_steps"("approverId");

-- CreateIndex
CREATE INDEX "approval_steps_status_idx" ON "approval_steps"("status");

-- CreateIndex
CREATE INDEX "approval_steps_stepOrder_idx" ON "approval_steps"("stepOrder");

-- CreateIndex
CREATE UNIQUE INDEX "approval_steps_approvalDocumentId_stepOrder_key" ON "approval_steps"("approvalDocumentId", "stepOrder");

-- CreateIndex
CREATE INDEX "calendar_events_ownerId_idx" ON "calendar_events"("ownerId");

-- CreateIndex
CREATE INDEX "calendar_events_departmentId_idx" ON "calendar_events"("departmentId");

-- CreateIndex
CREATE INDEX "calendar_events_startTime_idx" ON "calendar_events"("startTime");

-- CreateIndex
CREATE INDEX "calendar_events_endTime_idx" ON "calendar_events"("endTime");

-- CreateIndex
CREATE INDEX "calendar_events_eventType_idx" ON "calendar_events"("eventType");

-- CreateIndex
CREATE INDEX "meetings_meetingType_idx" ON "meetings"("meetingType");

-- CreateIndex
CREATE INDEX "meetings_meetingDate_idx" ON "meetings"("meetingDate");

-- CreateIndex
CREATE INDEX "meetings_createdById_idx" ON "meetings"("createdById");

-- CreateIndex
CREATE INDEX "meeting_work_items_meetingId_idx" ON "meeting_work_items"("meetingId");

-- CreateIndex
CREATE INDEX "meeting_work_items_authorId_idx" ON "meeting_work_items"("authorId");

-- CreateIndex
CREATE INDEX "meeting_plan_items_meetingId_idx" ON "meeting_plan_items"("meetingId");

-- CreateIndex
CREATE INDEX "meeting_plan_items_authorId_idx" ON "meeting_plan_items"("authorId");

-- CreateIndex
CREATE INDEX "meeting_issues_meetingId_idx" ON "meeting_issues"("meetingId");

-- CreateIndex
CREATE INDEX "meeting_issues_authorId_idx" ON "meeting_issues"("authorId");

-- CreateIndex
CREATE INDEX "meeting_decisions_meetingId_idx" ON "meeting_decisions"("meetingId");

-- CreateIndex
CREATE INDEX "meeting_decisions_authorId_idx" ON "meeting_decisions"("authorId");

-- CreateIndex
CREATE INDEX "monthly_reports_meetingId_idx" ON "monthly_reports"("meetingId");

-- CreateIndex
CREATE INDEX "monthly_reports_authorId_idx" ON "monthly_reports"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_reports_meetingId_authorId_key" ON "monthly_reports"("meetingId", "authorId");

-- CreateIndex
CREATE INDEX "expense_records_company_idx" ON "expense_records"("company");

-- CreateIndex
CREATE INDEX "expense_records_uploadedById_idx" ON "expense_records"("uploadedById");

-- CreateIndex
CREATE INDEX "expense_records_year_month_idx" ON "expense_records"("year", "month");

-- CreateIndex
CREATE INDEX "expense_items_recordId_idx" ON "expense_items"("recordId");

-- CreateIndex
CREATE INDEX "suggestions_authorId_idx" ON "suggestions"("authorId");

-- CreateIndex
CREATE INDEX "suggestions_status_idx" ON "suggestions"("status");

-- CreateIndex
CREATE INDEX "suggestions_createdAt_idx" ON "suggestions"("createdAt");

-- CreateIndex
CREATE INDEX "it_assets_category_idx" ON "it_assets"("category");

-- CreateIndex
CREATE INDEX "it_assets_status_idx" ON "it_assets"("status");

-- CreateIndex
CREATE INDEX "asset_accounts_assetId_idx" ON "asset_accounts"("assetId");

-- CreateIndex
CREATE INDEX "ip_entries_ip_idx" ON "ip_entries"("ip");

-- CreateIndex
CREATE INDEX "ip_entries_type_idx" ON "ip_entries"("type");

-- CreateIndex
CREATE INDEX "ip_entries_status_idx" ON "ip_entries"("status");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_employeeId_idx" ON "refresh_tokens"("employeeId");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "password_history_employeeId_idx" ON "password_history"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "signature_profiles_employeeId_key" ON "signature_profiles"("employeeId");

-- CreateIndex
CREATE INDEX "signature_profiles_employeeId_idx" ON "signature_profiles"("employeeId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_targetId_idx" ON "audit_logs"("targetId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_ourCompanyId_fkey" FOREIGN KEY ("ourCompanyId") REFERENCES "our_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "number_sequences" ADD CONSTRAINT "number_sequences_ourCompanyId_fkey" FOREIGN KEY ("ourCompanyId") REFERENCES "our_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_contacts" ADD CONSTRAINT "company_contacts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_contacts" ADD CONSTRAINT "company_contacts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_ourCompanyId_fkey" FOREIGN KEY ("ourCompanyId") REFERENCES "our_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_ourCompanyId_fkey" FOREIGN KEY ("ourCompanyId") REFERENCES "our_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_counterpartId_fkey" FOREIGN KEY ("counterpartId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_sourceQuotationId_fkey" FOREIGN KEY ("sourceQuotationId") REFERENCES "quotations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_receivedMailId_fkey" FOREIGN KEY ("receivedMailId") REFERENCES "received_mails"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_revisions" ADD CONSTRAINT "quotation_revisions_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_revisions" ADD CONSTRAINT "quotation_revisions_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_ourCompanyId_fkey" FOREIGN KEY ("ourCompanyId") REFERENCES "our_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_sourceQuotationId_fkey" FOREIGN KEY ("sourceQuotationId") REFERENCES "quotations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_ourCompanyId_fkey" FOREIGN KEY ("ourCompanyId") REFERENCES "our_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "quotations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_counterpartId_fkey" FOREIGN KEY ("counterpartId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_statements" ADD CONSTRAINT "transaction_statements_ourCompanyId_fkey" FOREIGN KEY ("ourCompanyId") REFERENCES "our_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_statements" ADD CONSTRAINT "transaction_statements_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_statements" ADD CONSTRAINT "transaction_statements_counterpartId_fkey" FOREIGN KEY ("counterpartId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_statement_items" ADD CONSTRAINT "transaction_statement_items_statementId_fkey" FOREIGN KEY ("statementId") REFERENCES "transaction_statements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "single_transactions" ADD CONSTRAINT "single_transactions_ourCompanyId_fkey" FOREIGN KEY ("ourCompanyId") REFERENCES "our_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "single_transactions" ADD CONSTRAINT "single_transactions_counterpartId_fkey" FOREIGN KEY ("counterpartId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_attachments" ADD CONSTRAINT "project_attachments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_memos" ADD CONSTRAINT "project_memos_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_memos" ADD CONSTRAINT "project_memos_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "received_mails" ADD CONSTRAINT "received_mails_ourCompanyId_fkey" FOREIGN KEY ("ourCompanyId") REFERENCES "our_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "received_mails" ADD CONSTRAINT "received_mails_matchedCompanyId_fkey" FOREIGN KEY ("matchedCompanyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_documents" ADD CONSTRAINT "approval_documents_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_approvalDocumentId_fkey" FOREIGN KEY ("approvalDocumentId") REFERENCES "approval_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_work_items" ADD CONSTRAINT "meeting_work_items_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_work_items" ADD CONSTRAINT "meeting_work_items_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_plan_items" ADD CONSTRAINT "meeting_plan_items_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_plan_items" ADD CONSTRAINT "meeting_plan_items_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_issues" ADD CONSTRAINT "meeting_issues_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_issues" ADD CONSTRAINT "meeting_issues_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_decisions" ADD CONSTRAINT "meeting_decisions_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_decisions" ADD CONSTRAINT "meeting_decisions_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_reports" ADD CONSTRAINT "monthly_reports_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_reports" ADD CONSTRAINT "monthly_reports_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_records" ADD CONSTRAINT "expense_records_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_items" ADD CONSTRAINT "expense_items_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "expense_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suggestions" ADD CONSTRAINT "suggestions_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "it_assets" ADD CONSTRAINT "it_assets_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_accounts" ADD CONSTRAINT "asset_accounts_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "it_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_history" ADD CONSTRAINT "password_history_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature_profiles" ADD CONSTRAINT "signature_profiles_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
