import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middlewares/auth';

const router = Router();

// 获取招新活动列表
router.get('/', authenticate, authorize('ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'MINISTER'), async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = {};
    if (status) where.status = status;

    const [recruitments, total] = await Promise.all([
      prisma.recruitment.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { applications: true } }
        }
      }),
      prisma.recruitment.count({ where })
    ]);

    res.json({
      code: 200,
      message: '获取成功',
      data: { list: recruitments, total, page: Number(page), pageSize: Number(pageSize) }
    });
  } catch (error) {
    console.error('Get recruitments error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 创建招新活动
router.post('/', authenticate, authorize('ADMIN', 'PRESIDENT'), async (req: AuthRequest, res: Response) => {
  try {
    const {
      title, description, startDate, endDate,
      banner, intro, requirements, benefits, process
    } = req.body;

    const recruitment = await prisma.recruitment.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        banner,
        intro,
        requirements,
        benefits,
        process
      }
    });

    res.status(201).json({ code: 200, message: '创建成功', data: recruitment });
  } catch (error) {
    console.error('Create recruitment error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 更新招新活动
router.post('/:id', authenticate, authorize('ADMIN', 'PRESIDENT'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title, description, startDate, endDate, status,
      banner, intro, requirements, benefits, process
    } = req.body;

    const recruitment = await prisma.recruitment.update({
      where: { id },
      data: {
        title,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status,
        banner,
        intro,
        requirements,
        benefits,
        process
      }
    });

    res.json({ code: 200, message: '更新成功', data: recruitment });
  } catch (error) {
    console.error('Update recruitment error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 删除招新活动
router.post('/:id/delete', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.recruitment.delete({ where: { id } });
    res.json({ code: 200, message: '删除成功', data: null });
  } catch (error) {
    console.error('Delete recruitment error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 发布招新活动
router.post('/:id/publish', authenticate, authorize('ADMIN', 'PRESIDENT'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const recruitment = await prisma.recruitment.update({
      where: { id },
      data: { status: 'OPEN' }
    });
    res.json({ code: 200, message: '发布成功', data: recruitment });
  } catch (error) {
    console.error('Publish recruitment error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 结束招新活动
router.post('/:id/close', authenticate, authorize('ADMIN', 'PRESIDENT'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const recruitment = await prisma.recruitment.update({
      where: { id },
      data: { status: 'CLOSED' }
    });
    res.json({ code: 200, message: '已结束', data: recruitment });
  } catch (error) {
    console.error('Close recruitment error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 获取招新统计数据
router.get('/:id/stats', authenticate, authorize('ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'MINISTER'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const [total, pending, approved, rejected, interview, hired, failed] = await Promise.all([
      prisma.recruitmentApplication.count({ where: { recruitmentId: id } }),
      prisma.recruitmentApplication.count({ where: { recruitmentId: id, status: 'PENDING' } }),
      prisma.recruitmentApplication.count({ where: { recruitmentId: id, status: 'APPROVED' } }),
      prisma.recruitmentApplication.count({ where: { recruitmentId: id, status: 'REJECTED' } }),
      prisma.recruitmentApplication.count({ where: { recruitmentId: id, status: 'INTERVIEW' } }),
      prisma.recruitmentApplication.count({ where: { recruitmentId: id, status: 'HIRED' } }),
      prisma.recruitmentApplication.count({ where: { recruitmentId: id, status: 'FAILED' } })
    ]);

    const departmentStats = await prisma.recruitmentApplication.groupBy({
      by: ['department1'],
      where: { recruitmentId: id },
      _count: true
    });

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        total,
        pending,
        approved,
        rejected,
        interview,
        hired,
        failed,
        departmentStats: departmentStats.map(d => ({
          department: d.department1,
          count: d._count
        }))
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 获取报名详情
router.get('/applications/:applicationId', authenticate, authorize('ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'MINISTER'), async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId } = req.params;
    const application = await prisma.recruitmentApplication.findUnique({
      where: { id: applicationId },
      include: { recruitment: true }
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

// 批量更新报名状态
router.post('/applications/batch', authenticate, authorize('ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'MINISTER'), async (req: AuthRequest, res: Response) => {
  try {
    const { ids, status } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ code: 400, message: '请选择要操作的记录', data: null });
    }

    await prisma.recruitmentApplication.updateMany({
      where: { id: { in: ids } },
      data: { status }
    });

    res.json({ code: 200, message: '批量更新成功', data: { count: ids.length } });
  } catch (error) {
    console.error('Batch update error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 安排面试
router.post('/applications/:applicationId/interview', authenticate, authorize('ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'MINISTER'), async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId } = req.params;
    const { interviewTime, interviewLocation, remark } = req.body;

    const application = await prisma.recruitmentApplication.update({
      where: { id: applicationId },
      data: {
        status: 'INTERVIEW',
        interviewTime,
        interviewLocation,
        remark
      }
    });

    res.json({ code: 200, message: '面试安排成功', data: application });
  } catch (error) {
    console.error('Arrange interview error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 获取报名列表
router.get('/:id/applications', authenticate, authorize('ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'MINISTER'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 10, status, department, keyword } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);

    const where: any = { recruitmentId: id };
    if (status) where.status = status;
    if (department) {
      where.OR = [
        { department1: department },
        { department2: department }
      ];
    }
    if (keyword) {
      where.OR = [
        { name: { contains: keyword as string } },
        { studentId: { contains: keyword as string } },
        { className: { contains: keyword as string } }
      ];
    }

    const [applications, total] = await Promise.all([
      prisma.recruitmentApplication.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.recruitmentApplication.count({ where })
    ]);

    res.json({
      code: 200,
      message: '获取成功',
      data: { list: applications, total, page: Number(page), pageSize: Number(pageSize) }
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 更新报名状态
router.post('/applications/:applicationId', authenticate, authorize('ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'MINISTER'), async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId } = req.params;
    const { status, interviewTime, interviewLocation, remark } = req.body;

    const application = await prisma.recruitmentApplication.update({
      where: { id: applicationId },
      data: { status, interviewTime, interviewLocation, remark }
    });

    res.json({ code: 200, message: '更新成功', data: application });
  } catch (error) {
    console.error('Update application error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 导出报名数据
router.get('/:id/export', authenticate, authorize('ADMIN', 'PRESIDENT', 'VICE_PRESIDENT'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const applications = await prisma.recruitmentApplication.findMany({
      where: { recruitmentId: id },
      orderBy: { createdAt: 'asc' }
    });

    const headers = ['姓名', '学号', '班级', '手机号', '邮箱', 'QQ', '性别', '出生日期', '技能特长', '相关经历', '报名原因', '期望收获', '第一志愿', '第二志愿', '是否服从调剂', '状态', '面试时间', '面试地点', '备注', '报名时间'];
    const csvRows = [headers.join(',')];

    for (const app of applications) {
      const row = [
        app.name,
        app.studentId,
        app.className,
        app.phone,
        app.email || '',
        app.qq || '',
        app.gender || '',
        app.birthday || '',
        `"${(app.skills || '').replace(/"/g, '""')}"`,
        `"${(app.experience || '').replace(/"/g, '""')}"`,
        `"${(app.reason || '').replace(/"/g, '""')}"`,
        `"${(app.expectation || '').replace(/"/g, '""')}"`,
        app.department1 || '',
        app.department2 || '',
        app.isAdjusted ? '是' : '否',
        app.status === 'PENDING' ? '待审核' : app.status === 'APPROVED' ? '已通过' : '已拒绝',
        app.interviewTime || '',
        app.interviewLocation || '',
        `"${(app.remark || '').replace(/"/g, '""')}"`,
        new Date(app.createdAt).toLocaleString('zh-CN')
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = '\uFEFF' + csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=recruitment_applications.csv');
    res.send(csvContent);
  } catch (error) {
    console.error('Export applications error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

export default router;
