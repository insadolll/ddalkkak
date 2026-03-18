import { Request, Response } from 'express';
import prisma from '../../utils/prisma';
import { success, error } from '../../utils/response';

export async function listOurCompanies(_req: Request, res: Response) {
  try {
    const companies = await prisma.ourCompany.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        nameEn: true,
        bizNumber: true,
        representative: true,
        email: true,
        domain: true,
        quotationPrefix: true,
        poPrefix: true,
        dsPrefix: true,
      },
      orderBy: { code: 'asc' },
    });
    return success(res, companies);
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function getOurCompany(req: Request, res: Response) {
  try {
    const company = await prisma.ourCompany.findUnique({
      where: { id: req.params.id },
    });
    if (!company) {
      return error(res, 'NOT_FOUND', '회사를 찾을 수 없습니다', 404);
    }

    // Mask sensitive fields for non-admin
    if (req.user?.role !== 'ADMIN') {
      company.smtpPassword = null;
      company.imapPassword = null;
    }

    return success(res, company);
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function updateOurCompany(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.ourCompany.findUnique({ where: { id } });
    if (!existing) {
      return error(res, 'NOT_FOUND', '회사를 찾을 수 없습니다', 404);
    }

    const allowedFields = [
      'name', 'nameEn', 'bizNumber', 'representative', 'address',
      'phone', 'fax', 'email', 'domain', 'logoPath', 'stampPath',
      'smtpHost', 'smtpPort', 'smtpUser', 'smtpPassword', 'smtpFromName',
      'imapHost', 'imapPort', 'imapUser', 'imapPassword', 'imapFolder', 'imapEnabled',
      'quotationPrefix', 'poPrefix', 'dsPrefix',
    ];

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        data[field] = req.body[field];
      }
    }

    const updated = await prisma.ourCompany.update({ where: { id }, data });
    return success(res, updated);
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}
