import { Request, Response } from 'express';
import prisma from '../../utils/prisma';
import { success, error, successList, parsePagination } from '../../utils/response';
import { MeetingType, EventType } from '@prisma/client';

// ─── Include definitions ────────────────────────────────────────────────────

const authorSelect = {
  id: true, name: true, employeeNo: true, position: true,
  department: { select: { name: true } },
};

const meetingListInclude = {
  createdBy: { select: authorSelect },
  _count: { select: { workItems: true, planItems: true, monthlyReports: true } },
};

const meetingFullInclude = {
  createdBy: { select: authorSelect },
  workItems: {
    orderBy: { sortOrder: 'asc' as const },
    include: { author: { select: authorSelect } },
  },
  planItems: {
    orderBy: { sortOrder: 'asc' as const },
    include: { author: { select: authorSelect } },
  },
  issues: {
    orderBy: { sortOrder: 'asc' as const },
    include: { author: { select: authorSelect } },
  },
  decisions: {
    orderBy: { sortOrder: 'asc' as const },
    include: { author: { select: authorSelect } },
  },
  monthlyReports: {
    orderBy: { createdAt: 'asc' as const },
    include: { author: { select: authorSelect } },
  },
};

// ─── Meeting CRUD ───────────────────────────────────────────────────────────

export async function createMeeting(req: Request, res: Response) {
  try {
    const { title, meetingType, meetingDate, location, meetingTime } = req.body;

    if (!title || !meetingType || !meetingDate) {
      return error(res, 'VALIDATION', 'title, meetingType, meetingDate are required');
    }

    const validTypes: MeetingType[] = ['WEEKLY', 'MONTHLY'];
    if (!validTypes.includes(meetingType)) {
      return error(res, 'VALIDATION', 'Invalid meetingType');
    }

    const meeting = await prisma.meeting.create({
      data: {
        title,
        meetingType: meetingType as MeetingType,
        meetingDate: new Date(meetingDate),
        location,
        meetingTime,
        createdById: req.user!.id,
      },
      include: meetingListInclude,
    });

    return success(res, meeting, 201);
  } catch {
    return error(res, 'INTERNAL', 'Failed to create meeting', 500);
  }
}

export async function listMeetings(req: Request, res: Response) {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { meetingType } = req.query;

    const where: Record<string, unknown> = {};
    if (meetingType) where.meetingType = meetingType as string;

    const [data, total] = await Promise.all([
      prisma.meeting.findMany({
        where,
        include: meetingListInclude,
        skip,
        take: limit,
        orderBy: { meetingDate: 'desc' },
      }),
      prisma.meeting.count({ where }),
    ]);

    return successList(res, data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return error(res, 'INTERNAL', 'Failed to list meetings', 500);
  }
}

export async function getMeetingById(req: Request, res: Response) {
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: req.params.id },
      include: meetingFullInclude,
    });

    if (!meeting) return error(res, 'NOT_FOUND', 'Meeting not found', 404);
    return success(res, meeting);
  } catch {
    return error(res, 'INTERNAL', 'Failed to get meeting', 500);
  }
}

export async function updateMeeting(req: Request, res: Response) {
  try {
    const { title, meetingDate, location, meetingTime, memo, announcement } = req.body;

    const updated = await prisma.meeting.update({
      where: { id: req.params.id },
      data: {
        title,
        meetingDate: meetingDate ? new Date(meetingDate) : undefined,
        location,
        meetingTime,
        memo,
        announcement,
      },
      include: meetingFullInclude,
    });

    return success(res, updated);
  } catch {
    return error(res, 'INTERNAL', 'Failed to update meeting', 500);
  }
}

export async function deleteMeeting(req: Request, res: Response) {
  try {
    const meeting = await prisma.meeting.findUnique({ where: { id: req.params.id } });
    if (!meeting) return error(res, 'NOT_FOUND', 'Meeting not found', 404);

    if (meeting.createdById !== req.user!.id && req.user!.role !== 'ADMIN') {
      return error(res, 'FORBIDDEN', 'Only creator or admin can delete', 403);
    }

    await prisma.meeting.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch {
    return error(res, 'INTERNAL', 'Failed to delete meeting', 500);
  }
}

// ─── Work Items ─────────────────────────────────────────────────────────────

export async function addWorkItem(req: Request, res: Response) {
  try {
    const { category, client, content, progress, status, assignee, remarks } = req.body;

    if (!content) return error(res, 'VALIDATION', 'content is required');

    const count = await prisma.meetingWorkItem.count({ where: { meetingId: req.params.id } });
    const item = await prisma.meetingWorkItem.create({
      data: {
        meetingId: req.params.id,
        authorId: req.user!.id,
        sortOrder: count + 1,
        category, client, content, progress, status, assignee, remarks,
      },
      include: { author: { select: authorSelect } },
    });

    return success(res, item, 201);
  } catch {
    return error(res, 'INTERNAL', 'Failed to add work item', 500);
  }
}

export async function updateWorkItem(req: Request, res: Response) {
  try {
    const item = await prisma.meetingWorkItem.update({
      where: { id: req.params.itemId },
      data: req.body,
      include: { author: { select: authorSelect } },
    });
    return success(res, item);
  } catch {
    return error(res, 'INTERNAL', 'Failed to update work item', 500);
  }
}

export async function deleteWorkItem(req: Request, res: Response) {
  try {
    await prisma.meetingWorkItem.delete({ where: { id: req.params.itemId } });
    return res.status(204).send();
  } catch {
    return error(res, 'INTERNAL', 'Failed to delete work item', 500);
  }
}

// ─── Plan Items ─────────────────────────────────────────────────────────────

export async function addPlanItem(req: Request, res: Response) {
  try {
    const { category, client, content, targetDate, priority, assignee, remarks } = req.body;

    if (!content) return error(res, 'VALIDATION', 'content is required');

    const count = await prisma.meetingPlanItem.count({ where: { meetingId: req.params.id } });

    let calendarEventId: string | undefined;
    if (targetDate) {
      const event = await prisma.calendarEvent.create({
        data: {
          title: content,
          startTime: new Date(targetDate),
          endTime: new Date(targetDate),
          allDay: true,
          eventType: EventType.TEAM,
          ownerId: req.user!.id,
          isPublic: true,
        },
      });
      calendarEventId = event.id;
    }

    const item = await prisma.meetingPlanItem.create({
      data: {
        meetingId: req.params.id,
        authorId: req.user!.id,
        sortOrder: count + 1,
        category, client, content,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        priority, assignee, remarks, calendarEventId,
      },
      include: { author: { select: authorSelect } },
    });

    return success(res, item, 201);
  } catch {
    return error(res, 'INTERNAL', 'Failed to add plan item', 500);
  }
}

export async function updatePlanItem(req: Request, res: Response) {
  try {
    const existing = await prisma.meetingPlanItem.findUnique({ where: { id: req.params.itemId } });
    if (!existing) return error(res, 'NOT_FOUND', 'Plan item not found', 404);

    const { targetDate, content, ...rest } = req.body;

    // Sync linked calendar event
    if (existing.calendarEventId) {
      const calUpdate: Record<string, unknown> = {};
      if (content) calUpdate.title = content;
      if (targetDate) {
        calUpdate.startTime = new Date(targetDate);
        calUpdate.endTime = new Date(targetDate);
      }
      if (Object.keys(calUpdate).length > 0) {
        await prisma.calendarEvent.update({
          where: { id: existing.calendarEventId },
          data: calUpdate,
        }).catch(() => {});
      }
    } else if (targetDate) {
      const event = await prisma.calendarEvent.create({
        data: {
          title: content || existing.content,
          startTime: new Date(targetDate),
          endTime: new Date(targetDate),
          allDay: true,
          eventType: EventType.TEAM,
          ownerId: existing.authorId,
          isPublic: true,
        },
      });
      rest.calendarEventId = event.id;
    }

    const item = await prisma.meetingPlanItem.update({
      where: { id: req.params.itemId },
      data: {
        ...rest,
        content,
        targetDate: targetDate ? new Date(targetDate) : undefined,
      },
      include: { author: { select: authorSelect } },
    });

    return success(res, item);
  } catch {
    return error(res, 'INTERNAL', 'Failed to update plan item', 500);
  }
}

export async function deletePlanItem(req: Request, res: Response) {
  try {
    const item = await prisma.meetingPlanItem.findUnique({ where: { id: req.params.itemId } });
    if (item?.calendarEventId) {
      await prisma.calendarEvent.delete({ where: { id: item.calendarEventId } }).catch(() => {});
    }
    await prisma.meetingPlanItem.delete({ where: { id: req.params.itemId } });
    return res.status(204).send();
  } catch {
    return error(res, 'INTERNAL', 'Failed to delete plan item', 500);
  }
}

// ─── Issues ─────────────────────────────────────────────────────────────────

export async function addIssue(req: Request, res: Response) {
  try {
    const { category, client, content, urgency, actionStatus, assignee, remarks } = req.body;

    if (!content) return error(res, 'VALIDATION', 'content is required');

    const count = await prisma.meetingIssue.count({ where: { meetingId: req.params.id } });
    const item = await prisma.meetingIssue.create({
      data: {
        meetingId: req.params.id,
        authorId: req.user!.id,
        sortOrder: count + 1,
        category, client, content, urgency, actionStatus, assignee, remarks,
      },
      include: { author: { select: authorSelect } },
    });

    return success(res, item, 201);
  } catch {
    return error(res, 'INTERNAL', 'Failed to add issue', 500);
  }
}

export async function updateIssue(req: Request, res: Response) {
  try {
    const item = await prisma.meetingIssue.update({
      where: { id: req.params.itemId },
      data: req.body,
      include: { author: { select: authorSelect } },
    });
    return success(res, item);
  } catch {
    return error(res, 'INTERNAL', 'Failed to update issue', 500);
  }
}

export async function deleteIssue(req: Request, res: Response) {
  try {
    await prisma.meetingIssue.delete({ where: { id: req.params.itemId } });
    return res.status(204).send();
  } catch {
    return error(res, 'INTERNAL', 'Failed to delete issue', 500);
  }
}

// ─── Decisions ──────────────────────────────────────────────────────────────

export async function addDecision(req: Request, res: Response) {
  try {
    const { category, content, deadline, assignee, remarks } = req.body;

    if (!content) return error(res, 'VALIDATION', 'content is required');

    const count = await prisma.meetingDecision.count({ where: { meetingId: req.params.id } });
    const item = await prisma.meetingDecision.create({
      data: {
        meetingId: req.params.id,
        authorId: req.user!.id,
        sortOrder: count + 1,
        category, content, deadline, assignee, remarks,
      },
      include: { author: { select: authorSelect } },
    });

    return success(res, item, 201);
  } catch {
    return error(res, 'INTERNAL', 'Failed to add decision', 500);
  }
}

export async function updateDecision(req: Request, res: Response) {
  try {
    const item = await prisma.meetingDecision.update({
      where: { id: req.params.itemId },
      data: req.body,
      include: { author: { select: authorSelect } },
    });
    return success(res, item);
  } catch {
    return error(res, 'INTERNAL', 'Failed to update decision', 500);
  }
}

export async function deleteDecision(req: Request, res: Response) {
  try {
    await prisma.meetingDecision.delete({ where: { id: req.params.itemId } });
    return res.status(204).send();
  } catch {
    return error(res, 'INTERNAL', 'Failed to delete decision', 500);
  }
}

// ─── Monthly Reports ────────────────────────────────────────────────────────

export async function upsertReport(req: Request, res: Response) {
  try {
    const { prevMonth, currentMonth } = req.body;

    const report = await prisma.monthlyReport.upsert({
      where: {
        meetingId_authorId: {
          meetingId: req.params.id,
          authorId: req.user!.id,
        },
      },
      create: {
        meetingId: req.params.id,
        authorId: req.user!.id,
        prevMonth,
        currentMonth,
      },
      update: { prevMonth, currentMonth },
      include: { author: { select: authorSelect } },
    });

    return success(res, report);
  } catch {
    return error(res, 'INTERNAL', 'Failed to upsert report', 500);
  }
}

export async function deleteReport(req: Request, res: Response) {
  try {
    await prisma.monthlyReport.delete({ where: { id: req.params.itemId } });
    return res.status(204).send();
  } catch {
    return error(res, 'INTERNAL', 'Failed to delete report', 500);
  }
}
