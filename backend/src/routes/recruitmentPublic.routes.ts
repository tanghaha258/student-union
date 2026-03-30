import { Router, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// 获取当前招新活动（公开接口，无需登录）
router.get('/current', async (req, res: Response) => {
  try {
    const recruitment = await prisma.recruitment.findFirst({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { applications: true } }
      }
    });

    res.json({ code: 200, message: '获取成功', data: recruitment });
  } catch (error) {
    console.error('Get current recruitment error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 获取招新活动详情（公开接口）
router.get('/:id', async (req, res: Response) => {
  try {
    const { id } = req.params;
    const recruitment = await prisma.recruitment.findUnique({
      where: { id },
      include: {
        _count: { select: { applications: true } }
      }
    });

    if (!recruitment) {
      return res.status(404).json({ code: 404, message: '招新活动不存在', data: null });
    }

    res.json({ code: 200, message: '获取成功', data: recruitment });
  } catch (error) {
    console.error('Get recruitment error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 提交报名（公开接口，无需登录）
router.post('/:id/apply', async (req, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name, studentId, className, phone, email, qq,
      gender, birthday, skills, experience,
      reason, expectation, department1, department2, isAdjusted
    } = req.body;

    const recruitment = await prisma.recruitment.findUnique({ where: { id } });
    if (!recruitment) {
      return res.status(404).json({ code: 404, message: '招新活动不存在', data: null });
    }

    if (recruitment.status !== 'OPEN') {
      return res.status(400).json({ code: 400, message: '招新活动未开放', data: null });
    }

    const now = new Date();
    if (now < recruitment.startDate || now > recruitment.endDate) {
      return res.status(400).json({ code: 400, message: '不在报名时间范围内', data: null });
    }

    // 检查是否已报名
    const existing = await prisma.recruitmentApplication.findFirst({
      where: { recruitmentId: id, studentId }
    });
    if (existing) {
      return res.status(400).json({ code: 400, message: '您已报名，请勿重复提交', data: null });
    }

    const application = await prisma.recruitmentApplication.create({
      data: {
        recruitmentId: id,
        name, studentId, className, phone, email, qq,
        gender, birthday, skills, experience,
        reason, expectation, department1, department2, 
        isAdjusted: isAdjusted || false
      }
    });

    res.status(201).json({ code: 200, message: '报名成功！请等待面试通知', data: { id: application.id } });
  } catch (error) {
    console.error('Apply recruitment error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 查询报名状态（公开接口）
router.get('/application/:id', async (req, res: Response) => {
  try {
    const { id } = req.params;
    const application = await prisma.recruitmentApplication.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        status: true,
        interviewTime: true,
        interviewLocation: true,
        remark: true,
        createdAt: true
      }
    });

    if (!application) {
      return res.status(404).json({ code: 404, message: '报名记录不存在', data: null });
    }

    res.json({ code: 200, message: '获取成功', data: application });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

export default router;
