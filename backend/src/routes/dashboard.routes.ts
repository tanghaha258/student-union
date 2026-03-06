import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const [userCount, departmentCount, activityCount, announcementCount] = await Promise.all([
      prisma.user.count(),
      prisma.department.count(),
      prisma.activity.count(),
      prisma.announcement.count()
    ]);

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        userCount,
        departmentCount,
        activityCount,
        announcementCount
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

router.get('/recent-activities', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;

    const activities = await prisma.activity.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        organizer: {
          select: { id: true, username: true }
        }
      }
    });

    res.json({
      code: 200,
      message: '获取成功',
      data: activities
    });
  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

router.get('/recent-announcements', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;

    const announcements = await prisma.announcement.findMany({
      where: { isPublished: true },
      take: limit,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        author: {
          select: { id: true, username: true }
        }
      }
    });

    res.json({
      code: 200,
      message: '获取成功',
      data: announcements
    });
  } catch (error) {
    console.error('Get recent announcements error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

router.get('/department-stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { members: true }
        }
      }
    });

    const result = departments.map(dept => ({
      id: dept.id,
      name: dept.name,
      description: dept.description,
      memberCount: dept._count.members
    }));

    res.json({
      code: 200,
      message: '获取成功',
      data: result
    });
  } catch (error) {
    console.error('Get department stats error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

export default router;
