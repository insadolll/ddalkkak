import { Response } from 'express';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function success(res: Response, data: unknown, status = 200) {
  return res.status(status).json({ success: true, data });
}

export function successList(res: Response, data: unknown[], pagination: Pagination) {
  return res.json({ success: true, data, pagination });
}

export function error(res: Response, code: string, message: string, status = 400) {
  return res.status(status).json({
    success: false,
    error: { code, message },
  });
}

export function parsePagination(query: Record<string, unknown>) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
