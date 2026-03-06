import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, AuthRequest } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const status = req.query.status as string;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: { organizer: { select: { id: true, username: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.activity.count({ where })
    ]);

    res.json({
      code: 200,
      message: '获取成功',
      data: { list: activities, total, page, pageSize }
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 获取我的活动参与记录（放在 /:id 之前）
router.get('/my/participations', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = 1, pageSize = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = { userId: req.userId };
    if (status) where.status = status;

    const [participations, total] = await Promise.all([
      prisma.activityParticipant.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          activity: {
            select: {
              id: true,
              title: true,
              startDate: true,
              endDate: true,
              location: true,
              status: true,
              creditEnabled: true,
              creditValue: true
            }
          }
        }
      }),
      prisma.activityParticipant.count({ where })
    ]);

    res.json({
      code: 200,
      message: '获取成功',
      data: { list: participations, total, page: Number(page), pageSize: Number(pageSize) }
    });
  } catch (error) {
    console.error('Get my participations error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const activity = await prisma.activity.findUnique({
      where: { id },
      include: { organizer: { select: { id: true, username: true } } }
    });

    if (!activity) {
      return res.status(404).json({ code: 404, message: '活动不存在', data: null });
    }

    res.json({ code: 200, message: '获取成功', data: activity });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

router.post('/', authenticate, authorize('ADMIN', 'PRESIDENT', 'MINISTER'), async (req: AuthRequest, res: Response) => {
  try {
    const { 
      title, description, startDate, endDate, 
      registrationStart, registrationEnd,
      location, status, maxParticipants,
      requireApproval, creditEnabled, creditType, creditValue 
    } = req.body;

    const activity = await prisma.activity.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        registrationStart: registrationStart ? new Date(registrationStart) : null,
        registrationEnd: registrationEnd ? new Date(registrationEnd) : null,
        location,
        status: status || 'DRAFT',
        maxParticipants,
        requireApproval: requireApproval || false,
        creditEnabled: creditEnabled || false,
        creditType,
        creditValue,
        organizerId: req.userId
      }
    });

    res.status(201).json({ code: 200, message: '创建成功', data: activity });
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

router.put('/:id', authenticate, authorize('ADMIN', 'PRESIDENT', 'MINISTER'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      title, description, startDate, endDate, 
      registrationStart, registrationEnd,
      location, status, maxParticipants, participantCount,
      requireApproval, creditEnabled, creditType, creditValue 
    } = req.body;

    const activity = await prisma.activity.update({
      where: { id },
      data: {
        title,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        registrationStart: registrationStart ? new Date(registrationStart) : undefined,
        registrationEnd: registrationEnd ? new Date(registrationEnd) : undefined,
        location,
        status,
        maxParticipants,
        participantCount,
        requireApproval,
        creditEnabled,
        creditType,
        creditValue
      }
    });

    res.json({ code: 200, message: '更新成功', data: activity });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

router.delete('/:id', authenticate, authorize('ADMIN', 'PRESIDENT'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.activity.delete({ where: { id } });

    res.json({ code: 200, message: '删除成功', data: null });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 报名活动
router.post('/:id/participate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { remark } = req.body;
    const userId = req.userId!;

    const activity = await prisma.activity.findUnique({ where: { id } });
    if (!activity) {
      return res.status(404).json({ code: 404, message: '活动不存在', data: null });
    }

    // 检查是否在报名时间范围内
    const now = new Date();
    if (activity.registrationStart && now < activity.registrationStart) {
      return res.status(400).json({ code: 400, message: '报名尚未开始', data: null });
    }
    if (activity.registrationEnd && now > activity.registrationEnd) {
      return res.status(400).json({ code: 400, message: '报名已截止', data: null });
    }

    // 检查是否已报名
    const existing = await prisma.activityParticipant.findUnique({
      where: { activityId_userId: { activityId: id, userId } }
    });
    if (existing) {
      return res.status(400).json({ code: 400, message: '您已报名该活动', data: null });
    }

    // 检查人数限制
    if (activity.maxParticipants) {
      const count = await prisma.activityParticipant.count({
        where: { activityId: id, status: { in: ['PENDING', 'APPROVED'] } }
      });
      if (count >= activity.maxParticipants) {
        return res.status(400).json({ code: 400, message: '报名人数已满', data: null });
      }
    }

    const participant = await prisma.activityParticipant.create({
      data: {
        activityId: id,
        userId,
        remark,
        status: activity.requireApproval ? 'PENDING' : 'APPROVED'
      },
      include: {
        user: { select: { id: true, username: true, realName: true } }
      }
    });

    // 更新参与人数
    await prisma.activity.update({
      where: { id },
      data: { participantCount: { increment: 1 } }
    });

    // 如果不需要审核且启用了学分，直接发放学分
    if (!activity.requireApproval && activity.creditEnabled && activity.creditValue) {
      await prisma.creditRecord.create({
        data: {
          userId,
          type: activity.creditType || 'COMPREHENSIVE',
          value: activity.creditValue,
          source: 'ACTIVITY',
          activityId: id,
          description: `参加活动「${activity.title}」获得学分`
        }
      });
    }

    res.status(201).json({ code: 200, message: '报名成功', data: participant });
  } catch (error) {
    console.error('Participate activity error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 获取活动参与者列表
router.get('/:id/participants', authenticate, authorize('ADMIN', 'PRESIDENT', 'MINISTER'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, page = 1, pageSize = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = { activityId: id };
    if (status) where.status = status;

    const [participants, total] = await Promise.all([
      prisma.activityParticipant.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true, realName: true, studentId: true, className: true } },
          reviewer: { select: { id: true, username: true, realName: true } }
        }
      }),
      prisma.activityParticipant.count({ where })
    ]);

    res.json({
      code: 200,
      message: '获取成功',
      data: { list: participants, total, page: Number(page), pageSize: Number(pageSize) }
    });
  } catch (error) {
    console.error('Get participants error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 审核参与者
router.put('/:id/participants/:participantId/review', authenticate, authorize('ADMIN', 'PRESIDENT', 'MINISTER'), async (req: AuthRequest, res: Response) => {
  try {
    const { id, participantId } = req.params;
    const { status, remark } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ code: 400, message: '无效的审核状态', data: null });
    }

    const participant = await prisma.activityParticipant.findUnique({
      where: { id: participantId },
      include: { activity: true }
    });

    if (!participant || participant.activityId !== id) {
      return res.status(404).json({ code: 404, message: '报名记录不存在', data: null });
    }

    const updated = await prisma.activityParticipant.update({
      where: { id: participantId },
      data: {
        status,
        remark,
        reviewerId: req.userId,
        reviewedAt: new Date()
      },
      include: {
        user: { select: { id: true, username: true, realName: true } }
      }
    });

    // 审核通过且启用学分，发放学分
    if (status === 'APPROVED' && participant.activity.creditEnabled && participant.activity.creditValue) {
      const existingCredit = await prisma.creditRecord.findFirst({
        where: { userId: participant.userId, activityId: id }
      });

      if (!existingCredit) {
        await prisma.creditRecord.create({
          data: {
            userId: participant.userId,
            type: participant.activity.creditType || 'COMPREHENSIVE',
            value: participant.activity.creditValue,
            source: 'ACTIVITY',
            activityId: id,
            description: `参加活动「${participant.activity.title}」获得学分`
          }
        });
      }
    }

    res.json({ code: 200, message: '审核成功', data: updated });
  } catch (error) {
    console.error('Review participant error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

export default router;
