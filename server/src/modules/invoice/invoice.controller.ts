import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../../utils/prisma';
import { success, error, successList, parsePagination } from '../../utils/response';

export async function listInvoices(req: Request, res: Response) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const companyId = req.companyContext?.ourCompanyId;
    const { direction, status, projectId, counterpartId, search } = req.query;

    const where: Prisma.InvoiceWhereInput = {};
    if (companyId && companyId !== 'all') where.ourCompanyId = companyId;
    if (direction) where.direction = direction as Prisma.EnumDirectionFilter;
    if (status) where.status = status as Prisma.EnumInvoiceStatusFilter;
    if (projectId) where.projectId = projectId as string;
    if (counterpartId) where.counterpartId = counterpartId as string;
    if (search) {
      where.OR = [
        { invoiceNo: { contains: search as string, mode: 'insensitive' } },
        { counterpart: { name: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          ourCompany: { select: { id: true, code: true, name: true } },
          project: { select: { id: true, name: true } },
          counterpart: { select: { id: true, name: true } },
          quotation: { select: { id: true, quotationNo: true } },
          _count: { select: { creditNotes: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    return successList(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function getInvoice(req: Request, res: Response) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        ourCompany: { select: { id: true, code: true, name: true } },
        project: { select: { id: true, name: true } },
        counterpart: true,
        quotation: { select: { id: true, quotationNo: true, direction: true, totalAmount: true } },
        creditNotes: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!invoice) return error(res, 'NOT_FOUND', '계산서를 찾을 수 없습니다', 404);
    return success(res, invoice);
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function updateInvoiceStatus(req: Request, res: Response) {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) return error(res, 'NOT_FOUND', '계산서를 찾을 수 없습니다', 404);

    const { status, invoiceNo, memo } = req.body;
    if (!status) return error(res, 'VALIDATION', '상태를 선택해주세요', 400);

    const validTransitions: Record<string, string[]> = {
      NOT_ISSUED: ['REQUESTED'],
      REQUESTED: ['ISSUED', 'NOT_ISSUED'],
      ISSUED: ['PAID'],
      PAID: [],
    };

    if (!validTransitions[invoice.status]?.includes(status)) {
      return error(res, 'VALIDATION', `${invoice.status} → ${status} 전환은 불가합니다`, 400);
    }

    const data: Prisma.InvoiceUpdateInput = { status, memo: memo || invoice.memo };
    if (status === 'REQUESTED') data.requestedAt = new Date();
    if (status === 'ISSUED') {
      data.issuedAt = new Date();
      if (invoiceNo) data.invoiceNo = invoiceNo;
    }
    if (status === 'PAID') data.paidAt = new Date();

    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data,
      include: {
        ourCompany: { select: { id: true, code: true, name: true } },
        project: { select: { id: true, name: true } },
        counterpart: { select: { id: true, name: true } },
      },
    });

    return success(res, updated);
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function createCreditNote(req: Request, res: Response) {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.invoiceId } });
    if (!invoice) return error(res, 'NOT_FOUND', '계산서를 찾을 수 없습니다', 404);

    const { reason, reasonDetail, supplyAmount, taxAmount, totalAmount } = req.body;
    if (!reason) return error(res, 'VALIDATION', '사유를 입력해주세요', 400);

    const count = await prisma.creditNote.count({ where: { invoiceId: invoice.id } });
    const creditNoteNo = invoice.invoiceNo ? `${invoice.invoiceNo}-C${count + 1}` : null;

    const cn = await prisma.creditNote.create({
      data: {
        invoiceId: invoice.id,
        creditNoteNo,
        reason,
        reasonDetail: reasonDetail || null,
        supplyAmount: supplyAmount || 0,
        taxAmount: taxAmount || 0,
        totalAmount: totalAmount || 0,
      },
    });

    return success(res, cn, 201);
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function listCreditNotes(req: Request, res: Response) {
  try {
    const notes = await prisma.creditNote.findMany({
      where: { invoiceId: req.params.invoiceId },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, notes);
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}
