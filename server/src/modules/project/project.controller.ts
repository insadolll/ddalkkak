import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../../utils/prisma';
import { success, error, successList, parsePagination } from '../../utils/response';

export async function listProjects(req: Request, res: Response) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const companyId = req.companyContext?.ourCompanyId;
    const { status, stage, clientId, managerId, search } = req.query;

    const where: Prisma.ProjectWhereInput = {};

    // Company filter
    if (companyId && companyId !== 'all') {
      where.ourCompanyId = companyId;
    }

    // EMPLOYEE: only their managed projects
    if (req.user?.role === 'EMPLOYEE') {
      where.managerId = req.user.id;
    }

    if (status) where.status = status as Prisma.EnumProjectStatusFilter;
    if (stage) where.stage = stage as Prisma.EnumProjectStageFilter;
    if (clientId) where.clientId = clientId as string;
    if (managerId) where.managerId = managerId as string;

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { client: { name: { contains: search as string, mode: 'insensitive' } } },
        { supplier: { name: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          ourCompany: { select: { id: true, code: true, name: true } },
          client: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
          manager: { select: { id: true, name: true, position: true } },
          _count: { select: { quotations: true, invoices: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.project.count({ where }),
    ]);

    return successList(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function getProject(req: Request, res: Response) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        ourCompany: { select: { id: true, code: true, name: true } },
        client: { select: { id: true, name: true, contacts: true } },
        supplier: { select: { id: true, name: true, contacts: true } },
        manager: { select: { id: true, name: true, position: true, email: true, phone: true } },
        quotations: {
          select: {
            id: true, quotationNo: true, direction: true, title: true, status: true,
            isConfirmed: true, totalAmount: true, revision: true, updatedAt: true,
            counterpart: { select: { id: true, name: true } },
          },
          orderBy: { updatedAt: 'desc' },
        },
        memos: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: { select: { attachments: true, invoices: true, purchaseOrders: true } },
      },
    });

    if (!project) {
      return error(res, 'NOT_FOUND', '프로젝트를 찾을 수 없습니다', 404);
    }

    // EMPLOYEE: only their managed projects
    if (req.user?.role === 'EMPLOYEE' && project.managerId !== req.user.id) {
      return error(res, 'FORBIDDEN', '접근 권한이 없습니다', 403);
    }

    return success(res, project);
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function createProject(req: Request, res: Response) {
  try {
    const companyId = req.companyContext?.ourCompanyId;
    if (!companyId || companyId === 'all') {
      return error(res, 'VALIDATION', '회사를 선택해주세요', 400);
    }

    const { name, clientId, supplierId, managerId, startDate, endDate, memo } = req.body;
    if (!name) {
      return error(res, 'VALIDATION', '프로젝트명은 필수입니다', 400);
    }

    const project = await prisma.project.create({
      data: {
        ourCompanyId: companyId,
        name,
        clientId: clientId || null,
        supplierId: supplierId || null,
        managerId: managerId || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        memo: memo || null,
      },
      include: {
        ourCompany: { select: { id: true, code: true, name: true } },
        client: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
        manager: { select: { id: true, name: true } },
      },
    });

    // System memo
    await prisma.projectMemo.create({
      data: {
        projectId: project.id,
        authorId: req.user!.id,
        type: 'SYSTEM',
        content: '프로젝트가 생성되었습니다.',
      },
    });

    return success(res, project, 201);
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function updateProject(req: Request, res: Response) {
  try {
    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return error(res, 'NOT_FOUND', '프로젝트를 찾을 수 없습니다', 404);
    }

    const allowedFields = ['name', 'clientId', 'supplierId', 'managerId', 'startDate', 'endDate', 'status', 'memo'];
    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (['startDate', 'endDate'].includes(field) && req.body[field]) {
          data[field] = new Date(req.body[field]);
        } else {
          data[field] = req.body[field] || null;
        }
      }
    }

    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data,
      include: {
        ourCompany: { select: { id: true, code: true, name: true } },
        client: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
        manager: { select: { id: true, name: true } },
      },
    });

    return success(res, updated);
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function deleteProject(req: Request, res: Response) {
  try {
    const existing = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { quotations: true, invoices: true } } },
    });
    if (!existing) {
      return error(res, 'NOT_FOUND', '프로젝트를 찾을 수 없습니다', 404);
    }

    if (existing._count.quotations > 0 || existing._count.invoices > 0) {
      return error(res, 'CONFLICT', '견적서 또는 계산서가 연결된 프로젝트는 삭제할 수 없습니다', 409);
    }

    await prisma.project.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function updateStage(req: Request, res: Response) {
  try {
    const { stage } = req.body;
    if (!stage) {
      return error(res, 'VALIDATION', '단계를 선택해주세요', 400);
    }

    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return error(res, 'NOT_FOUND', '프로젝트를 찾을 수 없습니다', 404);
    }

    const oldStage = existing.stage;

    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: { stage },
    });

    // Stage change memo
    await prisma.projectMemo.create({
      data: {
        projectId: updated.id,
        authorId: req.user!.id,
        type: 'STAGE_CHANGE',
        content: `단계 변경: ${oldStage} → ${stage}`,
      },
    });

    return success(res, updated);
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}
