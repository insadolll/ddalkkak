import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import prisma from '../../utils/prisma';
import { success, error } from '../../utils/response';

const router = Router();

router.get('/', authenticate, async (_req, res) => {
  try {
    const depts = await prisma.department.findMany({
      include: { _count: { select: { employees: true } } },
      orderBy: { name: 'asc' },
    });
    return success(res, depts);
  } catch {
    return error(res, 'INTERNAL', '서버 오류', 500);
  }
});

router.post('/', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return error(res, 'VALIDATION', '부서명은 필수입니다', 400);
    const dept = await prisma.department.create({ data: { name, description: description || null } });
    return success(res, dept, 201);
  } catch {
    return error(res, 'CONFLICT', '이미 존재하는 부서명입니다', 409);
  }
});

router.put('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, description } = req.body;
    const dept = await prisma.department.update({
      where: { id: req.params.id },
      data: { ...(name && { name }), ...(description !== undefined && { description }) },
    });
    return success(res, dept);
  } catch {
    return error(res, 'INTERNAL', '수정에 실패했습니다', 500);
  }
});

router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const count = await prisma.employee.count({ where: { departmentId: req.params.id } });
    if (count > 0) return error(res, 'CONFLICT', '소속 직원이 있는 부서는 삭제할 수 없습니다', 409);
    await prisma.department.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch {
    return error(res, 'INTERNAL', '삭제에 실패했습니다', 500);
  }
});

export default router;
