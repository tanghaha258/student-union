import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middlewares/auth';

const router = Router();

// 获取评优活动列表
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, pageSize = 10, status, type } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [activities, total] = await Promise.all([
      prisma.evaluationActivity.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          organizer: { select: { id: true, username: true, nickname: true } },
          _count: { select: { applications: true, reviewers: true } }
        }
      }),
      prisma.evaluationActivity.count({ where })
    ]);

    res.json({
      code: 200,
      message: '获取成功',
      data: { list: activities, total, page: Number(page), pageSize: Number(pageSize) }
    });
  } catch (error) {
    console.error('Get evaluation activities error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 获取评优活动详情
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const activity = await prisma.evaluationActivity.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, username: true, nickname: true } },
        reviewers: {
          include: { user: { select: { id: true, username: true, nickname: true } } }
        },
        _count: { select: { applications: true } },
        applications: {
          where: { applicantId: userId },
          select: { id: true, status: true }
        }
      }
    });

    if (!activity) {
      return res.status(404).json({ code: 404, message: '活动不存在', data: null });
    }

    res.json({ code: 200, message: '获取成功', data: activity });
  } catch (error) {
    console.error('Get evaluation activity error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 创建评优活动 (ADMIN)
router.post('/', authenticate, authorize('ADMIN', 'PRESIDENT'), async (req: AuthRequest, res: Response) => {
  try {
    const {
      title, description, type, startDate, endDate,
      reviewStartDate, reviewEndDate, announceDate,
      criteria, maxAwards, requireMaterial
    } = req.body;

    const activity = await prisma.evaluationActivity.create({
      data: {
        title,
        description,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reviewStartDate: new Date(reviewStartDate),
        reviewEndDate: new Date(reviewEndDate),
        announceDate: new Date(announceDate),
        criteria,
        maxAwards: maxAwards || 1,
        requireMaterial: requireMaterial ?? true,
        organizerId: req.userId
      }
    });

    res.status(201).json({ code: 200, message: '创建成功', data: activity });
  } catch (error) {
    console.error('Create evaluation activity error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 更新评优活动
router.put('/:id', authenticate, authorize('ADMIN', 'PRESIDENT'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title, description, type, startDate, endDate,
      reviewStartDate, reviewEndDate, announceDate,
      criteria, maxAwards, status, requireMaterial
    } = req.body;

    const activity = await prisma.evaluationActivity.update({
      where: { id },
      data: {
        title,
        description,
        type,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        reviewStartDate: reviewStartDate ? new Date(reviewStartDate) : undefined,
        reviewEndDate: reviewEndDate ? new Date(reviewEndDate) : undefined,
        announceDate: announceDate ? new Date(announceDate) : undefined,
        criteria,
        maxAwards,
        status,
        requireMaterial
      }
    });

    res.json({ code: 200, message: '更新成功', data: activity });
  } catch (error) {
    console.error('Update evaluation activity error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 删除评优活动 (ADMIN only)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.evaluationActivity.delete({ where: { id } });
    res.json({ code: 200, message: '删除成功', data: null });
  } catch (error) {
    console.error('Delete evaluation activity error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 添加评审员
router.post('/:id/reviewers', authenticate, authorize('ADMIN', 'PRESIDENT'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { userIds } = req.body;

    const reviewers = await prisma.evaluationReviewer.createMany({
      data: userIds.map((userId: string) => ({ activityId: id, userId })),
      skipDuplicates: true
    });

    res.status(201).json({ code: 200, message: '添加成功', data: reviewers });
  } catch (error) {
    console.error('Add reviewers error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 移除评审员
router.delete('/:id/reviewers/:userId', authenticate, authorize('ADMIN', 'PRESIDENT'), async (req: AuthRequest, res: Response) => {
  try {
    const { id, userId } = req.params;
    await prisma.evaluationReviewer.delete({
      where: { activityId_userId: { activityId: id, userId } }
    });
    res.json({ code: 200, message: '移除成功', data: null });
  } catch (error) {
    console.error('Remove reviewer error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

export default router;
