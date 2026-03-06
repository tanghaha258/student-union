import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, AuthRequest } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

// 提交评审
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId, score, comment } = req.body;
    const reviewerId = req.userId!;

    const application = await prisma.evaluationApplication.findUnique({
      where: { id: applicationId },
      include: { activity: true }
    });

    if (!application) {
      return res.status(404).json({ code: 404, message: '申请不存在', data: null });
    }

    // 检查是否是评审员
    const isReviewer = await prisma.evaluationReviewer.findFirst({
      where: { activityId: application.activityId, userId: reviewerId }
    });

    if (!isReviewer && !['ADMIN', 'PRESIDENT', 'VICE_PRESIDENT'].includes(req.userRole!)) {
      return res.status(403).json({ code: 403, message: '您不是该活动的评审员', data: null });
    }

    // 检查评审时间
    const now = new Date();
    if (now < application.activity.reviewStartDate || now > application.activity.reviewEndDate) {
      return res.status(400).json({ code: 400, message: '不在评审时间内', data: null });
    }

    // 检查是否已评审
    const existing = await prisma.evaluationReview.findUnique({
      where: { applicationId_reviewerId: { applicationId, reviewerId } }
    });

    if (existing) {
      return res.status(400).json({ code: 400, message: '您已评审该申请', data: null });
    }

    const review = await prisma.evaluationReview.create({
      data: { applicationId, reviewerId, score, comment },
      include: {
        application: { include: { applicant: { select: { username: true, nickname: true } } } }
      }
    });

    // 更新总分
    const allReviews = await prisma.evaluationReview.findMany({ where: { applicationId } });
    const totalScore = allReviews.reduce((sum, r) => sum + r.score, 0) + score;
    await prisma.evaluationApplication.update({
      where: { id: applicationId },
      data: { totalScore }
    });

    res.status(201).json({ code: 200, message: '评审成功', data: review });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 获取我的评审任务
router.get('/my', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query;
    const reviewerId = req.userId!;

    // 获取我是评审员的活动
    const reviewerActivities = await prisma.evaluationReviewer.findMany({
      where: { userId: reviewerId },
      select: { activityId: true }
    });
    const activityIds = reviewerActivities.map(r => r.activityId);

    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = { activityId: { in: activityIds } };
    if (status === 'PENDING') {
      where.NOT = { reviews: { some: { reviewerId } } };
    } else if (status === 'REVIEWED') {
      where.reviews = { some: { reviewerId } };
    }

    const [applications, total] = await Promise.all([
      prisma.evaluationApplication.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          activity: { select: { id: true, title: true, type: true, reviewStartDate: true, reviewEndDate: true } },
          applicant: { select: { id: true, username: true, nickname: true, studentId: true, className: true } },
          reviews: {
            where: { reviewerId },
            select: { id: true, score: true, comment: true }
          }
        }
      }),
      prisma.evaluationApplication.count({ where })
    ]);

    res.json({ code: 200, message: '获取成功', data: { list: applications, total, page: Number(page), pageSize: Number(pageSize) } });
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 修改评审
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { score, comment } = req.body;
    const reviewerId = req.userId!;

    const review = await prisma.evaluationReview.findFirst({
      where: { id, reviewerId }
    });

    if (!review) {
      return res.status(404).json({ code: 404, message: '评审记录不存在', data: null });
    }

    const updated = await prisma.evaluationReview.update({
      where: { id },
      data: { score, comment }
    });

    // 更新总分
    const allReviews = await prisma.evaluationReview.findMany({ where: { applicationId: review.applicationId } });
    const totalScore = allReviews.reduce((sum, r) => sum + (r.id === id ? score : r.score), 0);
    await prisma.evaluationApplication.update({
      where: { id: review.applicationId },
      data: { totalScore }
    });

    res.json({ code: 200, message: '修改成功', data: updated });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

export default router;
