import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middlewares/auth';

const router = Router();

// 获取评优周期列表
router.get('/', authenticate, authorize('ADMIN', 'PRESIDENT', 'VICE_PRESIDENT'), async (req: AuthRequest, res: Response) => {
  try {
    const periods = await prisma.evaluationPeriod.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { results: true } }
      }
    });

    res.json({ code: 200, message: '获取成功', data: periods });
  } catch (error) {
    console.error('Get evaluation periods error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 获取我的评优结果（放在 /:id 路由之前）
router.get('/my/results', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const results = await prisma.evaluationPeriodResult.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        period: { select: { name: true, type: true, startDate: true, endDate: true } }
      }
    });

    res.json({ code: 200, message: '获取成功', data: results });
  } catch (error) {
    console.error('Get my evaluation results error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 创建评优周期
router.post('/', authenticate, authorize('ADMIN', 'PRESIDENT'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, startDate, endDate } = req.body;

    if (!name || !type || !startDate || !endDate) {
      return res.status(400).json({ code: 400, message: '缺少必要参数', data: null });
    }

    const period = await prisma.evaluationPeriod.create({
      data: {
        name,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      }
    });

    res.status(201).json({ code: 200, message: '创建成功', data: period });
  } catch (error) {
    console.error('Create evaluation period error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 计算评优结果
router.post('/:id/calculate', authenticate, authorize('ADMIN', 'PRESIDENT'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const period = await prisma.evaluationPeriod.findUnique({ where: { id } });
    if (!period) {
      return res.status(404).json({ code: 404, message: '评优周期不存在', data: null });
    }

    await prisma.evaluationPeriod.update({
      where: { id },
      data: { status: 'CALCULATING' }
    });

    const creditRecords = await prisma.creditRecord.findMany({
      where: {
        createdAt: {
          gte: period.startDate,
          lte: period.endDate
        }
      },
      include: {
        user: { select: { id: true, username: true, realName: true, className: true } }
      }
    });

    const userCredits: Record<string, { user: any; totalCredit: number }> = {};

    for (const record of creditRecords) {
      if (!userCredits[record.userId]) {
        userCredits[record.userId] = {
          user: record.user,
          totalCredit: 0
        };
      }
      userCredits[record.userId].totalCredit += record.value;
    }

    const sortedUsers = Object.values(userCredits).sort((a, b) => b.totalCredit - a.totalCredit);
    const totalUsers = sortedUsers.length;

    await prisma.evaluationPeriodResult.deleteMany({ where: { periodId: id } });

    for (let i = 0; i < sortedUsers.length; i++) {
      const { user, totalCredit } = sortedUsers[i];
      const rank = i + 1;
      const percentile = totalUsers > 0 ? rank / totalUsers : 1;

      let level = 'UNQUALIFIED';
      if (percentile <= 0.1) level = 'EXCELLENT';
      else if (percentile <= 0.3) level = 'GOOD';
      else if (percentile <= 0.6) level = 'QUALIFIED';

      await prisma.evaluationPeriodResult.create({
        data: {
          periodId: id,
          userId: user.id,
          totalCredit,
          rank,
          level
        }
      });
    }

    await prisma.evaluationPeriod.update({
      where: { id },
      data: { status: 'PUBLISHED' }
    });

    res.json({ code: 200, message: '计算完成', data: { totalUsers } });
  } catch (error) {
    console.error('Calculate evaluation error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 获取评优结果
router.get('/:id/results', authenticate, authorize('ADMIN', 'PRESIDENT', 'VICE_PRESIDENT'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { level, page = 1, pageSize = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = { periodId: id };
    if (level) where.level = level;

    const [results, total] = await Promise.all([
      prisma.evaluationPeriodResult.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { rank: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              realName: true,
              studentId: true,
              className: true,
              department: { select: { name: true } }
            }
          }
        }
      }),
      prisma.evaluationPeriodResult.count({ where })
    ]);

    res.json({
      code: 200,
      message: '获取成功',
      data: { list: results, total, page: Number(page), pageSize: Number(pageSize) }
    });
  } catch (error) {
    console.error('Get evaluation results error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 修改评优等级
router.put('/results/:id', authenticate, authorize('ADMIN', 'PRESIDENT'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { level, remark } = req.body;

    const result = await prisma.evaluationPeriodResult.update({
      where: { id },
      data: { level, remark }
    });

    res.json({ code: 200, message: '修改成功', data: result });
  } catch (error) {
    console.error('Update evaluation result error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 删除评优周期
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.evaluationPeriodResult.deleteMany({ where: { periodId: id } });
    await prisma.evaluationPeriod.delete({ where: { id } });

    res.json({ code: 200, message: '删除成功', data: null });
  } catch (error) {
    console.error('Delete evaluation period error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

export default router;
