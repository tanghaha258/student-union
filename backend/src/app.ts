import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import errorHandler from './middlewares/errorHandler';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import departmentRoutes from './routes/department.routes';
import activityRoutes from './routes/activity.routes';
import announcementRoutes from './routes/announcement.routes';
import dashboardRoutes from './routes/dashboard.routes';
import roleRoutes from './routes/role.routes';
import registrationActivityRoutes from './routes/registrationActivity.routes';
import registrationRoutes from './routes/registration.routes';
import evaluationActivityRoutes from './routes/evaluationActivity.routes';
import evaluationApplicationRoutes from './routes/evaluationApplication.routes';
import evaluationReviewRoutes from './routes/evaluationReview.routes';
import recruitmentPublicRoutes from './routes/recruitmentPublic.routes';
import recruitmentRoutes from './routes/recruitment.routes';
import uploadRoutes from './routes/upload.routes';
import notificationRoutes from './routes/notification.routes';
import creditRoutes from './routes/credit.routes';
import evaluationPeriodRoutes from './routes/evaluationPeriod.routes';
import exportRoutes from './routes/export.routes';

dotenv.config();

const app: Application = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Server is running', timestamp: new Date().toISOString() });
});

app.get('/api', (req: Request, res: Response) => {
  res.json({ 
    message: '学生会信息管理系统 API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      departments: '/api/departments',
      activities: '/api/activities',
      announcements: '/api/announcements',
      dashboard: '/api/dashboard',
      roles: '/api/roles'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/registration-activities', registrationActivityRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/evaluation-activities', evaluationActivityRoutes);
app.use('/api/evaluation-applications', evaluationApplicationRoutes);
app.use('/api/evaluation-reviews', evaluationReviewRoutes);
app.use('/api/public/recruitment', recruitmentPublicRoutes);
app.use('/api/recruitments', recruitmentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/evaluation-periods', evaluationPeriodRoutes);
app.use('/api/export', exportRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use(errorHandler);

export default app;
