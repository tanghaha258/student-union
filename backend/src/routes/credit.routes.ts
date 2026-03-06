import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, AuthRequest } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

// 获取我的学分记录
router.get('/my', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { type, startDate, endDate } = req.query;

    const where: any = { userId };
    if (type) where.type = type;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const records = await prisma.creditRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        activity: { select: { id: true, title: true } },
        registrationActivity: { select: { id: true, title: true } }
      }
    });

    const stats = await prisma.creditRecord.groupBy({
      by: ['type'],
      where: { userId },
      _sum: { value: true }
    });

    const totalCredits = records.reduce((sum, r) => sum + r.value, 0);

    // 格式化返回数据，统一活动信息
    const formattedRecords = records.map(r => ({
      ...r,
      activityInfo: r.activity || r.registrationActivity || null
    }));

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        records: formattedRecords,
        stats: stats.map(s => ({ type: s.type, value: s._sum.value || 0 })),
        totalCredits
      }
    });
  } catch (error) {
    console.error('Get my credits error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 获取所有学分记录（管理员）
router.get('/', authenticate, authorize('ADMIN', 'PRESIDENT', 'VICE_PRESIDENT'), async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, pageSize = 20, userId, type } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = {};
    if (userId) where.userId = userId;
    if (type) where.type = type;

    const [records, total] = await Promise.all([
      prisma.creditRecord.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true, realName: true, studentId: true, className: true } },
          activity: { select: { id: true, title: true } }
        }
      }),
      prisma.creditRecord.count({ where })
    ]);

    res.json({
      code: 200,
      message: '获取成功',
      data: { list: records, total, page: Number(page), pageSize: Number(pageSize) }
    });
  } catch (error) {
    console.error('Get credits error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 手动添加学分（管理员）
router.post('/', authenticate, authorize('ADMIN', 'PRESIDENT', 'VICE_PRESIDENT'), async (req: AuthRequest, res: Response) => {
  try {
    const { userId, type, value, description } = req.body;

    if (!userId || !type || !value) {
      return res.status(400).json({ code: 400, message: '缺少必要参数', data: null });
    }

    const record = await prisma.creditRecord.create({
      data: {
        userId,
        type,
        value: Number(value),
        source: 'MANUAL',
        description,
        operatorId: req.userId
      },
      include: {
        user: { select: { id: true, username: true, realName: true } }
      }
    });

    res.status(201).json({ code: 200, message: '添加成功', data: record });
  } catch (error) {
    console.error('Add credit error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 获取学分排行榜
router.get('/ranking', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { type, startDate, endDate, limit = 20 } = req.query;

    const where: any = {};
    if (type) where.type = type;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const rankings = await prisma.creditRecord.groupBy({
      by: ['userId'],
      where,
      _sum: { value: true },
      orderBy: { _sum: { value: 'desc' } },
      take: Number(limit)
    });

    const userIds = rankings.map(r => r.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, realName: true, className: true, department: { select: { name: true } } }
    });

    const result = rankings.map((r, index) => {
      const user = users.find(u => u.id === r.userId);
      return {
        rank: index + 1,
        userId: r.userId,
        username: user?.username,
        realName: user?.realName,
        className: user?.className,
        department: user?.department?.name,
        totalCredit: r._sum.value || 0
      };
    });

    res.json({ code: 200, message: '获取成功', data: result });
  } catch (error) {
    console.error('Get ranking error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

export default router;
