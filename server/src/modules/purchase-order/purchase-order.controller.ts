import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../../utils/prisma';
import { success, error, successList, parsePagination } from '../../utils/response';
import { generateDocNumber } from '../../utils/number-sequence';

const poIncludes = {
  ourCompany: { select: { id: true, code: true, name: true } },
  project: { select: { id: true, name: true } },
  sourceQuotation: { select: { id: true, quotationNo: true, direction: true } },
  supplier: { select: { id: true, name: true } },
  items: { orderBy: { sortOrder: 'asc' as const } },
} as const;

export async function listPurchaseOrders(req: Request, res: Response) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const companyId = req.companyContext?.ourCompanyId;
    const { status, projectId, supplierId, search } = req.query;

    const where: Prisma.PurchaseOrderWhereInput = {};
    if (companyId && companyId !== 'all') where.ourCompanyId = companyId;
    if (status) where.status = status as Prisma.EnumPOStatusFilter;
    if (projectId) where.projectId = projectId as string;
    if (supplierId) where.supplierId = supplierId as string;
    if (search) {
      where.OR = [
        { poNo: { contains: search as string, mode: 'insensitive' } },
        { supplier: { name: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          ourCompany: { select: { id: true, code: true, name: true } },
          project: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    return successList(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function getPurchaseOrder(req: Request, res: Response) {
  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: poIncludes,
    });
    if (!po) return error(res, 'NOT_FOUND', '발주서를 찾을 수 없습니다', 404);
    return success(res, po);
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function createFromQuotation(req: Request, res: Response) {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.quotationId },
      include: { items: true, ourCompany: true, purchaseOrder: true },
    });
    if (!quotation) return error(res, 'NOT_FOUND', '견적서를 찾을 수 없습니다', 404);
    if (quotation.purchaseOrder) return error(res, 'CONFLICT', '이미 발주서가 생성된 견적서입니다', 409);

    const { deliveryDate, deliveryPlace, memo } = req.body;

    const poNo = await generateDocNumber(quotation.ourCompanyId, 'PURCHASE_ORDER', quotation.ourCompany.poPrefix);

    const po = await prisma.purchaseOrder.create({
      data: {
        ourCompanyId: quotation.ourCompanyId,
        projectId: quotation.projectId,
        poNo,
        sourceQuotationId: quotation.id,
        supplierId: quotation.counterpartId,
        contactName: quotation.contactName,
        contactEmail: quotation.contactEmail,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        deliveryPlace: deliveryPlace || null,
        supplyAmount: quotation.supplyAmount,
        taxAmount: quotation.taxAmount,
        totalAmount: quotation.totalAmount,
        memo: memo || null,
        items: {
          create: quotation.items.map(item => ({
            name: item.name,
            spec: item.spec,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
            taxRate: item.taxRate,
            remark: item.remark,
            sortOrder: item.sortOrder,
          })),
        },
      },
      include: poIncludes,
    });

    // Project memo
    if (quotation.projectId) {
      await prisma.projectMemo.create({
        data: {
          projectId: quotation.projectId,
          authorId: req.user!.id,
          type: 'SYSTEM',
          content: `발주서 ${poNo} 생성 (견적서 ${quotation.quotationNo} 기반)`,
        },
      });
    }

    return success(res, po, 201);
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function updatePurchaseOrder(req: Request, res: Response) {
  try {
    const existing = await prisma.purchaseOrder.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'NOT_FOUND', '발주서를 찾을 수 없습니다', 404);

    const allowedFields = ['deliveryDate', 'deliveryPlace', 'contactName', 'contactEmail', 'status', 'memo'];
    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        data[field] = field === 'deliveryDate' && req.body[field] ? new Date(req.body[field]) : req.body[field];
      }
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id: req.params.id },
      data,
      include: poIncludes,
    });

    return success(res, updated);
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}
