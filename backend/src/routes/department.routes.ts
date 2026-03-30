import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: { select: { members: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const result = departments.map(dept => ({
      ...dept,
      memberCount: dept._count.members
    }));

    res.json({ code: 200, message: '获取成功', data: result });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        members: {
          select: { id: true, username: true, email: true, phone: true, role: true }
        }
      }
    });

    if (!department) {
      return res.status(404).json({ code: 404, message: '部门不存在', data: null });
    }

    res.json({ code: 200, message: '获取成功', data: department });
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

router.post('/', authenticate, authorize('ADMIN', 'PRESIDENT'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;

    const existingDept = await prisma.department.findUnique({ where: { name } });
    if (existingDept) {
      return res.status(400).json({ code: 400, message: '部门名称已存在', data: null });
    }

    const department = await prisma.department.create({
      data: { name, description }
    });

    res.status(201).json({ code: 200, message: '创建成功', data: department });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

router.put('/:id', authenticate, authorize('ADMIN', 'PRESIDENT'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const department = await prisma.department.update({
      where: { id },
      data: { name, description }
    });

    res.json({ code: 200, message: '更新成功', data: department });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

router.delete('/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.department.delete({ where: { id } });

    res.json({ code: 200, message: '删除成功', data: null });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

export default router;
