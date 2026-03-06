import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, AuthRequest } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

// 获取所有角色
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { createdAt: 'asc' }
    });

    // 获取每个角色的用户数量
    const rolesWithCount = await Promise.all(
      roles.map(async (role) => {
        const userCount = await prisma.user.count({
          where: { role: role.code }
        });
        return {
          ...role,
          userCount,
          permissionCount: role.permissions ? JSON.parse(role.permissions).length : 0
        };
      })
    );

    res.json({
      code: 200,
      message: '获取成功',
      data: rolesWithCount
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 获取角色详情
router.get('/:code', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.params;
    
    const role = await prisma.role.findUnique({
      where: { code }
    });

    if (!role) {
      return res.status(404).json({ code: 404, message: '角色不存在', data: null });
    }

    const userCount = await prisma.user.count({
      where: { role: code }
    });

    const users = await prisma.user.findMany({
      where: { role: code },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        department: { select: { name: true } }
      }
    });

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        ...role,
        userCount,
        users
      }
    });
  } catch (error) {
    console.error('Get role error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 创建角色（仅管理员）
router.post('/', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { code, name, description, icon, gradient } = req.body;

    // 检查角色代码是否已存在
    const existingRole = await prisma.role.findUnique({
      where: { code }
    });

    if (existingRole) {
      return res.status(400).json({ code: 400, message: '角色代码已存在', data: null });
    }

    const role = await prisma.role.create({
      data: {
        code,
        name,
        description,
        icon,
        gradient
      }
    });

    res.status(201).json({
      code: 200,
      message: '创建成功',
      data: role
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 更新角色（仅管理员）
router.put('/:code', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.params;
    const { name, description, icon, gradient, permissions } = req.body;

    const role = await prisma.role.update({
      where: { code },
      data: {
        name,
        description,
        icon,
        gradient,
        permissions
      }
    });

    res.json({
      code: 200,
      message: '更新成功',
      data: role
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 删除角色（仅管理员）
router.delete('/:id', authenticate, authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // 检查是否有用户在使用该角色
    const role = await prisma.role.findUnique({
      where: { id }
    });

    if (!role) {
      return res.status(404).json({ code: 404, message: '角色不存在', data: null });
    }

    const userCount = await prisma.user.count({
      where: { role: role.code }
    });

    if (userCount > 0) {
      return res.status(400).json({ code: 400, message: '该角色下还有用户，无法删除', data: null });
    }

    await prisma.role.delete({
      where: { id }
    });

    res.json({
      code: 200,
      message: '删除成功',
      data: null
    });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

export default router;
