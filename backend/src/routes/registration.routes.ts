import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, AuthRequest } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

// 提交报名
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { activityId, remark } = req.body;
    const userId = req.userId!;

    // 检查活动是否存在且开放
    const activity = await prisma.registrationActivity.findUnique({
      where: { id: activityId }
    });

    if (!activity) {
      return res.status(404).json({ code: 404, message: '活动不存在', data: null });
    }

    if (activity.status !== 'OPEN') {
      return res.status(400).json({ code: 400, message: '活动未开放报名', data: null });
    }

    const now = new Date();
    if (now < activity.startDate || now > activity.endDate) {
      return res.status(400).json({ code: 400, message: '不在报名时间内', data: null });
    }

    // 检查是否已报名
    const existing = await prisma.registration.findUnique({
      where: { activityId_userId: { activityId, userId } }
    });

    if (existing) {
      return res.status(400).json({ code: 400, message: '您已报名该活动', data: null });
    }

    // 检查人数限制
    if (activity.maxParticipants) {
      const count = await prisma.registration.count({ where: { activityId } });
      if (count >= activity.maxParticipants) {
        return res.status(400).json({ code: 400, message: '报名人数已满', data: null });
      }
    }

    // 创建报名
    const registration = await prisma.registration.create({
      data: {
        activityId,
        userId,
        remark,
        status: activity.requireApproval ? 'PENDING' : 'APPROVED'
      },
      include: {
        activity: { select: { title: true } },
        user: { select: { id: true, username: true, nickname: true } }
      }
    });

    res.status(201).json({ code: 200, message: '报名成功', data: registration });
  } catch (error) {
    console.error('Create registration error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 获取我的报名
router.get('/my', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = { userId: req.userId };
    if (status) where.status = status;

    const [registrations, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          activity: {
            select: {
              id: true,
              title: true,
              eventDate: true,
              location: true,
              status: true
            }
          }
        }
      }),
      prisma.registration.count({ where })
    ]);

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: registrations,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  } catch (error) {
    console.error('Get my registrations error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 获取活动的报名列表 (ADMIN/MINISTER)
router.get('/activity/:activityId', authenticate, authorize('ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'MINISTER'), async (req: AuthRequest, res: Response) => {
  try {
    const { activityId } = req.params;
    const { page = 1, pageSize = 10, status } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = { activityId };
    if (status) where.status = status;

    const [registrations, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              nickname: true,
              studentId: true,
              className: true,
              phone: true,
              email: true
            }
          },
          reviewer: {
            select: { id: true, username: true, nickname: true }
          }
        }
      }),
      prisma.registration.count({ where })
    ]);

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: registrations,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  } catch (error) {
    console.error('Get activity registrations error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 审核报名
router.put('/:id/review', authenticate, authorize('ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'MINISTER'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, remark } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ code: 400, message: '无效的审核状态', data: null });
    }

    const existingRegistration = await prisma.registration.findUnique({
      where: { id },
      include: { activity: true }
    });

    if (!existingRegistration) {
      return res.status(404).json({ code: 404, message: '报名记录不存在', data: null });
    }

    const registration = await prisma.registration.update({
      where: { id },
      data: {
        status,
        remark,
        reviewerId: req.userId,
        reviewedAt: new Date()
      },
      include: {
        user: { select: { id: true, username: true, realName: true, nickname: true } },
        activity: { select: { title: true, creditEnabled: true, creditType: true, creditValue: true } }
      }
    });

    if (status === 'APPROVED' && existingRegistration.activity.creditEnabled && existingRegistration.activity.creditValue) {
      const existingCredit = await prisma.creditRecord.findFirst({
        where: {
          userId: existingRegistration.userId,
          registrationActivityId: existingRegistration.activityId
        }
      });

      if (!existingCredit) {
        await prisma.creditRecord.create({
          data: {
            userId: existingRegistration.userId,
            type: existingRegistration.activity.creditType || 'COMPREHENSIVE',
            value: existingRegistration.activity.creditValue,
            source: 'REGISTRATION_ACTIVITY',
            registrationActivityId: existingRegistration.activityId,
            description: `参加活动「${existingRegistration.activity.title}」获得学分`
          }
        });
      }
    }

    res.json({ code: 200, message: '审核成功', data: registration });
  } catch (error) {
    console.error('Review registration error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 取消报名
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // 检查是否是自己的报名
    const registration = await prisma.registration.findFirst({
      where: { id, userId }
    });

    if (!registration) {
      return res.status(404).json({ code: 404, message: '报名记录不存在', data: null });
    }

    await prisma.registration.delete({ where: { id } });
    res.json({ code: 200, message: '取消报名成功', data: null });
  } catch (error) {
    console.error('Cancel registration error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

export default router;
