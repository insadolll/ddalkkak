import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import prisma from '../../utils/prisma';
import { success, error, successList, parsePagination } from '../../utils/response';

const employeeSelect = {
  id: true, employeeNo: true, email: true, name: true, role: true,
  position: true, phone: true, isActive: true, joinDate: true,
  ourCompanyId: true, departmentId: true, createdAt: true,
  ourCompany: { select: { id: true, code: true, name: true } },
  department: { select: { id: true, name: true } },
} as const;

export async function listEmployees(req: Request, res: Response) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const companyId = req.companyContext?.ourCompanyId;
    const { role, isActive, search } = req.query;

    const where: Prisma.EmployeeWhereInput = {};
    if (companyId && companyId !== 'all') where.ourCompanyId = companyId;
    if (role) where.role = role as Prisma.EnumRoleFilter;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { employeeNo: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.employee.findMany({ where, select: employeeSelect, orderBy: { name: 'asc' }, skip, take: limit }),
      prisma.employee.count({ where }),
    ]);

    return successList(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function getEmployee(req: Request, res: Response) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      select: employeeSelect,
    });
    if (!employee) return error(res, 'NOT_FOUND', '직원을 찾을 수 없습니다', 404);
    return success(res, employee);
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function createEmployee(req: Request, res: Response) {
  try {
    const { employeeNo, email, password, name, role, position, phone, ourCompanyId, departmentId, joinDate, smtpPassword } = req.body;
    if (!employeeNo || !email || !password || !name || !ourCompanyId || !departmentId) {
      return error(res, 'VALIDATION', '필수 항목을 모두 입력해주세요', 400);
    }

    const existing = await prisma.employee.findFirst({
      where: { OR: [{ email }, { employeeNo }] },
    });
    if (existing) {
      return error(res, 'CONFLICT', '이미 존재하는 이메일 또는 사번입니다', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const employee = await prisma.employee.create({
      data: {
        employeeNo, email, passwordHash, name,
        role: role || 'EMPLOYEE',
        position: position || null,
        phone: phone || null,
        ourCompanyId, departmentId,
        joinDate: joinDate ? new Date(joinDate) : new Date(),
        smtpPassword: smtpPassword || null,
      },
      select: employeeSelect,
    });

    return success(res, employee, 201);
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function updateEmployee(req: Request, res: Response) {
  try {
    const existing = await prisma.employee.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'NOT_FOUND', '직원을 찾을 수 없습니다', 404);

    const allowedFields = ['name', 'role', 'position', 'phone', 'ourCompanyId', 'departmentId', 'isActive', 'smtpPassword'];
    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    }

    // Password reset
    if (req.body.password) {
      data.passwordHash = await bcrypt.hash(req.body.password, 10);
    }

    const updated = await prisma.employee.update({
      where: { id: req.params.id },
      data,
      select: employeeSelect,
    });

    return success(res, updated);
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}

export async function listDepartments(_req: Request, res: Response) {
  try {
    const departments = await prisma.department.findMany({ orderBy: { name: 'asc' } });
    return success(res, departments);
  } catch {
    return error(res, 'INTERNAL', '서버 오류가 발생했습니다', 500);
  }
}
