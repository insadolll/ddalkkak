import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../../utils/prisma';
import { success, error, successList, parsePagination } from '../../utils/response';
import { generateDocNumber } from '../../utils/number-sequence';
import { calculateItemAmount, calculateTaxSummary } from '../../utils/tax';

// ─── Helpers ────────────────────────────────────────────────────────────────

interface ItemInput {
  name: string;
  spec?: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  remark?: string;
  sortOrder?: number;
}

function processItems(items: ItemInput[], defaultTaxRate: number) {
  let supplyAmount = 0;
  const processed = items.map((item, idx) => {
    const amount = calculateItemAmount(item.quantity, item.unitPrice);
    supplyAmount += amount;
    return {
      name: item.name,
      spec: item.spec || null,
      unit: item.unit || null,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount,
      taxRate: item.taxRate ?? defaultTaxRate,
      remark: item.remark || null,
      sortOrder: item.sortOrder ?? idx,
    };
  });
  const summary = calculateTaxSummary(supplyAmount, defaultTaxRate);
  return { processed, ...summary };
}

const quotationIncludes = {
  ourCompany: { select: { id: true, code: true, name: true } },
  project: { select: { id: true, name: true } },
  counterpart: { select: { id: true, name: true } },
  author: { select: { id: true, name: true, position: true } },
  createdBy: { select: { id: true, name: true } },
  items: { orderBy: { sortOrder: 'asc' as const } },
} as const;

// ─── CRUD ───────────────────────────────────────────────────────────────────

export async function listQuotations(req: Request, res: Response) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const companyId = req.companyContext?.ourCompanyId;
    const { direction, status, projectId, counterpartId, isConfirmed, dateFrom, dateTo, search } = req.query;

    const where: Prisma.QuotationWhereInput = {};

    if (companyId && companyId !== 'all') where.ourCompanyId = companyId;
    if (req.user?.role === 'EMPLOYEE') {
      where.project = { managerId: req.user.id };
    }
    if (direction) where.direction = direction as Prisma.EnumDirectionFilter;
    if (status) where.status = status as Prisma.EnumQuotationStatusFilter;
    if (projectId) where.projectId = projectId as string;
    if (counterpartId) where.counterpartId = counterpartId as string;
    if (isConfirmed !== undefined) where.isConfirmed = isConfirmed === 'true';
    if (dateFrom || dateTo) {
      where.quotationDate = {};
      if (dateFrom) where.quotationDate.gte = new Date(dateFrom as string);
      if (dateTo) where.quotationDate.lte = new Date(dateTo as string);
    }
    if (search) {
      where.OR = [
        { quotationNo: { contains: search as string, mode: 'insensitive' } },
        { title: { contains: search as string, mode: 'insensitive' } },
        { counterpart: { name: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        include: {
          ourCompany: { select: { id: true, code: true, name: true } },
          project: { select: { id: true, name: true } },
          counterpart: { select: { id: true, name: true } },
          author: { select: { id: true, name: true } },
          _count: { select: { items: true, revisions: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.quotation.count({ where }),
    ]);

    return successList(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function getQuotation(req: Request, res: Response) {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: {
        ...quotationIncludes,
        revisions: {
          orderBy: { revision: 'desc' },
          include: { changedBy: { select: { id: true, name: true } } },
        },
        sourceQuotation: { select: { id: true, quotationNo: true, direction: true } },
        derivedQuotations: { select: { id: true, quotationNo: true, direction: true } },
        purchaseOrder: { select: { id: true, poNo: true, status: true } },
      },
    });

    if (!quotation) {
      return error(res, 'NOT_FOUND', '견적서를 찾을 수 없습니다', 404);
    }
    return success(res, quotation);
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function createQuotation(req: Request, res: Response) {
  try {
    const companyId = req.companyContext?.ourCompanyId;
    if (!companyId || companyId === 'all') {
      return error(res, 'VALIDATION', '회사를 선택해주세요', 400);
    }

    const {
      direction, projectId, title, quotationDate, validUntil, paymentTerms,
      counterpartId, contactName, contactPhone, contactEmail,
      defaultTaxRate = 10, items,
    } = req.body;

    if (!direction || !['SALES', 'PURCHASE'].includes(direction)) {
      return error(res, 'VALIDATION', 'direction은 SALES 또는 PURCHASE이어야 합니다', 400);
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return error(res, 'VALIDATION', '품목을 1개 이상 입력해주세요', 400);
    }

    // Get company prefix
    const ourCompany = await prisma.ourCompany.findUnique({ where: { id: companyId } });
    if (!ourCompany) return error(res, 'NOT_FOUND', '회사를 찾을 수 없습니다', 404);

    const quotationNo = await generateDocNumber(companyId, 'QUOTATION', ourCompany.quotationPrefix);
    const { processed, supplyAmount, taxAmount, totalAmount } = processItems(items, defaultTaxRate);

    // Get author info
    const author = await prisma.employee.findUnique({ where: { id: req.user!.id } });

    const quotation = await prisma.quotation.create({
      data: {
        ourCompanyId: companyId,
        projectId: projectId || null,
        quotationNo,
        direction,
        title: title || null,
        quotationDate: quotationDate ? new Date(quotationDate) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        paymentTerms: paymentTerms || null,
        counterpartId: counterpartId || null,
        contactName: contactName || null,
        contactPhone: contactPhone || null,
        contactEmail: contactEmail || null,
        authorId: req.user!.id,
        authorName: author?.name || null,
        authorPosition: author?.position || null,
        authorPhone: author?.phone || null,
        authorEmail: author?.email || null,
        defaultTaxRate,
        supplyAmount,
        taxAmount,
        totalAmount,
        createdById: req.user!.id,
        items: { create: processed },
      },
      include: quotationIncludes,
    });

    // Save initial revision (Rev.0)
    await prisma.quotationRevision.create({
      data: {
        quotationId: quotation.id,
        revision: 0,
        snapshot: JSON.stringify({ items: processed, supplyAmount, taxAmount, totalAmount }),
        changeNote: '최초 생성',
        changedById: req.user!.id,
      },
    });

    return success(res, quotation, 201);
  } catch (e) {
    console.error('createQuotation error:', e);
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function updateQuotation(req: Request, res: Response) {
  try {
    const existing = await prisma.quotation.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'NOT_FOUND', '견적서를 찾을 수 없습니다', 404);
    if (existing.isConfirmed) return error(res, 'CONFLICT', '확정된 견적서는 수정할 수 없습니다', 409);

    const {
      title, quotationDate, validUntil, paymentTerms,
      counterpartId, contactName, contactPhone, contactEmail,
      defaultTaxRate, items,
    } = req.body;

    const data: Prisma.QuotationUpdateInput = {};
    if (title !== undefined) data.title = title;
    if (quotationDate !== undefined) data.quotationDate = new Date(quotationDate);
    if (validUntil !== undefined) data.validUntil = validUntil ? new Date(validUntil) : null;
    if (paymentTerms !== undefined) data.paymentTerms = paymentTerms;
    if (counterpartId !== undefined) data.counterpart = counterpartId ? { connect: { id: counterpartId } } : { disconnect: true };
    if (contactName !== undefined) data.contactName = contactName;
    if (contactPhone !== undefined) data.contactPhone = contactPhone;
    if (contactEmail !== undefined) data.contactEmail = contactEmail;
    if (defaultTaxRate !== undefined) data.defaultTaxRate = defaultTaxRate;

    // If items provided, replace all
    if (items && Array.isArray(items) && items.length > 0) {
      const rate = defaultTaxRate ?? existing.defaultTaxRate;
      const { processed, supplyAmount, taxAmount, totalAmount } = processItems(items, rate);
      data.supplyAmount = supplyAmount;
      data.taxAmount = taxAmount;
      data.totalAmount = totalAmount;

      await prisma.quotationItem.deleteMany({ where: { quotationId: req.params.id } });
      await prisma.quotationItem.createMany({
        data: processed.map(item => ({ ...item, quotationId: req.params.id })),
      });
    }

    const updated = await prisma.quotation.update({
      where: { id: req.params.id },
      data,
      include: quotationIncludes,
    });

    return success(res, updated);
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function deleteQuotation(req: Request, res: Response) {
  try {
    const existing = await prisma.quotation.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'NOT_FOUND', '견적서를 찾을 수 없습니다', 404);
    if (existing.isConfirmed) return error(res, 'CONFLICT', '확정된 견적서는 삭제할 수 없습니다', 409);

    await prisma.quotation.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

// ─── Actions ────────────────────────────────────────────────────────────────

export async function confirmQuotation(req: Request, res: Response) {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: { project: true },
    });
    if (!quotation) return error(res, 'NOT_FOUND', '견적서를 찾을 수 없습니다', 404);
    if (quotation.isConfirmed) return error(res, 'CONFLICT', '이미 확정된 견적서입니다', 409);

    const note = req.body.note || '';

    // Confirm quotation
    const updated = await prisma.quotation.update({
      where: { id: req.params.id },
      data: {
        isConfirmed: true,
        confirmedAt: new Date(),
        status: 'CONFIRMED',
      },
      include: quotationIncludes,
    });

    // Update project confirmed amounts if linked
    if (quotation.projectId) {
      // Recalculate all confirmed amounts for this project
      const confirmed = await prisma.quotation.findMany({
        where: { projectId: quotation.projectId, isConfirmed: true },
      });

      let salesAmount = 0, salesTax = 0, purchaseAmount = 0, purchaseTax = 0;
      for (const q of confirmed) {
        if (q.direction === 'SALES') {
          salesAmount += q.supplyAmount;
          salesTax += q.taxAmount;
        } else {
          purchaseAmount += q.supplyAmount;
          purchaseTax += q.taxAmount;
        }
      }

      await prisma.project.update({
        where: { id: quotation.projectId },
        data: {
          confirmedSalesAmount: salesAmount,
          confirmedSalesTax: salesTax,
          confirmedPurchaseAmount: purchaseAmount,
          confirmedPurchaseTax: purchaseTax,
        },
      });

      // Project memo
      await prisma.projectMemo.create({
        data: {
          projectId: quotation.projectId,
          authorId: req.user!.id,
          type: 'SYSTEM',
          content: `견적서 ${quotation.quotationNo} (${quotation.direction === 'SALES' ? '매출' : '매입'}) 확정. ${note}`,
        },
      });

      // Auto-create Invoice (NOT_ISSUED)
      await prisma.invoice.create({
        data: {
          ourCompanyId: quotation.ourCompanyId,
          projectId: quotation.projectId,
          direction: quotation.direction,
          quotationId: quotation.id,
          counterpartId: quotation.counterpartId,
          supplyAmount: quotation.supplyAmount,
          taxAmount: quotation.taxAmount,
          totalAmount: quotation.totalAmount,
        },
      });

      // Auto-create calendar event for payment due (30 days from confirm)
      if (quotation.project?.managerId) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        const dirLabel = quotation.direction === 'SALES' ? '매출' : '매입';
        await prisma.calendarEvent.create({
          data: {
            title: `[${dirLabel} 결제] ${quotation.project.name}`,
            description: `견적서 ${quotation.quotationNo} 확정 기준 결제 마감일`,
            startTime: dueDate,
            endTime: dueDate,
            allDay: true,
            eventType: 'COMPANY',
            ownerId: quotation.project.managerId,
          },
        });
      }
    }

    return success(res, { quotation: updated });
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function voidQuotation(req: Request, res: Response) {
  try {
    const quotation = await prisma.quotation.findUnique({ where: { id: req.params.id } });
    if (!quotation) return error(res, 'NOT_FOUND', '견적서를 찾을 수 없습니다', 404);

    const updated = await prisma.quotation.update({
      where: { id: req.params.id },
      data: { status: 'VOID', isConfirmed: false },
      include: quotationIncludes,
    });

    // Recalculate project if linked
    if (quotation.projectId && quotation.isConfirmed) {
      const confirmed = await prisma.quotation.findMany({
        where: { projectId: quotation.projectId, isConfirmed: true, id: { not: req.params.id } },
      });

      let salesAmount = 0, salesTax = 0, purchaseAmount = 0, purchaseTax = 0;
      for (const q of confirmed) {
        if (q.direction === 'SALES') { salesAmount += q.supplyAmount; salesTax += q.taxAmount; }
        else { purchaseAmount += q.supplyAmount; purchaseTax += q.taxAmount; }
      }

      await prisma.project.update({
        where: { id: quotation.projectId },
        data: { confirmedSalesAmount: salesAmount, confirmedSalesTax: salesTax, confirmedPurchaseAmount: purchaseAmount, confirmedPurchaseTax: purchaseTax },
      });
    }

    return success(res, updated);
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function createRevision(req: Request, res: Response) {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });
    if (!quotation) return error(res, 'NOT_FOUND', '견적서를 찾을 수 없습니다', 404);
    if (quotation.isConfirmed) return error(res, 'CONFLICT', '확정된 견적서는 리비전할 수 없습니다', 409);

    const { changeNote, items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return error(res, 'VALIDATION', '품목을 1개 이상 입력해주세요', 400);
    }

    // Save current state as revision snapshot
    await prisma.quotationRevision.create({
      data: {
        quotationId: quotation.id,
        revision: quotation.revision,
        snapshot: JSON.stringify({
          items: quotation.items,
          supplyAmount: quotation.supplyAmount,
          taxAmount: quotation.taxAmount,
          totalAmount: quotation.totalAmount,
        }),
        changeNote: changeNote || null,
        changedById: req.user!.id,
      },
    });

    // Update with new items
    const { processed, supplyAmount, taxAmount, totalAmount } = processItems(items, quotation.defaultTaxRate);

    await prisma.quotationItem.deleteMany({ where: { quotationId: quotation.id } });
    await prisma.quotationItem.createMany({
      data: processed.map(item => ({ ...item, quotationId: quotation.id })),
    });

    const updated = await prisma.quotation.update({
      where: { id: quotation.id },
      data: {
        revision: quotation.revision + 1,
        supplyAmount,
        taxAmount,
        totalAmount,
      },
      include: quotationIncludes,
    });

    return success(res, updated);
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function getRevisions(req: Request, res: Response) {
  try {
    const revisions = await prisma.quotationRevision.findMany({
      where: { quotationId: req.params.id },
      include: { changedBy: { select: { id: true, name: true } } },
      orderBy: { revision: 'desc' },
    });
    return success(res, revisions);
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function duplicateQuotation(req: Request, res: Response) {
  try {
    const original = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: { items: true, ourCompany: true },
    });
    if (!original) return error(res, 'NOT_FOUND', '견적서를 찾을 수 없습니다', 404);

    const quotationNo = await generateDocNumber(
      original.ourCompanyId, 'QUOTATION', original.ourCompany.quotationPrefix,
    );

    const quotation = await prisma.quotation.create({
      data: {
        ourCompanyId: original.ourCompanyId,
        projectId: original.projectId,
        quotationNo,
        direction: original.direction,
        title: original.title ? `${original.title} (복사)` : null,
        quotationDate: new Date(),
        validUntil: original.validUntil,
        paymentTerms: original.paymentTerms,
        counterpartId: original.counterpartId,
        contactName: original.contactName,
        contactPhone: original.contactPhone,
        contactEmail: original.contactEmail,
        authorId: req.user!.id,
        defaultTaxRate: original.defaultTaxRate,
        supplyAmount: original.supplyAmount,
        taxAmount: original.taxAmount,
        totalAmount: original.totalAmount,
        createdById: req.user!.id,
        items: {
          create: original.items.map(item => ({
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
      include: quotationIncludes,
    });

    return success(res, quotation, 201);
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function generateSalesFromPurchase(req: Request, res: Response) {
  try {
    const purchase = await prisma.quotation.findUnique({
      where: { id: req.params.id },
      include: { items: true, ourCompany: true },
    });
    if (!purchase) return error(res, 'NOT_FOUND', '견적서를 찾을 수 없습니다', 404);
    if (purchase.direction !== 'PURCHASE') {
      return error(res, 'VALIDATION', '매입 견적서만 매출 견적서를 생성할 수 있습니다', 400);
    }

    const { marginType = 'rate', marginValue = 25 } = req.body;

    // Apply margin to items
    const salesItems = purchase.items.map(item => {
      let newUnitPrice = item.unitPrice;
      if (marginType === 'rate') {
        newUnitPrice = Math.ceil(item.unitPrice * (1 + marginValue / 100));
      } else {
        newUnitPrice = item.unitPrice + Math.ceil(marginValue / purchase.items.length);
      }
      const amount = calculateItemAmount(item.quantity, newUnitPrice);
      return {
        name: item.name,
        spec: item.spec,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: newUnitPrice,
        amount,
        taxRate: item.taxRate,
        remark: item.remark,
        sortOrder: item.sortOrder,
      };
    });

    const supplyAmount = salesItems.reduce((sum, i) => sum + i.amount, 0);
    const { taxAmount, totalAmount } = calculateTaxSummary(supplyAmount, purchase.defaultTaxRate);

    const quotationNo = await generateDocNumber(
      purchase.ourCompanyId, 'QUOTATION', purchase.ourCompany.quotationPrefix,
    );

    const actualMarginRate = purchase.supplyAmount > 0
      ? ((supplyAmount - purchase.supplyAmount) / purchase.supplyAmount) * 100
      : 0;

    const salesQuotation = await prisma.quotation.create({
      data: {
        ourCompanyId: purchase.ourCompanyId,
        projectId: purchase.projectId,
        quotationNo,
        direction: 'SALES',
        title: purchase.title ? `${purchase.title} (매출)` : null,
        quotationDate: new Date(),
        paymentTerms: purchase.paymentTerms,
        defaultTaxRate: purchase.defaultTaxRate,
        supplyAmount,
        taxAmount,
        totalAmount,
        sourceQuotationId: purchase.id,
        marginRate: Math.round(actualMarginRate * 10) / 10,
        authorId: req.user!.id,
        createdById: req.user!.id,
        items: { create: salesItems },
      },
      include: quotationIncludes,
    });

    return success(res, salesQuotation, 201);
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}
