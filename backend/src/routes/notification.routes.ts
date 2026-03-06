import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, AuthRequest } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

// 获取当前用户的通知列表
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在', data: null });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { targetType: 'ALL' },
          { targetType: 'ROLE', targetIds: { contains: user.role } },
          { targetType: 'DEPARTMENT', targetIds: { contains: user.departmentId || '' } },
          { targetType: 'USER', targetIds: { contains: userId } }
        ]
      },
      include: {
        sender: { select: { id: true, username: true, realName: true, avatar: true } },
        reads: { where: { userId } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const notificationsWithStatus = notifications.map(n => ({
      ...n,
      isRead: n.reads.length > 0,
      confirmed: n.reads[0]?.confirmed || false
    }));

    res.json({ code: 200, message: '获取成功', data: notificationsWithStatus });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 获取未读通知数量
router.get('/unread', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在', data: null });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { targetType: 'ALL' },
          { targetType: 'ROLE', targetIds: { contains: user.role } },
          { targetType: 'DEPARTMENT', targetIds: { contains: user.departmentId || '' } },
          { targetType: 'USER', targetIds: { contains: userId } }
        ]
      },
      include: {
        reads: { where: { userId } }
      }
    });

    const unreadCount = notifications.filter(n => n.reads.length === 0).length;
    const urgentUnread = notifications.filter(n => n.priority === 1 && n.reads.length === 0).length;
    const importantUnread = notifications.filter(n => n.priority === 2 && n.reads.length === 0).length;

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        total: unreadCount,
        urgent: urgentUnread,
        important: importantUnread
      }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 获取需要弹窗的通知（紧急和重要）
router.get('/popup', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在', data: null });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { targetType: 'ALL' },
          { targetType: 'ROLE', targetIds: { contains: user.role } },
          { targetType: 'DEPARTMENT', targetIds: { contains: user.departmentId || '' } },
          { targetType: 'USER', targetIds: { contains: userId } }
        ],
        priority: { in: [1, 2] }
      },
      include: {
        sender: { select: { id: true, username: true, realName: true, avatar: true } },
        reads: { where: { userId } }
      },
      orderBy: { priority: 'asc' }
    });

    const popupNotifications = notifications.filter(n => {
      if (n.priority === 1) return n.reads.length === 0 || !n.reads[0].confirmed;
      if (n.priority === 2) return n.reads.length === 0;
      return false;
    });

    res.json({ code: 200, message: '获取成功', data: popupNotifications });
  } catch (error) {
    console.error('Get popup notifications error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 获取通知详情
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const notification = await prisma.notification.findUnique({
      where: { id },
      include: {
        sender: { select: { id: true, username: true, realName: true, avatar: true } }
      }
    });

    if (!notification) {
      return res.status(404).json({ code: 404, message: '通知不存在', data: null });
    }

    const read = await prisma.notificationRead.findUnique({
      where: { notificationId_userId: { notificationId: id, userId } }
    });

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        ...notification,
        isRead: !!read,
        confirmed: read?.confirmed || false
      }
    });
  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 标记已读
router.put('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    await prisma.notificationRead.upsert({
      where: { notificationId_userId: { notificationId: id, userId } },
      update: { readAt: new Date() },
      create: { notificationId: id, userId }
    });

    res.json({ code: 200, message: '已标记为已读', data: null });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 全部标记已读
router.put('/read-all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      return res.status(404).json({ code: 404, message: '用户不存在', data: null });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { targetType: 'ALL' },
          { targetType: 'ROLE', targetIds: { contains: user.role } },
          { targetType: 'DEPARTMENT', targetIds: { contains: user.departmentId || '' } },
          { targetType: 'USER', targetIds: { contains: userId } }
        ]
      },
      select: { id: true }
    });

    const readData = notifications.map(n => ({
      notificationId: n.id,
      userId
    }));

    for (const data of readData) {
      await prisma.notificationRead.upsert({
        where: { notificationId_userId: { notificationId: data.notificationId, userId: data.userId } },
        update: { readAt: new Date() },
        create: data
      });
    }

    res.json({ code: 200, message: '已全部标记为已读', data: null });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 确认紧急通知
router.put('/:id/confirm', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    await prisma.notificationRead.upsert({
      where: { notificationId_userId: { notificationId: id, userId } },
      update: { confirmed: true, readAt: new Date() },
      create: { notificationId: id, userId, confirmed: true }
    });

    res.json({ code: 200, message: '已确认', data: null });
  } catch (error) {
    console.error('Confirm notification error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 创建通知（管理员）
router.post('/', authenticate, authorize('ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'MINISTER'), async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, priority, targetType, targetIds } = req.body;
    const senderId = req.userId;

    if (!title || !content) {
      return res.status(400).json({ code: 400, message: '标题和内容不能为空', data: null });
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        content,
        priority: priority || 3,
        targetType: targetType || 'ALL',
        targetIds: targetIds ? JSON.stringify(targetIds) : null,
        senderId
      },
      include: {
        sender: { select: { id: true, username: true, realName: true, avatar: true } }
      }
    });

    res.status(201).json({ code: 200, message: '创建成功', data: notification });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 删除通知（管理员）
router.delete('/:id', authenticate, authorize('ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'MINISTER'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.notificationRead.deleteMany({ where: { notificationId: id } });
    await prisma.notification.delete({ where: { id } });

    res.json({ code: 200, message: '删除成功', data: null });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 获取所有通知（管理员）
router.get('/admin/all', authenticate, authorize('ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'MINISTER'), async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      include: {
        sender: { select: { id: true, username: true, realName: true, avatar: true } },
        _count: { select: { reads: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ code: 200, message: '获取成功', data: notifications });
  } catch (error) {
    console.error('Get all notifications error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

// 获取通知已读人员列表（管理员）
router.get('/:id/read-status', authenticate, authorize('ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'MINISTER'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { targetType: true, targetIds: true }
    });

    if (!notification) {
      return res.status(404).json({ code: 404, message: '通知不存在', data: null });
    }

    // 获取目标用户
    let targetUsers: any[] = [];
    
    if (notification.targetType === 'ALL') {
      targetUsers = await prisma.user.findMany({
        select: { id: true, username: true, realName: true, studentId: true, className: true, department: { select: { name: true } } }
      });
    } else if (notification.targetType === 'ROLE' && notification.targetIds) {
      const roles = JSON.parse(notification.targetIds);
      targetUsers = await prisma.user.findMany({
        where: { role: { in: roles } },
        select: { id: true, username: true, realName: true, studentId: true, className: true, department: { select: { name: true } } }
      });
    } else if (notification.targetType === 'DEPARTMENT' && notification.targetIds) {
      const deptIds = JSON.parse(notification.targetIds);
      targetUsers = await prisma.user.findMany({
        where: { departmentId: { in: deptIds } },
        select: { id: true, username: true, realName: true, studentId: true, className: true, department: { select: { name: true } } }
      });
    } else if (notification.targetType === 'USER' && notification.targetIds) {
      const userIds = JSON.parse(notification.targetIds);
      targetUsers = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, username: true, realName: true, studentId: true, className: true, department: { select: { name: true } } }
      });
    }

    // 获取已读记录
    const reads = await prisma.notificationRead.findMany({
      where: { notificationId: id },
      select: { userId: true, readAt: true, confirmed: true }
    });

    const readMap = new Map(reads.map(r => [r.userId, r]));

    const result = targetUsers.map(user => {
      const readInfo = readMap.get(user.id);
      return {
        ...user,
        isRead: !!readInfo,
        readAt: readInfo?.readAt || null,
        confirmed: readInfo?.confirmed || false
      };
    });

    const readCount = result.filter(u => u.isRead).length;
    const unreadCount = result.length - readCount;

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        total: result.length,
        readCount,
        unreadCount,
        users: result
      }
    });
  } catch (error) {
    console.error('Get read status error:', error);
    res.status(500).json({ code: 500, message: '服务器错误', data: null });
  }
});

export default router;
