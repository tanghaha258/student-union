import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, AuthRequest } from '../middlewares/auth';
import * as XLSX from 'xlsx';

const router = Router();
const prisma = new PrismaClient();

// 导出学分记录
router.get('/credits', authenticate, authorize('ADMIN', 'PRESIDENT', 'VICE_PRESIDENT'), async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, type } = req.query;

    const where: any = {};
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
        user: { select: { username: true, realName: true, studentId: true, className: true } },
        activity: { select: { title: true } },
        registrationActivity: { select: { title: true } }
      }
    });

    const data = records.map(r => ({
      '学号': r.user.studentId || '',
      '姓名': r.user.realName || r.user.username,
      '班级': r.user.className || '',
      '学分类型': getCreditTypeName(r.type),
      '学分值': r.value,
      '来源': getSourceName(r.source),
      '活动名称': r.activity?.title || r.registrationActivity?.title || '',
      '描述': r.description || '',
      '时间': formatDateTime(r.createdAt)
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, '学分记录');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=credits_${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Export credits error:', error);
    res.status(500).json({ code: 500, message: '导出失败', data: null });
  }
});

// 导出报名记录
router.get('/registrations', authenticate, authorize('ADMIN', 'PRESIDENT', 'MINISTER'), async (req: AuthRequest, res: Response) => {
  try {
    const { activityId } = req.query;

    const where: any = {};
    if (activityId) where.activityId = activityId;

    const records = await prisma.registration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { username: true, realName: true, studentId: true, className: true, phone: true, email: true } },
        activity: { select: { title: true } }
      }
    });

    const data = records.map(r => ({
      '学号': r.user.studentId || '',
      '姓名': r.user.realName || r.user.username,
      '班级': r.user.className || '',
      '手机号': r.user.phone || '',
      '邮箱': r.user.email || '',
      '活动名称': r.activity.title,
      '状态': getStatusName(r.status),
      '备注': r.remark || '',
      '报名时间': formatDateTime(r.createdAt)
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, '报名记录');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=registrations_${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Export registrations error:', error);
    res.status(500).json({ code: 500, message: '导出失败', data: null });
  }
});

// 导出评优结果
router.get('/evaluations/:periodId', authenticate, authorize('ADMIN', 'PRESIDENT'), async (req: AuthRequest, res: Response) => {
  try {
    const { periodId } = req.params;

    const results = await prisma.evaluationPeriodResult.findMany({
      where: { periodId },
      orderBy: { rank: 'asc' },
      include: {
        user: { select: { username: true, realName: true, studentId: true, className: true, department: { select: { name: true } } } },
        period: { select: { name: true } }
      }
    });

    const data = results.map(r => ({
      '排名': r.rank,
      '学号': r.user.studentId || '',
      '姓名': r.user.realName || r.user.username,
      '班级': r.user.className || '',
      '部门': r.user.department?.name || '',
      '总学分': r.totalCredit,
      '评优等级': getLevelName(r.level),
      '备注': r.remark || ''
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, '评优结果');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=evaluation_${periodId}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Export evaluation error:', error);
    res.status(500).json({ code: 500, message: '导出失败', data: null });
  }
});

// 导出用户列表
router.get('/users', authenticate, authorize('ADMIN', 'PRESIDENT'), async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        department: { select: { name: true } }
      }
    });

    const data = users.map(u => ({
      '学号': u.studentId || '',
      '用户名': u.username,
      '姓名': u.realName || '',
      '昵称': u.nickname || '',
      '班级': u.className || '',
      '部门': u.department?.name || '',
      '角色': getRoleName(u.role),
      '邮箱': u.email || '',
      '手机号': u.phone || '',
      '状态': u.status === 'ACTIVE' ? '正常' : '禁用',
      '注册时间': formatDateTime(u.createdAt)
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, '用户列表');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=users_${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({ code: 500, message: '导出失败', data: null });
  }
});

// 辅助函数
function formatDateTime(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function getCreditTypeName(type: string): string {
  const map: Record<string, string> = {
    'COMPREHENSIVE': '综合测评',
    'SECOND_CLASSROOM': '第二课堂',
    'VOLUNTEER': '志愿服务',
    'SPORTS_CULTURE': '文体活动'
  };
  return map[type] || type;
}

function getSourceName(source: string): string {
  const map: Record<string, string> = {
    'ACTIVITY': '活动管理',
    'REGISTRATION_ACTIVITY': '报名活动',
    'MANUAL': '手动添加'
  };
  return map[source] || source;
}

function getStatusName(status: string): string {
  const map: Record<string, string> = {
    'PENDING': '待审核',
    'APPROVED': '已通过',
    'REJECTED': '已拒绝',
    'CANCELLED': '已取消'
  };
  return map[status] || status;
}

function getLevelName(level: string): string {
  const map: Record<string, string> = {
    'EXCELLENT': '优秀',
    'GOOD': '良好',
    'QUALIFIED': '合格',
    'UNQUALIFIED': '不合格'
  };
  return map[level] || level;
}

function getRoleName(role: string): string {
  const map: Record<string, string> = {
    'ADMIN': '超级管理员',
    'PRESIDENT': '学生会主席',
    'VICE_PRESIDENT': '副主席',
    'MINISTER': '部长',
    'MEMBER': '成员'
  };
  return map[role] || role;
}

export default router;
