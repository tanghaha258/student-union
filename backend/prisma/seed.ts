import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const saltRounds = 10;

async function main() {
  console.log('🌱 Starting seed...');

  const departments = await Promise.all([
    prisma.department.upsert({
      where: { name: '主席团' },
      update: {},
      create: { name: '主席团', description: '学生会核心领导团队' }
    }),
    prisma.department.upsert({
      where: { name: '组织部' },
      update: {},
      create: { name: '组织部', description: '负责组织各类活动' }
    }),
    prisma.department.upsert({
      where: { name: '宣传部' },
      update: {},
      create: { name: '宣传部', description: '负责宣传工作' }
    }),
    prisma.department.upsert({
      where: { name: '学习部' },
      update: {},
      create: { name: '学习部', description: '负责学习相关活动' }
    }),
    prisma.department.upsert({
      where: { name: '文艺部' },
      update: {},
      create: { name: '文艺部', description: '负责文艺活动' }
    }),
    prisma.department.upsert({
      where: { name: '体育部' },
      update: {},
      create: { name: '体育部', description: '负责体育活动' }
    })
  ]);

  console.log('✅ Departments created');

  const hashedPassword = await bcrypt.hash('123456', saltRounds);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: hashedPassword,
        realName: '系统管理员',
        email: 'admin@example.com',
        phone: '13800138000',
        role: 'ADMIN',
        departmentId: departments[0].id
      }
    }),
    prisma.user.upsert({
      where: { username: 'president' },
      update: {},
      create: {
        username: 'president',
        password: hashedPassword,
        realName: '学生会主席',
        email: 'president@example.com',
        phone: '13800138001',
        role: 'PRESIDENT',
        departmentId: departments[0].id
      }
    }),
    prisma.user.upsert({
      where: { username: 'zhangsan' },
      update: {},
      create: {
        username: 'zhangsan',
        password: hashedPassword,
        realName: '张三',
        email: 'zhangsan@example.com',
        phone: '13800138002',
        role: 'MINISTER',
        departmentId: departments[1].id
      }
    }),
    prisma.user.upsert({
      where: { username: 'lisi' },
      update: {},
      create: {
        username: 'lisi',
        password: hashedPassword,
        realName: '李四',
        email: 'lisi@example.com',
        phone: '13800138003',
        role: 'MEMBER',
        departmentId: departments[2].id
      }
    })
  ]);

  console.log('✅ Users created');

  // 先删除旧活动数据
  await prisma.activity.deleteMany({});
  console.log('🗑️ Old activities deleted');

  await Promise.all([
    prisma.activity.create({
      data: {
        title: '学生会换届选举',
        description: '2024年度学生会换届选举活动，欢迎全体同学参与投票',
        startDate: new Date('2025-03-15T14:00:00'),
        endDate: new Date('2025-03-15T17:00:00'),
        registrationStart: new Date('2025-03-01T00:00:00'),
        registrationEnd: new Date('2025-03-10T23:59:59'),
        location: '大礼堂',
        status: 'UPCOMING',
        maxParticipants: 500,
        participantCount: 200,
        requireApproval: false,
        creditEnabled: true,
        creditType: 'COMPREHENSIVE',
        creditValue: 1.0,
        organizerId: users[1].id
      }
    }),
    prisma.activity.create({
      data: {
        title: '春季运动会',
        description: '2025年春季运动会，包含田径、球类等多项比赛',
        startDate: new Date('2025-04-20T08:00:00'),
        endDate: new Date('2025-04-22T18:00:00'),
        registrationStart: new Date('2025-04-01T00:00:00'),
        registrationEnd: new Date('2025-04-15T23:59:59'),
        location: '运动场',
        status: 'UPCOMING',
        maxParticipants: 1000,
        participantCount: 500,
        requireApproval: true,
        creditEnabled: true,
        creditType: 'SPORTS_CULTURE',
        creditValue: 2.0,
        organizerId: users[2].id
      }
    }),
    prisma.activity.create({
      data: {
        title: '志愿者招募活动',
        description: '校园环保志愿者招募，为美丽校园贡献力量',
        startDate: new Date('2025-03-20T09:00:00'),
        endDate: new Date('2025-03-20T12:00:00'),
        registrationStart: new Date('2025-03-05T00:00:00'),
        registrationEnd: new Date('2025-03-18T23:59:59'),
        location: '校园各区域',
        status: 'REGISTERING',
        maxParticipants: 100,
        participantCount: 45,
        requireApproval: false,
        creditEnabled: true,
        creditType: 'VOLUNTEER',
        creditValue: 1.5,
        organizerId: users[2].id
      }
    }),
    prisma.activity.create({
      data: {
        title: '新生迎新晚会',
        description: '2025级新生迎新晚会，展示学生风采',
        startDate: new Date('2025-09-10T19:00:00'),
        endDate: new Date('2025-09-10T21:30:00'),
        registrationStart: new Date('2025-09-01T00:00:00'),
        registrationEnd: new Date('2025-09-08T23:59:59'),
        location: '学生活动中心',
        status: 'DRAFT',
        maxParticipants: 800,
        participantCount: 0,
        requireApproval: false,
        creditEnabled: true,
        creditType: 'SECOND_CLASSROOM',
        creditValue: 0.5,
        organizerId: users[1].id
      }
    })
  ]);

  console.log('✅ Activities created');

  await Promise.all([
    prisma.announcement.create({
      data: {
        title: '关于学生会换届选举的通知',
        content: '根据学校工作安排，将于2024年3月15日举行学生会换届选举，请各部门做好准备工作。',
        priority: 3,
        isPublished: true,
        authorId: users[1].id
      }
    }),
    prisma.announcement.create({
      data: {
        title: '春季运动会志愿者招募',
        content: '为保障春季运动会顺利进行，现面向全体学生会成员招募志愿者，有意者请联系组织部。',
        priority: 2,
        isPublished: true,
        authorId: users[2].id
      }
    })
  ]);

  console.log('✅ Announcements created');

  // 定义权限
  const allPermissions = JSON.stringify([
    'user:list', 'user:create', 'user:edit', 'user:delete',
    'role:list', 'role:create', 'role:edit', 'role:permission',
    'department:list', 'department:create', 'department:edit',
    'member:list', 'member:edit',
    'activity:list', 'activity:create', 'activity:edit', 'activity:delete',
    'announcement:list', 'announcement:create', 'announcement:delete',
    'registration:center', 'registration:my', 'registration:manage', 'registration:review',
    'credit:center', 'credit:manage', 'evaluation:manage',
    'notification:list', 'notification:create', 'notification:delete',
    'recruitment:list', 'recruitment:create', 'recruitment:review'
  ]);

  const presidentPermissions = JSON.stringify([
    'user:list', 'user:create', 'user:edit', 'user:delete',
    'role:list',
    'department:list', 'department:create', 'department:edit',
    'member:list', 'member:edit',
    'activity:list', 'activity:create', 'activity:edit', 'activity:delete',
    'announcement:list', 'announcement:create', 'announcement:delete',
    'registration:center', 'registration:my', 'registration:manage', 'registration:review',
    'credit:center', 'credit:manage', 'evaluation:manage',
    'notification:list', 'notification:create', 'notification:delete',
    'recruitment:list', 'recruitment:create', 'recruitment:review'
  ]);

  const vicePresidentPermissions = JSON.stringify([
    'department:list', 'department:create', 'department:edit',
    'member:list', 'member:edit',
    'activity:list', 'activity:create', 'activity:edit', 'activity:delete',
    'announcement:list', 'announcement:create', 'announcement:delete',
    'registration:center', 'registration:my', 'registration:manage', 'registration:review',
    'credit:center', 'credit:manage',
    'notification:list', 'notification:create', 'notification:delete',
    'recruitment:list', 'recruitment:create', 'recruitment:review'
  ]);

  const ministerPermissions = JSON.stringify([
    'department:list',
    'member:list', 'member:edit',
    'activity:list', 'activity:create', 'activity:edit',
    'announcement:list', 'announcement:create',
    'registration:center', 'registration:my', 'registration:manage', 'registration:review',
    'credit:center',
    'notification:list', 'notification:create',
    'recruitment:list', 'recruitment:review'
  ]);

  const memberPermissions = JSON.stringify([
    'registration:center', 'registration:my',
    'credit:center'
  ]);

  // 创建默认角色
  await Promise.all([
    prisma.role.upsert({
      where: { code: 'ADMIN' },
      update: { permissions: allPermissions },
      create: {
        code: 'ADMIN',
        name: '超级管理员',
        description: '系统最高权限，可管理所有功能和数据',
        icon: 'UserFilled',
        gradient: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
        permissions: allPermissions
      }
    }),
    prisma.role.upsert({
      where: { code: 'PRESIDENT' },
      update: { permissions: presidentPermissions },
      create: {
        code: 'PRESIDENT',
        name: '学生会主席',
        description: '管理所有部门和活动，拥有最高管理权限',
        icon: 'Medal',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #eab308 100%)',
        permissions: presidentPermissions
      }
    }),
    prisma.role.upsert({
      where: { code: 'VICE_PRESIDENT' },
      update: { permissions: vicePresidentPermissions },
      create: {
        code: 'VICE_PRESIDENT',
        name: '副主席',
        description: '协助主席管理，可管理多个部门',
        icon: 'Trophy',
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
        permissions: vicePresidentPermissions
      }
    }),
    prisma.role.upsert({
      where: { code: 'MINISTER' },
      update: { permissions: ministerPermissions },
      create: {
        code: 'MINISTER',
        name: '部长',
        description: '管理本部门成员和活动',
        icon: 'Avatar',
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
        permissions: ministerPermissions
      }
    }),
    prisma.role.upsert({
      where: { code: 'MEMBER' },
      update: { permissions: memberPermissions },
      create: {
        code: 'MEMBER',
        name: '成员',
        description: '基础权限，可查看和参与活动',
        icon: 'User',
        gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
        permissions: memberPermissions
      }
    })
  ]);

  console.log('✅ Roles created');

  await prisma.recruitment.create({
    data: {
      title: '2025春季招新',
      description: '学生会2025年春季招新活动',
      intro: '加入学生会，开启精彩大学生活',
      startDate: new Date('2025-01-01T00:00:00'),
      endDate: new Date('2025-12-31T23:59:59'),
      status: 'OPEN',
      requirements: '热爱学生工作，有责任心，有团队合作精神',
      benefits: '提升领导力、拓展人脉、技能成长、荣誉认证',
      process: '在线报名 → 简历筛选 → 面试考核 → 录用公示'
    }
  });

  console.log('✅ Recruitment created');

  console.log('🎉 Seed completed!');
  console.log('\n📝 Test accounts:');
  console.log('  - admin / 123456 (超级管理员)');
  console.log('  - president / 123456 (学生会主席)');
  console.log('  - zhangsan / 123456 (部长)');
  console.log('  - lisi / 123456 (成员)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
