import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import config from '../config';
import { authenticate, AuthRequest } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

const registerValidation = [
  body('username').isLength({ min: 3, max: 20 }).withMessage('用户名长度需在3-20之间'),
  body('password').isLength({ min: 6 }).withMessage('密码长度至少6位'),
  body('email').isEmail().withMessage('请输入有效的邮箱地址'),
  body('nickname').optional().isLength({ max: 50 }).withMessage('昵称长度不能超过50'),
  body('studentId').optional().isLength({ max: 20 }).withMessage('学号长度不能超过20'),
  body('className').optional().isLength({ max: 50 }).withMessage('班级名称长度不能超过50'),
  body('politicalStatus').optional().isLength({ max: 20 }).withMessage('政治面貌长度不能超过20'),
  body('qq').optional().isLength({ max: 20 }).withMessage('QQ长度不能超过20'),
  body('address').optional().isLength({ max: 200 }).withMessage('地址长度不能超过200'),
  body('bio').optional().isLength({ max: 500 }).withMessage('自我介绍长度不能超过500'),
  body('enrollmentYear').optional().isLength({ max: 10 }).withMessage('入学年份长度不能超过10')
];

const loginValidation = [
  body('username').notEmpty().withMessage('请输入用户名'),
  body('password').notEmpty().withMessage('请输入密码')
];

router.post('/register', registerValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ code: 400, message: errors.array()[0].msg, data: null });
    }

    const { 
      username, password, realName, email, phone, studentId,
      className, politicalStatus, qq, address, bio, enrollmentYear
    } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] }
    });

    if (existingUser) {
      return res.status(400).json({ code: 400, message: '用户名或邮箱已存在', data: null });
    }

    if (studentId) {
      const existingStudentId = await prisma.user.findFirst({
        where: { studentId }
      });
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
        studentId,
        className,
        politicalStatus,
        qq,
        address,
        bio,
        enrollmentYear,
        role: 'MEMBER'
      }
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      code: 200,
      message: '注册成功',
      data: { user: userWithoutPassword, token }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

router.post('/login', loginValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ code: 400, message: errors.array()[0].msg, data: null });
    }

    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { username },
      include: { department: true }
    });

    if (!user) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误', data: null });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误', data: null });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      code: 200,
      message: '登录成功',
      data: { user: userWithoutPassword, token }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

router.post('/logout', authenticate, (req: Request, res: Response) => {
  res.json({ code: 200, message: '退出成功', data: null });
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { department: true }
    });

    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在', data: null });
    }

    // 获取角色权限
    const role = await prisma.role.findUnique({
      where: { code: user.role }
    });

    const { password: _, ...userWithoutPassword } = user;

    // 解析权限
    let permissions: string[] = [];
    if (role?.permissions) {
      try {
        permissions = JSON.parse(role.permissions);
      } catch (e) {
        console.error('Failed to parse permissions:', e);
      }
    }

    res.json({ 
      code: 200, 
      message: '获取成功', 
      data: {
        ...userWithoutPassword,
        permissions
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

export default router;
