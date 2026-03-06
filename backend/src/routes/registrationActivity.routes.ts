import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, AuthRequest } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

// 自动更新活动状态
const updateActivityStatus = async () => {
  const now = new Date();
  
  // 将即将开始的活动状态更新为 OPEN
  await prisma.registrationActivity.updateMany({
    where: {
      status: 'DRAFT',
      startDate: { lte: now },
      endDate: { gte: now }
    },
    data: { status: 'OPEN' }
  });
  
  // 将已结束的活动状态更新为 CLOSED
  await prisma.registrationActivity.updateMany({
    where: {
      status: { in: ['DRAFT', 'OPEN'] },
      endDate: { lt: now }
    },
    data: { status: 'CLOSED' }
  });
};

// 获取报名活动列表
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  // 先更新状态
  await updateActivityStatus();
  try {
    const { page = 1, pageSize = 10, status, keyword } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = {};
    if (status) where.status = status;
    if (keyword) {
      where.OR = [
        { title: { contains: keyword as string } },
        { description: { contains: keyword as string } }
      ];
    }

    const [activities, total] = await Promise.all([
      prisma.registrationActivity.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          organizer: { select: { id: true, username: true, nickname: true } },
          _count: { select: { registrations: true } }
        }
      }),
      prisma.registrationActivity.count({ where })
    ]);

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: activities,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  } catch (error) {
    console.error('Get registration activities error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 获取报名活动详情
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const activity = await prisma.registrationActivity.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, username: true, nickname: true } },
        _count: { select: { registrations: true } },
        registrations: {
          where: { userId },
          select: { id: true, status: true }
        }
      }
    });

    if (!activity) {
      return res.status(404).json({ code: 404, message: '活动不存在', data: null });
    }

    res.json({ code: 200, message: '获取成功', data: activity });
  } catch (error) {
    console.error('Get registration activity error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 创建报名活动 (ADMIN/MINISTER)
router.post('/', authenticate, authorize('ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'MINISTER'), async (req: AuthRequest, res: Response) => {
  try {
    const { 
      title, description, startDate, endDate, eventDate, location, 
      maxParticipants, requireApproval, creditEnabled, creditType, creditValue 
    } = req.body;

    const activity = await prisma.registrationActivity.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        eventDate: new Date(eventDate),
        location,
        maxParticipants,
        requireApproval: requireApproval || false,
        creditEnabled: creditEnabled || false,
        creditType: creditEnabled ? creditType : null,
        creditValue: creditEnabled ? creditValue : null,
        organizerId: req.userId
      }
    });

    res.status(201).json({ code: 200, message: '创建成功', data: activity });
  } catch (error) {
    console.error('Create registration activity error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 更新报名活动
router.put('/:id', authenticate, authorize('ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'MINISTER'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      title, description, startDate, endDate, eventDate, location, 
      maxParticipants, status, requireApproval, creditEnabled, creditType, creditValue 
    } = req.body;

    const activity = await prisma.registrationActivity.update({
      where: { id },
      data: {
        title,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        eventDate: eventDate ? new Date(eventDate) : undefined,
        location,
        maxParticipants,
        status,
        requireApproval,
        creditEnabled,
        creditType: creditEnabled ? creditType : null,
        creditValue: creditEnabled ? creditValue : null
      }
    });

    res.json({ code: 200, message: '更新成功', data: activity });
  } catch (error) {
    console.error('Update registration activity error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 删除报名活动 (ADMIN only)
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.registrationActivity.delete({ where: { id } });
    res.json({ code: 200, message: '删除成功', data: null });
  } catch (error) {
    console.error('Delete registration activity error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

export default router;
