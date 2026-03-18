import nodemailer from 'nodemailer';
import prisma from './prisma';

interface MailOptions {
  senderId: string;       // Employee ID (sender)
  to: string | string[];
  cc?: string | string[];
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}

/**
 * Send email using company SMTP server + employee credentials.
 * - SMTP host/port from OurCompany
 * - Auth credentials from Employee (email + smtpPassword)
 */
export async function sendMail(options: MailOptions): Promise<boolean> {
  const employee = await prisma.employee.findUnique({
    where: { id: options.senderId },
    include: { ourCompany: true },
  });

  if (!employee) throw new Error('발신자를 찾을 수 없습니다');

  const company = employee.ourCompany;
  if (!company.smtpHost) {
    throw new Error(`SMTP 서버가 설정되지 않았습니다 (${company.code})`);
  }
  if (!employee.smtpPassword) {
    throw new Error(`메일 비밀번호가 설정되지 않았습니다. 설정 → 직원 관리에서 SMTP 비밀번호를 입력해주세요.`);
  }

  const transporter = nodemailer.createTransport({
    host: company.smtpHost,
    port: company.smtpPort || 587,
    secure: company.smtpPort === 465,
    auth: {
      user: employee.email,
      pass: employee.smtpPassword,
    },
  });

  const from = `"${employee.name} (${company.name})" <${employee.email}>`;

  await transporter.sendMail({
    from,
    to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
    cc: options.cc
      ? Array.isArray(options.cc) ? options.cc.join(', ') : options.cc
      : undefined,
    subject: options.subject,
    html: options.html,
    attachments: options.attachments?.map(a => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
    })),
  });

  return true;
}

/**
 * Build quotation email HTML body.
 */
export function buildQuotationEmailHtml(params: {
  senderName: string;
  companyName: string;
  quotationNo: string;
  message?: string;
}): string {
  const msg = params.message || '요청하신 견적서를 송부드립니다.';
  return `
<div style="font-family:'Pretendard',sans-serif;max-width:600px;margin:0 auto;padding:24px;">
  <p style="margin:0 0 16px;">안녕하세요,</p>
  <p style="margin:0 0 16px;">${params.companyName} ${params.senderName}입니다.</p>
  <p style="margin:0 0 24px;">${msg}</p>
  <div style="background:#f0fdfa;border-left:4px solid #078080;padding:12px 16px;border-radius:8px;margin:0 0 24px;">
    <p style="margin:0;font-size:14px;color:#475569;">견적번호: <strong>${params.quotationNo}</strong></p>
  </div>
  <p style="margin:0 0 8px;font-size:13px;color:#64748b;">감사합니다.</p>
  <p style="margin:0;font-size:13px;color:#64748b;">${params.companyName} ${params.senderName} 드림</p>
</div>`;
}

/**
 * Build invoice request email HTML body.
 */
export function buildInvoiceRequestHtml(params: {
  requesterName: string;
  projectName: string;
  direction: string;
  amount: number;
  counterpartName: string;
  projectUrl: string;
  memo?: string;
}): string {
  const dirLabel = params.direction === 'SALES' ? '매출' : '매입';
  const formatted = `₩${params.amount.toLocaleString('ko-KR')}`;
  return `
<div style="font-family:'Pretendard',sans-serif;max-width:600px;margin:0 auto;padding:24px;">
  <h2 style="margin:0 0 16px;color:#078080;">계산서 처리 요청</h2>
  <p style="margin:0 0 16px;">${params.requesterName}님이 계산서 처리를 요청했습니다.</p>
  <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
    <tr><td style="padding:8px 12px;background:#f8f5f2;font-size:13px;color:#64748b;width:100px;">프로젝트</td><td style="padding:8px 12px;font-size:14px;">${params.projectName}</td></tr>
    <tr><td style="padding:8px 12px;background:#f8f5f2;font-size:13px;color:#64748b;">구분</td><td style="padding:8px 12px;font-size:14px;">${dirLabel}</td></tr>
    <tr><td style="padding:8px 12px;background:#f8f5f2;font-size:13px;color:#64748b;">거래처</td><td style="padding:8px 12px;font-size:14px;">${params.counterpartName}</td></tr>
    <tr><td style="padding:8px 12px;background:#f8f5f2;font-size:13px;color:#64748b;">금액</td><td style="padding:8px 12px;font-size:14px;font-weight:600;">${formatted}</td></tr>
    ${params.memo ? `<tr><td style="padding:8px 12px;background:#f8f5f2;font-size:13px;color:#64748b;">메모</td><td style="padding:8px 12px;font-size:14px;">${params.memo}</td></tr>` : ''}
  </table>
  <a href="${params.projectUrl}" style="display:inline-block;padding:12px 24px;background:#078080;color:#fff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:500;">프로젝트 확인하기</a>
</div>`;
}
