import { Request, Response } from 'express';
import prisma from '../../utils/prisma';
import { success, error, successList, parsePagination } from '../../utils/response';

// ─── Create Suggestion ──────────────────────────────────────────────────────

export async function createSuggestion(req: Request, res: Response) {
  try {
    const { title, content, category, isAnonymous } = req.body;

    if (!title || !content) {
      return error(res, 'VALIDATION', 'title and content are required');
    }

    const suggestion = await prisma.suggestion.create({
      data: {
        authorId: req.user!.id,
        title,
        content,
        category: category ?? '기타',
        isAnonymous: isAnonymous ?? false,
      },
    });

    return success(res, suggestion, 201);
  } catch {
    return error(res, 'INTERNAL', 'Failed to create suggestion', 500);
  }
}

// ─── List All Suggestions (Admin) ───────────────────────────────────────────

export async function listSuggestions(req: Request, res: Response) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { status } = req.query;

    const where: Record<string, unknown> = {};
    if (status) where.status = status as string;

    const [data, total] = await Promise.all([
      prisma.suggestion.findMany({
        where,
        include: {
          author: {
            select: {
              id: true, name: true, departmentId: true,
              department: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.suggestion.count({ where }),
    ]);

    // Hide author info for anonymous suggestions
    const items = data.map((s) => ({
      ...s,
      author: s.isAnonymous ? null : s.author,
      authorId: s.isAnonymous ? null : s.authorId,
    }));

    return successList(res, items, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return error(res, 'INTERNAL', 'Failed to list suggestions', 500);
  }
}

// ─── Get My Suggestions ─────────────────────────────────────────────────────

export async function getMySuggestions(req: Request, res: Response) {
  try {
    const data = await prisma.suggestion.findMany({
      where: { authorId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });

    return success(res, data);
  } catch {
    return error(res, 'INTERNAL', 'Failed to get suggestions', 500);
  }
}

// ─── Get Suggestion By ID (Admin) ───────────────────────────────────────────

export async function getSuggestionById(req: Request, res: Response) {
  try {
    const suggestion = await prisma.suggestion.findUnique({
      where: { id: req.params.id },
      include: {
        author: {
          select: {
            id: true, name: true,
            department: { select: { name: true } },
          },
        },
      },
    });

    if (!suggestion) {
      return error(res, 'NOT_FOUND', 'Suggestion not found', 404);
    }

    return success(res, suggestion);
  } catch {
    return error(res, 'INTERNAL', 'Failed to get suggestion', 500);
  }
}

// ─── Update Suggestion Status (Admin) ───────────────────────────────────────

export async function updateSuggestionStatus(req: Request, res: Response) {
  try {
    const { status, adminNote } = req.body;

    if (!status || !['OPEN', 'REVIEWED', 'CLOSED'].includes(status)) {
      return error(res, 'VALIDATION', 'status must be OPEN, REVIEWED, or CLOSED');
    }

    const suggestion = await prisma.suggestion.update({
      where: { id: req.params.id },
      data: { status, adminNote },
    });

    return success(res, suggestion);
  } catch {
    return error(res, 'INTERNAL', 'Failed to update suggestion status', 500);
  }
}
