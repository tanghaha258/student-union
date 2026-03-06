import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, AuthRequest } from '../middlewares/auth';
import config from '../config';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const keyword = req.query.keyword as string;
    const role = req.query.role as string;
    const departmentId = req.query.departmentId as string;

    const where: any = {};
    if (keyword) {
      where.OR = [
        { username: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } }
      ];
    }
    if (role) {
      where.role = role;
    }
    if (departmentId) {
      where.departmentId = departmentId;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { department: true },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    const usersWithoutPassword = users.map(({ password, ...user }) => user);

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: usersWithoutPassword,
        total,
        page,
        pageSize
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { department: true }
    });

    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在', data: null });
    }

    const { password: _, ...userWithoutPassword } = user;

    res.json({ code: 200, message: '获取成功', data: userWithoutPassword });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

router.post('/', authenticate, authorize('ADMIN', 'PRESIDENT'), async (req: AuthRequest, res: Response) => {
  try {
    const { 
      username, password, realName, email, phone, role, departmentId, position,
      nickname, studentId, className, politicalStatus, qq, address, bio, enrollmentYear
    } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] }
    });

    if (existingUser) {
      return res.status(400).json({ code: 400, message: '用户名或邮箱已存在', data: null });
    }

    if (studentId) {
      const existingStudentId = await prisma.user.findFirst({ where: { studentId } });
      if (existingStudentId) {
        return res.status(400).json({ code: 400, message: '学号已存在', data: null });
      }
    }

    const hashedPassword = await bcrypt.hash(password, config.bcryptSalt);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        realName,
        email,
        phone,
        role: role || 'MEMBER',
        position,
        departmentId,
        nickname,
        studentId,
        className,
        politicalStatus,
        qq,
        address,
        bio,
        enrollmentYear
      },
      include: { department: true }
    });

    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({ code: 200, message: '创建成功', data: userWithoutPassword });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      realName, email, phone, role, departmentId, position, status,
      nickname, studentId, className, politicalStatus, qq, address, bio, enrollmentYear, avatar
    } = req.body;

    const updateData: any = {
      realName, email, phone, role, departmentId, position, status,
      nickname, className, politicalStatus, qq, address, bio, enrollmentYear, avatar
    };

    if (studentId) {
      const existingUser = await prisma.user.findFirst({
        where: { studentId, NOT: { id } }
      });
      if (existingUser) {
        return res.status(400).json({ code: 400, message: '学号已存在', data: null });
      }
      updateData.studentId = studentId;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { department: true }
    });

    const { password: _, ...userWithoutPassword } = user;

    res.json({ code: 200, message: '更新成功', data: userWithoutPassword });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

router.delete('/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({ where: { id } });

    res.json({ code: 200, message: '删除成功', data: null });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

router.put('/password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在', data: null });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ code: 400, message: '原密码错误', data: null });
    }

    const hashedPassword = await bcrypt.hash(newPassword, config.bcryptSalt);

    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword }
    });

    res.json({ code: 200, message: '密码修改成功', data: null });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

router.put('/:id/status', authenticate, authorize('ADMIN', 'PRESIDENT'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ code: 400, message: '无效的状态值', data: null });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { status },
      include: { department: true }
    });

    const { password: _, ...userWithoutPassword } = user;

    res.json({ code: 200, message: '状态更新成功', data: userWithoutPassword });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

export default router;
