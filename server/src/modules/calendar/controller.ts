import { Request, Response } from 'express';
import prisma from '../../utils/prisma';
import { success, error } from '../../utils/response';
import { EventType } from '@prisma/client';

const eventInclude = {
  owner: { select: { id: true, name: true } },
};

// ─── List Events ────────────────────────────────────────────────────────────

export async function listEvents(req: Request, res: Response) {
  try {
    const { startDate, endDate, eventType, departmentId, ownerId } = req.query;

    const where: Record<string, unknown> = {};

    if (startDate) where.startTime = { gte: new Date(startDate as string) };
    if (endDate) where.endTime = { lte: new Date(endDate as string) };
    if (eventType) where.eventType = eventType as string;
    if (departmentId) where.departmentId = departmentId as string;
    if (ownerId) where.ownerId = ownerId as string;

    const events = await prisma.calendarEvent.findMany({
      where,
      include: eventInclude,
      orderBy: { startTime: 'asc' },
    });

    return success(res, events);
  } catch {
    return error(res, 'INTERNAL', 'Failed to list events', 500);
  }
}

// ─── Create Event ───────────────────────────────────────────────────────────

export async function createEvent(req: Request, res: Response) {
  try {
    const { title, description, startTime, endTime, allDay, eventType, departmentId } = req.body;

    if (!title || !startTime || !endTime) {
      return error(res, 'VALIDATION', 'title, startTime, endTime are required');
    }

    const validTypes: EventType[] = ['PERSONAL', 'TEAM', 'COMPANY'];
    if (eventType && !validTypes.includes(eventType)) {
      return error(res, 'VALIDATION', 'Invalid eventType');
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) {
      return error(res, 'INVALID_DATES', 'End time must be after start time');
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description,
        startTime: start,
        endTime: end,
        allDay: allDay ?? false,
        eventType: (eventType as EventType) ?? EventType.PERSONAL,
        ownerId: req.user!.id,
        departmentId,
        isPublic: true,
      },
      include: eventInclude,
    });

    return success(res, event, 201);
  } catch {
    return error(res, 'INTERNAL', 'Failed to create event', 500);
  }
}

// ─── Get Event By ID ────────────────────────────────────────────────────────

export async function getEventById(req: Request, res: Response) {
  try {
    const event = await prisma.calendarEvent.findUnique({
      where: { id: req.params.id },
      include: eventInclude,
    });

    if (!event) {
      return error(res, 'NOT_FOUND', 'Event not found', 404);
    }

    return success(res, event);
  } catch {
    return error(res, 'INTERNAL', 'Failed to get event', 500);
  }
}

// ─── Update Event ───────────────────────────────────────────────────────────

export async function updateEvent(req: Request, res: Response) {
  try {
    const event = await prisma.calendarEvent.findUnique({
      where: { id: req.params.id },
    });

    if (!event) {
      return error(res, 'NOT_FOUND', 'Event not found', 404);
    }

    const { id: userId, role } = req.user!;
    if (event.ownerId !== userId && role !== 'ADMIN') {
      return error(res, 'FORBIDDEN', 'Insufficient permissions', 403);
    }

    const { title, description, startTime, endTime, allDay, eventType, departmentId } = req.body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (allDay !== undefined) updateData.allDay = allDay;
    if (eventType !== undefined) updateData.eventType = eventType;
    if (departmentId !== undefined) updateData.departmentId = departmentId;
    if (startTime) updateData.startTime = new Date(startTime);
    if (endTime) updateData.endTime = new Date(endTime);

    if (updateData.startTime && updateData.endTime) {
      if ((updateData.endTime as Date) <= (updateData.startTime as Date)) {
        return error(res, 'INVALID_DATES', 'End time must be after start time');
      }
    }

    const updated = await prisma.calendarEvent.update({
      where: { id: req.params.id },
      data: updateData,
      include: eventInclude,
    });

    return success(res, updated);
  } catch {
    return error(res, 'INTERNAL', 'Failed to update event', 500);
  }
}

// ─── Delete Event ───────────────────────────────────────────────────────────

export async function deleteEvent(req: Request, res: Response) {
  try {
    const event = await prisma.calendarEvent.findUnique({
      where: { id: req.params.id },
    });

    if (!event) {
      return error(res, 'NOT_FOUND', 'Event not found', 404);
    }

    const { id: userId, role } = req.user!;
    if (event.ownerId !== userId && role !== 'ADMIN') {
      return error(res, 'FORBIDDEN', 'Insufficient permissions', 403);
    }

    await prisma.calendarEvent.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch {
    return error(res, 'INTERNAL', 'Failed to delete event', 500);
  }
}
