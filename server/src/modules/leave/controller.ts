import { Request, Response } from 'express';
import prisma from '../../utils/prisma';
import { success, error, successList, parsePagination } from '../../utils/response';
import { LeaveType, LeaveStatus } from '@prisma/client';

// ─── Helpers ────────────────────────────────────────────────────────────────

function calcWorkingDays(start: Date, end: Date): number {
  let count = 0;
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);

  while (cur <= endDay) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

const leaveInclude = {
  employee: { select: { id: true, name: true, employeeNo: true } },
  reviewer: { select: { id: true, name: true } },
};

// ─── Create Leave ───────────────────────────────────────────────────────────

export async function createLeave(req: Request, res: Response) {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate) {
      return error(res, 'VALIDATION', 'leaveType, startDate, endDate are required');
    }

    const validTypes: LeaveType[] = ['ANNUAL', 'SICK', 'HALF', 'OTHER'];
    if (!validTypes.includes(leaveType)) {
      return error(res, 'VALIDATION', 'Invalid leaveType');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      return error(res, 'INVALID_DATES', 'Start date must be before or equal to end date');
    }

    const totalDays = calcWorkingDays(start, end);

    const leave = await prisma.leave.create({
      data: {
        employeeId: req.user!.id,
        leaveType: leaveType as LeaveType,
        startDate: start,
        endDate: end,
        totalDays,
        reason,
        status: LeaveStatus.PENDING,
      },
    });

    return success(res, leave, 201);
  } catch {
    return error(res, 'INTERNAL', 'Failed to create leave request', 500);
  }
}

// ─── List Leaves ────────────────────────────────────────────────────────────

export async function listLeaves(req: Request, res: Response) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { employeeId, status, startDate, endDate } = req.query;
    const { id: userId, role } = req.user!;

    const where: Record<string, unknown> = {};

    if (role === 'EMPLOYEE') {
      where.employeeId = userId;
    } else if (role === 'MANAGER') {
      const employee = await prisma.employee.findUnique({
        where: { id: userId },
        select: { departmentId: true },
      });
      where.employee = { departmentId: employee?.departmentId };
      if (employeeId) where.employeeId = employeeId as string;
    } else {
      // ADMIN / ACCOUNTANT
      if (employeeId) where.employeeId = employeeId as string;
    }

    if (status) where.status = status as string;
    if (startDate) where.startDate = { gte: new Date(startDate as string) };
    if (endDate) where.endDate = { lte: new Date(endDate as string) };

    const [data, total] = await Promise.all([
      prisma.leave.findMany({
        where,
        include: leaveInclude,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.leave.count({ where }),
    ]);

    return successList(res, data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return error(res, 'INTERNAL', 'Failed to list leaves', 500);
  }
}

// ─── Get Leave By ID ────────────────────────────────────────────────────────

export async function getLeaveById(req: Request, res: Response) {
  try {
    const leave = await prisma.leave.findUnique({
      where: { id: req.params.id },
      include: leaveInclude,
    });

    if (!leave) {
      return error(res, 'NOT_FOUND', 'Leave not found', 404);
    }

    const { id: userId, role } = req.user!;

    if (role === 'EMPLOYEE' && leave.employeeId !== userId) {
      return error(res, 'FORBIDDEN', 'Insufficient permissions', 403);
    }

    if (role === 'MANAGER') {
      const [leaveEmployee, manager] = await Promise.all([
        prisma.employee.findUnique({ where: { id: leave.employeeId }, select: { departmentId: true } }),
        prisma.employee.findUnique({ where: { id: userId }, select: { departmentId: true } }),
      ]);
      if (leaveEmployee?.departmentId !== manager?.departmentId) {
        return error(res, 'FORBIDDEN', 'Insufficient permissions', 403);
      }
    }

    return success(res, leave);
  } catch {
    return error(res, 'INTERNAL', 'Failed to get leave', 500);
  }
}

// ─── Update Leave Status (Approve/Reject) ───────────────────────────────────

export async function updateLeaveStatus(req: Request, res: Response) {
  try {
    const { status, reviewNote } = req.body;

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return error(res, 'VALIDATION', 'status must be APPROVED or REJECTED');
    }

    const leave = await prisma.leave.findUnique({ where: { id: req.params.id } });
    if (!leave) {
      return error(res, 'NOT_FOUND', 'Leave not found', 404);
    }
    if (leave.status !== LeaveStatus.PENDING) {
      return error(res, 'NOT_PENDING', 'Leave is not in PENDING status');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.leave.update({
        where: { id: req.params.id },
        data: {
          status: status as LeaveStatus,
          reviewerId: req.user!.id,
          reviewNote,
          reviewedAt: new Date(),
        },
        include: leaveInclude,
      });

      if (status === 'APPROVED' && leave.leaveType === LeaveType.ANNUAL) {
        await tx.leaveBalance.updateMany({
          where: { employeeId: leave.employeeId },
          data: {
            usedDays: { increment: leave.totalDays },
            remainingDays: { decrement: leave.totalDays },
          },
        });
      }

      return result;
    });

    return success(res, updated);
  } catch {
    return error(res, 'INTERNAL', 'Failed to update leave status', 500);
  }
}

// ─── Cancel Leave ───────────────────────────────────────────────────────────

export async function cancelLeave(req: Request, res: Response) {
  try {
    const leave = await prisma.leave.findUnique({ where: { id: req.params.id } });
    if (!leave) {
      return error(res, 'NOT_FOUND', 'Leave not found', 404);
    }
    if (leave.employeeId !== req.user!.id) {
      return error(res, 'FORBIDDEN', 'Cannot cancel another user\'s leave', 403);
    }
    if (leave.status !== LeaveStatus.PENDING) {
      return error(res, 'NOT_PENDING', 'Only pending leaves can be cancelled');
    }

    await prisma.leave.update({
      where: { id: req.params.id },
      data: { status: LeaveStatus.CANCELLED },
    });

    return success(res, { message: 'Leave request cancelled' });
  } catch {
    return error(res, 'INTERNAL', 'Failed to cancel leave', 500);
  }
}

// ─── Get Leave Balance ──────────────────────────────────────────────────────

export async function getLeaveBalance(req: Request, res: Response) {
  try {
    const balance = await prisma.leaveBalance.findFirst({
      where: { employeeId: req.user!.id },
    });

    if (!balance) {
      return error(res, 'NOT_FOUND', 'Leave balance not found', 404);
    }

    return success(res, {
      year: balance.year,
      totalDays: balance.totalDays,
      usedDays: balance.usedDays,
      remainingDays: balance.remainingDays,
    });
  } catch {
    return error(res, 'INTERNAL', 'Failed to get leave balance', 500);
  }
}
