import { Request, Response } from 'express';
import prisma from '../../utils/prisma';
import { success, error } from '../../utils/response';
import { sendMail, buildQuotationEmailHtml } from '../../utils/mailer';
import { generateBtmsQuotation, generateHubiocemQuotation } from '../../utils/excel-generator';
import type { QuotationData } from '../../utils/excel-generator';

export async function sendQuotationMail(req: Request, res: Response) {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: {
        ourCompany: true,
        counterpart: { select: { name: true } },
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!quotation) return error(res, 'NOT_FOUND', '견적서를 찾을 수 없습니다', 404);

    const { to, cc, subject, body } = req.body;
    if (!to || (Array.isArray(to) && to.length === 0)) {
      return error(res, 'VALIDATION', '수신자를 입력해주세요', 400);
    }

    // Generate Excel attachment
    const data: QuotationData = {
      quotationNo: quotation.quotationNo,
      quotationDate: quotation.quotationDate,
      validUntil: quotation.validUntil,
      paymentTerms: quotation.paymentTerms,
      revision: quotation.revision,
      counterpartName: quotation.counterpart?.name || null,
      contactName: quotation.contactName,
      contactPhone: quotation.contactPhone,
      contactEmail: quotation.contactEmail,
      authorName: quotation.authorName,
      authorPhone: quotation.authorPhone,
      authorEmail: quotation.authorEmail,
      supplyAmount: quotation.supplyAmount,
      taxAmount: quotation.taxAmount,
      totalAmount: quotation.totalAmount,
      items: quotation.items.map(i => ({
        name: i.name, spec: i.spec, unit: i.unit,
        quantity: i.quantity, unitPrice: i.unitPrice,
        amount: i.amount, remark: i.remark,
      })),
    };

    const buffer = quotation.ourCompany.code === 'HUBIOCEM'
      ? await generateHubiocemQuotation(data)
      : await generateBtmsQuotation(data);

    const author = await prisma.employee.findUnique({ where: { id: req.user!.id } });
    const emailSubject = subject || `견적서 송부의 건 - ${quotation.quotationNo}`;
    const html = buildQuotationEmailHtml({
      senderName: author?.name || '담당자',
      companyName: quotation.ourCompany.name,
      quotationNo: quotation.quotationNo,
      message: body,
    });

    await sendMail({
      senderId: req.user!.id,
      to,
      cc,
      subject: emailSubject,
      html,
      attachments: [{
        filename: `견적서_${quotation.quotationNo}.xlsx`,
        content: buffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }],
    });

    // Update quotation
    await prisma.quotation.update({
      where: { id: quotation.id },
      data: {
        lastSentAt: new Date(),
        sentCount: { increment: 1 },
        status: quotation.status === 'DRAFT' ? 'SENT' : quotation.status,
      },
    });

    return success(res, { sent: true, sentAt: new Date() });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '메일 발송에 실패했습니다';
    return error(res, 'MAIL_ERROR', msg, 500);
  }
}

export async function sendInvoiceRequest(req: Request, res: Response) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        ourCompany: true,
        project: true,
        counterpart: true,
      },
    });
    if (!invoice) return error(res, 'NOT_FOUND', '계산서를 찾을 수 없습니다', 404);

    const { recipientId, memo } = req.body;
    if (!recipientId) return error(res, 'VALIDATION', '수신자를 선택해주세요', 400);

    const recipient = await prisma.employee.findUnique({ where: { id: recipientId } });
    if (!recipient) return error(res, 'NOT_FOUND', '수신자를 찾을 수 없습니다', 404);

    const requester = await prisma.employee.findUnique({ where: { id: req.user!.id } });
    const baseUrl = process.env.BASE_URL || 'https://officev2.hubiocem.com';

    const html = (await import('../../utils/mailer')).buildInvoiceRequestHtml({
      requesterName: requester?.name || '담당자',
      projectName: invoice.project?.name || '(프로젝트 없음)',
      direction: invoice.direction,
      amount: invoice.totalAmount,
      counterpartName: invoice.counterpart?.name || '',
      projectUrl: invoice.projectId ? `${baseUrl}/projects/${invoice.projectId}` : baseUrl,
      memo,
    });

    await sendMail({
      senderId: req.user!.id,
      to: recipient.email,
      subject: `[계산서 처리 요청] ${invoice.project?.name || ''}`,
      html,
    });

    // Update status
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: 'REQUESTED',
        requestedAt: new Date(),
        requestedById: req.user!.id,
        processedById: recipientId,
        memo: memo || invoice.memo,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        recipientId,
        type: 'INVOICE_REQUESTED',
        title: '계산서 처리 요청',
        message: `${requester?.name || ''}님이 ${invoice.project?.name || ''} 계산서 처리를 요청했습니다.`,
        linkType: 'PROJECT',
        linkId: invoice.projectId || undefined,
      },
    });

    return success(res, { sent: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '요청에 실패했습니다';
    return error(res, 'MAIL_ERROR', msg, 500);
  }
}
