import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../../utils/prisma';
import { success, error, successList, parsePagination } from '../../utils/response';
import { calculateTaxSummary } from '../../utils/tax';

export async function listSingleTransactions(req: Request, res: Response) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const companyId = req.companyContext?.ourCompanyId;
    const { direction, counterpartId, dateFrom, dateTo, search } = req.query;

    const where: Prisma.SingleTransactionWhereInput = {};
    if (companyId && companyId !== 'all') where.ourCompanyId = companyId;
    if (direction) where.direction = direction as Prisma.EnumDirectionFilter;
    if (counterpartId) where.counterpartId = counterpartId as string;
    if (dateFrom || dateTo) {
      where.tradeDate = {};
      if (dateFrom) where.tradeDate.gte = new Date(dateFrom as string);
      if (dateTo) where.tradeDate.lte = new Date(dateTo as string);
    }
    if (search) {
      where.OR = [
        { itemDesc: { contains: search as string, mode: 'insensitive' } },
        { counterpart: { name: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.singleTransaction.findMany({
        where,
        include: {
          ourCompany: { select: { id: true, code: true, name: true } },
          counterpart: { select: { id: true, name: true } },
        },
        orderBy: { tradeDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.singleTransaction.count({ where }),
    ]);

    return successList(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function createSingleTransaction(req: Request, res: Response) {
  try {
    const companyId = req.companyContext?.ourCompanyId;
    if (!companyId || companyId === 'all') return error(res, 'VALIDATION', '회사를 선택해주세요', 400);

    const { direction, counterpartId, itemDesc, supplyAmount, taxRate = 10, tradeDate, memo, attachmentPath } = req.body;

    if (!direction || !['SALES', 'PURCHASE'].includes(direction)) {
      return error(res, 'VALIDATION', 'direction은 SALES 또는 PURCHASE이어야 합니다', 400);
    }
    if (!itemDesc) return error(res, 'VALIDATION', '품목 설명은 필수입니다', 400);
    if (!supplyAmount) return error(res, 'VALIDATION', '공급가액은 필수입니다', 400);
    if (!tradeDate) return error(res, 'VALIDATION', '거래일은 필수입니다', 400);

    const { taxAmount, totalAmount } = calculateTaxSummary(supplyAmount, taxRate);

    const tx = await prisma.singleTransaction.create({
      data: {
        ourCompanyId: companyId,
        direction,
        counterpartId: counterpartId || null,
        itemDesc,
        supplyAmount,
        taxRate,
        taxAmount,
        totalAmount,
        tradeDate: new Date(tradeDate),
        memo: memo || null,
        attachmentPath: attachmentPath || null,
        createdById: req.user!.id,
      },
      include: {
        ourCompany: { select: { id: true, code: true, name: true } },
        counterpart: { select: { id: true, name: true } },
      },
    });

    return success(res, tx, 201);
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function updateSingleTransaction(req: Request, res: Response) {
  try {
    const existing = await prisma.singleTransaction.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'NOT_FOUND', '거래를 찾을 수 없습니다', 404);

    const { counterpartId, itemDesc, supplyAmount, taxRate, tradeDate, memo } = req.body;
    const data: Record<string, unknown> = {};

    if (counterpartId !== undefined) data.counterpartId = counterpartId || null;
    if (itemDesc !== undefined) data.itemDesc = itemDesc;
    if (tradeDate !== undefined) data.tradeDate = new Date(tradeDate);
    if (memo !== undefined) data.memo = memo;

    // Recalculate if amount or rate changed
    const newSupply = supplyAmount ?? existing.supplyAmount;
    const newRate = taxRate ?? existing.taxRate;
    if (supplyAmount !== undefined || taxRate !== undefined) {
      const calc = calculateTaxSummary(newSupply, newRate);
      data.supplyAmount = newSupply;
      data.taxRate = newRate;
      data.taxAmount = calc.taxAmount;
      data.totalAmount = calc.totalAmount;
    }

    const updated = await prisma.singleTransaction.update({
      where: { id: req.params.id },
      data,
      include: {
        ourCompany: { select: { id: true, code: true, name: true } },
        counterpart: { select: { id: true, name: true } },
      },
    });

    return success(res, updated);
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function deleteSingleTransaction(req: Request, res: Response) {
  try {
    const existing = await prisma.singleTransaction.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'NOT_FOUND', '거래를 찾을 수 없습니다', 404);

    await prisma.singleTransaction.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}
