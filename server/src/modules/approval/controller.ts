import { Request, Response } from 'express';
import prisma from '../../utils/prisma';
import { success, error, successList, parsePagination } from '../../utils/response';
import { ApprovalStatus, StepStatus } from '@prisma/client';

const approvalInclude = {
  author: { select: { id: true, name: true, employeeNo: true } },
  steps: {
    orderBy: { stepOrder: 'asc' as const },
    include: {
      approver: { select: { id: true, name: true, employeeNo: true } },
    },
  },
};

// ─── Create Document ────────────────────────────────────────────────────────

export async function createDocument(req: Request, res: Response) {
  try {
    const { title, content, category, approvalLine } = req.body;

    if (!title || !content || !approvalLine || !Array.isArray(approvalLine)) {
      return error(res, 'VALIDATION', 'title, content, and approvalLine are required');
    }

    const doc = await prisma.approvalDocument.create({
      data: {
        title,
        content,
        category,
        authorId: req.user!.id,
        status: ApprovalStatus.DRAFT,
        currentStep: 0,
        totalSteps: approvalLine.length,
        steps: {
          create: approvalLine.map((s: { stepOrder: number; approverId: string }) => ({
            stepOrder: s.stepOrder,
            approverId: s.approverId,
            status: StepStatus.PENDING,
          })),
        },
      },
      include: approvalInclude,
    });

    return success(res, doc, 201);
  } catch {
    return error(res, 'INTERNAL', 'Failed to create approval document', 500);
  }
}

// ─── Submit Document ────────────────────────────────────────────────────────

export async function submitDocument(req: Request, res: Response) {
  try {
    const doc = await prisma.approvalDocument.findUnique({ where: { id: req.params.id } });
    if (!doc) return error(res, 'NOT_FOUND', 'Document not found', 404);
    if (doc.authorId !== req.user!.id) return error(res, 'FORBIDDEN', 'Only author can submit', 403);
    if (doc.status !== ApprovalStatus.DRAFT) return error(res, 'NOT_DRAFT', 'Document is not in DRAFT status');
    if (doc.totalSteps === 0) return error(res, 'NO_STEPS', 'No approval steps defined');

    const updated = await prisma.approvalDocument.update({
      where: { id: req.params.id },
      data: {
        status: ApprovalStatus.PENDING,
        currentStep: 1,
        submittedAt: new Date(),
      },
    });

    return success(res, updated);
  } catch {
    return error(res, 'INTERNAL', 'Failed to submit document', 500);
  }
}

// ─── List Documents ─────────────────────────────────────────────────────────

export async function listDocuments(req: Request, res: Response) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { status, authorId, approverId, category } = req.query;
    const { id: userId, role } = req.user!;

    const where: Record<string, unknown> = {};

    if (role === 'ADMIN') {
      if (authorId) where.authorId = authorId as string;
      if (approverId) where.steps = { some: { approverId: approverId as string } };
    } else {
      where.OR = [
        { authorId: userId },
        { steps: { some: { approverId: userId } } },
      ];
      if (authorId) where.authorId = authorId as string;
    }

    if (status) where.status = status as string;
    if (category) where.category = category as string;

    const [data, total] = await Promise.all([
      prisma.approvalDocument.findMany({
        where,
        include: {
          author: { select: { id: true, name: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.approvalDocument.count({ where }),
    ]);

    return successList(res, data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return error(res, 'INTERNAL', 'Failed to list documents', 500);
  }
}

// ─── Get Document By ID ─────────────────────────────────────────────────────

export async function getDocumentById(req: Request, res: Response) {
  try {
    const doc = await prisma.approvalDocument.findUnique({
      where: { id: req.params.id },
      include: approvalInclude,
    });

    if (!doc) return error(res, 'NOT_FOUND', 'Document not found', 404);

    const { id: userId, role } = req.user!;
    const isAuthor = doc.authorId === userId;
    const isApprover = doc.steps.some((s) => s.approverId === userId);

    if (role !== 'ADMIN' && !isAuthor && !isApprover) {
      return error(res, 'FORBIDDEN', 'Insufficient permissions', 403);
    }

    return success(res, doc);
  } catch {
    return error(res, 'INTERNAL', 'Failed to get document', 500);
  }
}

// ─── Update Document ────────────────────────────────────────────────────────

export async function updateDocument(req: Request, res: Response) {
  try {
    const { title, content, category, approvalLine } = req.body;

    const doc = await prisma.approvalDocument.findUnique({ where: { id: req.params.id } });
    if (!doc) return error(res, 'NOT_FOUND', 'Document not found', 404);
    if (doc.authorId !== req.user!.id) return error(res, 'FORBIDDEN', 'Only author can update', 403);
    if (doc.status !== ApprovalStatus.DRAFT) return error(res, 'NOT_DRAFT', 'Can only update DRAFT documents');

    if (approvalLine && Array.isArray(approvalLine)) {
      await prisma.approvalStep.deleteMany({ where: { approvalDocumentId: req.params.id } });
      const updated = await prisma.approvalDocument.update({
        where: { id: req.params.id },
        data: {
          title,
          content,
          category,
          totalSteps: approvalLine.length,
          steps: {
            create: approvalLine.map((s: { stepOrder: number; approverId: string }) => ({
              stepOrder: s.stepOrder,
              approverId: s.approverId,
              status: StepStatus.PENDING,
            })),
          },
        },
        include: approvalInclude,
      });
      return success(res, updated);
    }

    const updated = await prisma.approvalDocument.update({
      where: { id: req.params.id },
      data: { title, content, category },
      include: approvalInclude,
    });

    return success(res, updated);
  } catch {
    return error(res, 'INTERNAL', 'Failed to update document', 500);
  }
}

// ─── Approve Step ───────────────────────────────────────────────────────────

export async function approveStep(req: Request, res: Response) {
  try {
    const { comment } = req.body;
    const approverId = req.user!.id;

    const doc = await prisma.approvalDocument.findUnique({
      where: { id: req.params.id },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });

    if (!doc) return error(res, 'NOT_FOUND', 'Document not found', 404);
    if (doc.status !== ApprovalStatus.PENDING) return error(res, 'NOT_PENDING', 'Document is not in PENDING status');

    const currentStepRecord = doc.steps.find((s) => s.stepOrder === doc.currentStep);
    if (!currentStepRecord) return error(res, 'NO_STEP', 'Current step not found');
    if (currentStepRecord.approverId !== approverId) return error(res, 'NOT_APPROVER', 'You are not the current approver', 403);

    const isLastStep = doc.currentStep === doc.totalSteps;

    const result = await prisma.$transaction(async (tx) => {
      await tx.approvalStep.update({
        where: { id: currentStepRecord.id },
        data: { status: StepStatus.APPROVED, comment, actionAt: new Date() },
      });

      const nextStep = doc.currentStep + 1;
      const newStatus = isLastStep ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING;

      const updated = await tx.approvalDocument.update({
        where: { id: req.params.id },
        data: {
          currentStep: isLastStep ? doc.currentStep : nextStep,
          status: newStatus,
          completedAt: isLastStep ? new Date() : undefined,
        },
      });

      return {
        id: updated.id,
        status: updated.status,
        currentStep: updated.currentStep,
        stepResult: {
          stepOrder: currentStepRecord.stepOrder,
          status: 'APPROVED',
          comment,
        },
      };
    });

    return success(res, result);
  } catch {
    return error(res, 'INTERNAL', 'Failed to approve step', 500);
  }
}

// ─── Reject Step ────────────────────────────────────────────────────────────

export async function rejectStep(req: Request, res: Response) {
  try {
    const { comment } = req.body;
    const approverId = req.user!.id;

    const doc = await prisma.approvalDocument.findUnique({
      where: { id: req.params.id },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });

    if (!doc) return error(res, 'NOT_FOUND', 'Document not found', 404);
    if (doc.status !== ApprovalStatus.PENDING) return error(res, 'NOT_PENDING', 'Document is not in PENDING status');

    const currentStepRecord = doc.steps.find((s) => s.stepOrder === doc.currentStep);
    if (!currentStepRecord) return error(res, 'NO_STEP', 'Current step not found');
    if (currentStepRecord.approverId !== approverId) return error(res, 'NOT_APPROVER', 'You are not the current approver', 403);

    const result = await prisma.$transaction(async (tx) => {
      await tx.approvalStep.update({
        where: { id: currentStepRecord.id },
        data: { status: StepStatus.REJECTED, comment, actionAt: new Date() },
      });

      const updated = await tx.approvalDocument.update({
        where: { id: req.params.id },
        data: { status: ApprovalStatus.REJECTED, completedAt: new Date() },
      });

      return {
        id: updated.id,
        status: updated.status,
        completedAt: updated.completedAt,
      };
    });

    return success(res, result);
  } catch {
    return error(res, 'INTERNAL', 'Failed to reject step', 500);
  }
}

// ─── Delete Document ────────────────────────────────────────────────────────

export async function deleteDocument(req: Request, res: Response) {
  try {
    const doc = await prisma.approvalDocument.findUnique({ where: { id: req.params.id } });
    if (!doc) return error(res, 'NOT_FOUND', 'Document not found', 404);
    if (doc.authorId !== req.user!.id) return error(res, 'FORBIDDEN', 'Only author can delete', 403);
    if (doc.status !== ApprovalStatus.DRAFT) return error(res, 'NOT_DRAFT', 'Can only delete DRAFT documents');

    await prisma.approvalDocument.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch {
    return error(res, 'INTERNAL', 'Failed to delete document', 500);
  }
}
