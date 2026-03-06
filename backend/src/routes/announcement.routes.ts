import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, AuthRequest } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const isPublished = req.query.isPublished as string;

    const where: any = {};
    if (isPublished !== undefined) {
      where.isPublished = isPublished === 'true';
    }

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        include: { author: { select: { id: true, username: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
      }),
      prisma.announcement.count({ where })
    ]);

    res.json({
      code: 200,
      message: '获取成功',
      data: { list: announcements, total, page, pageSize }
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: { author: { select: { id: true, username: true } } }
    });

    if (!announcement) {
      return res.status(404).json({ code: 404, message: '公告不存在', data: null });
    }

    res.json({ code: 200, message: '获取成功', data: announcement });
  } catch (error) {
    console.error('Get announcement error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

router.post('/', authenticate, authorize('ADMIN', 'PRESIDENT', 'MINISTER'), async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, priority, isPublished } = req.body;

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        priority: priority || 1,
        isPublished: isPublished ?? true,
        authorId: req.userId
      }
    });

    res.status(201).json({ code: 200, message: '创建成功', data: announcement });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

router.put('/:id', authenticate, authorize('ADMIN', 'PRESIDENT', 'MINISTER'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, priority, isPublished } = req.body;

    const announcement = await prisma.announcement.update({
      where: { id },
      data: { title, content, priority, isPublished }
    });

    res.json({ code: 200, message: '更新成功', data: announcement });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

router.delete('/:id', authenticate, authorize('ADMIN', 'PRESIDENT'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.announcement.delete({ where: { id } });

    res.json({ code: 200, message: '删除成功', data: null });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

export default router;
