import { Request, Response } from 'express';
import prisma from '../../utils/prisma';
import { success, error, successList, parsePagination } from '../../utils/response';

export async function listCompanies(req: Request, res: Response) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const search = req.query.search as string | undefined;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { bizNumber: { contains: search } },
            { code: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.company.findMany({
        where,
        include: { contacts: true, _count: { select: { clientProjects: true, supplierProjects: true } } },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.company.count({ where }),
    ]);

    return successList(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function getCompany(req: Request, res: Response) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.params.id },
      include: { contacts: true },
    });
    if (!company) {
      return error(res, 'NOT_FOUND', '거래처를 찾을 수 없습니다', 404);
    }
    return success(res, company);
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function createCompany(req: Request, res: Response) {
  try {
    const { name, code, bizNumber, representative, address, phone, taxEmail, memo } = req.body;
    if (!name) {
      return error(res, 'VALIDATION', '거래처명은 필수입니다', 400);
    }

    const existing = await prisma.company.findUnique({ where: { name } });
    if (existing) {
      return error(res, 'CONFLICT', '이미 존재하는 거래처명입니다', 409);
    }

    const company = await prisma.company.create({
      data: {
        name, code, bizNumber, representative, address, phone, taxEmail, memo,
        createdById: req.user?.id,
      },
    });
    return success(res, company, 201);
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function updateCompany(req: Request, res: Response) {
  try {
    const existing = await prisma.company.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return error(res, 'NOT_FOUND', '거래처를 찾을 수 없습니다', 404);
    }

    const allowedFields = ['name', 'code', 'bizNumber', 'representative', 'address', 'phone', 'taxEmail', 'memo'];
    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    }

    const updated = await prisma.company.update({ where: { id: req.params.id }, data });
    return success(res, updated);
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function deleteCompany(req: Request, res: Response) {
  try {
    const existing = await prisma.company.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return error(res, 'NOT_FOUND', '거래처를 찾을 수 없습니다', 404);
    }

    await prisma.company.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

// --- CompanyContact ---

export async function createContact(req: Request, res: Response) {
  try {
    const { companyId } = req.params;
    const { name, position, phone, email, memo } = req.body;
    if (!name) {
      return error(res, 'VALIDATION', '담당자명은 필수입니다', 400);
    }

    const contact = await prisma.companyContact.create({
      data: { companyId, name, position, phone, email, memo, createdById: req.user?.id },
    });
    return success(res, contact, 201);
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function updateContact(req: Request, res: Response) {
  try {
    const { contactId } = req.params;
    const allowedFields = ['name', 'position', 'phone', 'email', 'memo'];
    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    }

    const updated = await prisma.companyContact.update({ where: { id: contactId }, data });
    return success(res, updated);
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function deleteContact(req: Request, res: Response) {
  try {
    await prisma.companyContact.delete({ where: { id: req.params.contactId } });
    return res.status(204).send();
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}
