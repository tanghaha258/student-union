<template>
  <div class="login-container">
    <div class="stars"></div>
    <div class="stars2"></div>
    <div class="stars3"></div>
    <div class="shooting-stars"></div>
    
    <div class="login-box glass-card">
      <div class="login-header">
        <div class="logo-wrapper">
          <div class="logo-icon">
            <el-icon><UserFilled /></el-icon>
          </div>
        </div>
        <h1>学生会管理系统</h1>
        <p>Student Council Management System</p>
      </div>
      
      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="login-form">
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            size="large"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            <span v-if="!loading">登 录</span>
            <span v-else>登录中...</span>
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <span>还没有账号？</span>
        <el-button type="text" @click="showRegister = true">立即注册</el-button>
      </div>
    </div>

    <el-dialog v-model="showRegister" title="用户注册" width="600px" class="register-dialog modern-dialog">
      <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules" label-width="100px" class="modern-form">
        <el-divider content-position="left">基本信息（必填）</el-divider>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="registerForm.username" placeholder="请输入用户名（登录账号，不可更改）" />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="registerForm.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请确认密码" show-password />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="registerForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="registerForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        
        <el-divider content-position="left">详细信息（选填）</el-divider>
        <el-form-item label="学号" prop="studentId">
          <el-input v-model="registerForm.studentId" placeholder="请输入学号" />
        </el-form-item>
        <el-form-item label="班级" prop="className">
          <el-input v-model="registerForm.className" placeholder="请输入班级名称" />
        </el-form-item>
        <el-form-item label="政治面貌" prop="politicalStatus">
          <el-select v-model="registerForm.politicalStatus" placeholder="请选择政治面貌" style="width: 100%">
            <el-option label="群众" value="群众" />
            <el-option label="共青团员" value="共青团员" />
            <el-option label="中共党员" value="中共党员" />
            <el-option label="预备党员" value="预备党员" />
          </el-select>
        </el-form-item>
        <el-form-item label="QQ" prop="qq">
          <el-input v-model="registerForm.qq" placeholder="请输入QQ号码" />
        </el-form-item>
        <el-form-item label="住址" prop="address">
          <el-input v-model="registerForm.address" placeholder="请输入住址" />
        </el-form-item>
        <el-form-item label="入学年份" prop="enrollmentYear">
          <el-input v-model="registerForm.enrollmentYear" placeholder="如：2025年9月" />
        </el-form-item>
        <el-form-item label="自我介绍" prop="bio">
          <el-input v-model="registerForm.bio" type="textarea" :rows="3" placeholder="请输入自我介绍" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRegister = false">取消</el-button>
        <el-button type="primary" :loading="registerLoading" @click="handleRegister">注册</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { register } from '@/api/user'

const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref<FormInstance>()
const registerFormRef = ref<FormInstance>()
const loading = ref(false)
const registerLoading = ref(false)
const showRegister = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const registerForm = reactive({
  username: '',
  realName: '',
  password: '',
  confirmPassword: '',
  email: '',
  phone: '',
  studentId: '',
  className: '',
  politicalStatus: '',
  qq: '',
  address: '',
  bio: '',
  enrollmentYear: ''
})

const loginRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const registerRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { max: 50, message: '真实姓名长度不能超过50个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  studentId: [
    { max: 20, message: '学号长度不能超过20个字符', trigger: 'blur' }
  ],
  className: [
    { max: 50, message: '班级名称长度不能超过50个字符', trigger: 'blur' }
  ],
  qq: [
    { max: 20, message: 'QQ长度不能超过20个字符', trigger: 'blur' }
  ],
  address: [
    { max: 200, message: '地址长度不能超过200个字符', trigger: 'blur' }
  ],
  bio: [
    { max: 500, message: '自我介绍长度不能超过500个字符', trigger: 'blur' }
  ],
  enrollmentYear: [
    { max: 10, message: '入学年份长度不能超过10个字符', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await userStore.loginAction(loginForm)
        ElMessage.success('登录成功')
        router.push('/dashboard')
      } catch (error) {
        console.error(error)
      } finally {
        loading.value = false
      }
    }
  })
}

const handleRegister = async () => {
  if (!registerFormRef.value) return
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      registerLoading.value = true
      try {
        const { confirmPassword, ...registerData } = registerForm
        await register(registerData)
        ElMessage.success('注册成功，请登录')
        showRegister.value = false
        loginForm.username = registerForm.username
        loginForm.password = ''
        // 重置表单
        Object.assign(registerForm, {
          username: '',
          realName: '',
          password: '',
          confirmPassword: '',
          email: '',
          phone: '',
          studentId: '',
          className: '',
          politicalStatus: '',
          qq: '',
          address: '',
          bio: '',
          enrollmentYear: ''
        })
      } catch (error) {
        console.error(error)
      } finally {
        registerLoading.value = false
      }
    }
  })
}
</script>

<style scoped lang="scss">
.login-container {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
}

.stars, .stars2, .stars3 {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.stars {
  background: transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 800 800'%3E%3Cg fill='none' stroke='%23404' stroke-width='1'%3E%3Ccircle cx='400' cy='400' r='1'/%3E%3Ccircle cx='100' cy='100' r='0.5'/%3E%3Ccircle cx='200' cy='300' r='0.8'/%3E%3Ccircle cx='600' cy='200' r='0.6'/%3E%3Ccircle cx='700' cy='500' r='0.7'/%3E%3Ccircle cx='300' cy='600' r='0.5'/%3E%3Ccircle cx='500' cy='700' r='0.8'/%3E%3Ccircle cx='150' cy='450' r='0.6'/%3E%3Ccircle cx='650' cy='350' r='0.7'/%3E%3Ccircle cx='450' cy='150' r='0.5'/%3E%3C/g%3E%3C/svg%3E") repeat;
  animation: starsMove 100s linear infinite;
  opacity: 0.8;
}

.stars2 {
  background: transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 600 600'%3E%3Cg fill='%23fff' fill-opacity='0.6'%3E%3Ccircle cx='50' cy='50' r='1'/%3E%3Ccircle cx='150' cy='200' r='1.2'/%3E%3Ccircle cx='300' cy='100' r='0.8'/%3E%3Ccircle cx='450' cy='300' r='1'/%3E%3Ccircle cx='200' cy='400' r='1.5'/%3E%3Ccircle cx='500' cy='500' r='0.9'/%3E%3Ccircle cx='100' cy='350' r='1.1'/%3E%3Ccircle cx='400' cy='200' r='0.7'/%3E%3C/g%3E%3C/svg%3E") repeat;
  animation: starsMove 80s linear infinite;
  opacity: 0.6;
}

.stars3 {
  background: transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 400 400'%3E%3Cg fill='%238af' fill-opacity='0.4'%3E%3Ccircle cx='80' cy='80' r='1.5'/%3E%3Ccircle cx='200' cy='150' r='1'/%3E%3Ccircle cx='320' cy='280' r='1.3'/%3E%3Ccircle cx='150' cy='320' r='0.9'/%3E%3Ccircle cx='280' cy='50' r='1.2'/%3E%3Ccircle cx='50' cy='250' r='1.1'/%3E%3Ccircle cx='350' cy='150' r='0.8'/%3E%3C/g%3E%3C/svg%3E") repeat;
  animation: starsMove 60s linear infinite;
  opacity: 0.4;
}

@keyframes starsMove {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-100%);
  }
}

.shooting-stars {
  position: absolute;
  width: 100%;
  height: 100%;
  
  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 2px;
    height: 80px;
    background: linear-gradient(to bottom, rgba(255, 255, 255, 0.8), transparent);
    animation: shooting 4s ease-in-out infinite;
    opacity: 0;
  }
  
  &::before {
    top: 10%;
    left: 20%;
    animation-delay: 0s;
  }
  
  &::after {
    top: 30%;
    left: 70%;
    animation-delay: 2s;
  }
}

@keyframes shooting {
  0% {
    transform: translateX(0) translateY(0) rotate(-45deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  100% {
    transform: translateX(-300px) translateY(300px) rotate(-45deg);
    opacity: 0;
  }
}

.login-box {
  width: 420px;
  padding: 48px 40px;
  position: relative;
  z-index: 10;
  animation: floatIn 0.8s ease-out;
}

@keyframes floatIn {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 36px;

  .logo-wrapper {
    margin-bottom: 20px;
  }

  .logo-icon {
    width: 72px;
    height: 72px;
    margin: 0 auto;
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 32px rgba(99, 102, 241, 0.4);
    
    .el-icon {
      font-size: 36px;
      color: white;
    }
  }

  h1 {
    font-size: 26px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 8px;
    letter-spacing: 1px;
  }

  p {
    font-size: 13px;
    color: var(--text-muted);
    letter-spacing: 2px;
  }
}

.login-form {
  :deep(.el-form-item) {
    margin-bottom: 24px;
  }
  
  :deep(.el-input__wrapper) {
    padding: 4px 16px;
    height: 48px;
    background: rgba(255, 255, 255, 0.08) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    
    &:hover {
      background: rgba(255, 255, 255, 0.12) !important;
      border-color: rgba(255, 255, 255, 0.25) !important;
    }
    
    &.is-focus {
      background: rgba(255, 255, 255, 0.12) !important;
      border-color: var(--primary-color) !important;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2) !important;
    }
  }
  
  :deep(.el-input__inner) {
    color: var(--text-primary) !important;
    font-size: 15px;
    
    &::placeholder {
      color: var(--text-muted) !important;
    }
  }
  
  :deep(.el-input__prefix) {
    color: var(--text-muted);
  }
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 4px;
  border-radius: var(--radius-md) !important;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%) !important;
  border: none !important;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4) !important;
  transition: all 0.3s ease !important;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 28px rgba(99, 102, 241, 0.5) !important;
  }
  
  &:active {
    transform: translateY(0);
  }
}

.login-footer {
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  .el-button {
    color: var(--primary-light);
    font-weight: 500;
    
    &:hover {
      color: var(--primary-color);
    }
  }
}

.register-dialog {
  :deep(.el-dialog) {
    border-radius: var(--radius-xl) !important;
    max-height: 80vh;
    overflow-y: auto;
  }
  
  :deep(.el-dialog__body) {
    padding: 20px 30px;
    max-height: 60vh;
    overflow-y: auto;
  }
}
</style>
