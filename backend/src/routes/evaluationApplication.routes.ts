import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middlewares/auth';

const router = Router();

// 提交评优申请
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { activityId, materials, selfEvaluation } = req.body;
    const userId = req.userId!;

    const activity = await prisma.evaluationActivity.findUnique({ where: { id: activityId } });
    if (!activity) {
      return res.status(404).json({ code: 404, message: '活动不存在', data: null });
    }

    if (activity.status !== 'OPEN') {
      return res.status(400).json({ code: 400, message: '活动未开放申请', data: null });
    }

    const now = new Date();
    if (now < activity.startDate || now > activity.endDate) {
      return res.status(400).json({ code: 400, message: '不在申请时间内', data: null });
    }

    const existing = await prisma.evaluationApplication.findFirst({
      where: { activityId, applicantId: userId }
    });
    if (existing) {
      return res.status(400).json({ code: 400, message: '您已申请该评优', data: null });
    }

    const application = await prisma.evaluationApplication.create({
      data: {
        activityId,
        applicantId: userId,
        materials: materials ? JSON.stringify(materials) : null,
        selfEvaluation
      },
      include: {
        activity: { select: { title: true } },
        applicant: { select: { id: true, username: true, nickname: true } }
      }
    });

    res.status(201).json({ code: 200, message: '申请成功', data: application });
  } catch (error) {
    console.error('Create evaluation application error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 获取我的申请
router.get('/my', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = { applicantId: req.userId };
    if (status) where.status = status;

    const [applications, total] = await Promise.all([
      prisma.evaluationApplication.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          activity: { select: { id: true, title: true, type: true, status: true } }
        }
      }),
      prisma.evaluationApplication.count({ where })
    ]);

    res.json({ code: 200, message: '获取成功', data: { list: applications, total, page: Number(page), pageSize: Number(pageSize) } });
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 获取活动的申请列表 (ADMIN/REVIEWER)
router.get('/activity/:activityId', authenticate, authorize('ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'MINISTER'), async (req: AuthRequest, res: Response) => {
  try {
    const { activityId } = req.params;
    const { page = 1, pageSize = 10, status } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = { activityId };
    if (status) where.status = status;

    const [applications, total] = await Promise.all([
      prisma.evaluationApplication.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { totalScore: 'desc' },
        include: {
          applicant: { select: { id: true, username: true, nickname: true, studentId: true, className: true } },
          reviews: {
            include: { reviewer: { select: { id: true, username: true, nickname: true } } }
          }
        }
      }),
      prisma.evaluationApplication.count({ where })
    ]);

    res.json({ code: 200, message: '获取成功', data: { list: applications, total, page: Number(page), pageSize: Number(pageSize) } });
  } catch (error) {
    console.error('Get activity applications error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 修改申请
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { materials, selfEvaluation } = req.body;

    const application = await prisma.evaluationApplication.findFirst({
      where: { id, applicantId: req.userId }
    });
    if (!application) {
      return res.status(404).json({ code: 404, message: '申请不存在', data: null });
    }

    if (application.status !== 'PENDING') {
      return res.status(400).json({ code: 400, message: '申请已进入评审阶段，无法修改', data: null });
    }

    const updated = await prisma.evaluationApplication.update({
      where: { id },
      data: {
        materials: materials ? JSON.stringify(materials) : undefined,
        selfEvaluation
      }
    });

    res.json({ code: 200, message: '修改成功', data: updated });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

export default router;
