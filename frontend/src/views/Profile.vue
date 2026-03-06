<template>
  <div class="profile-container">
    <div class="profile-header">
      <div class="profile-cover"></div>
      <div class="profile-info glass-card">
        <div class="avatar-section">
          <div class="avatar-wrapper" @click="triggerAvatarUpload">
            <el-avatar :size="100" :src="getAvatarUrl(userInfo.avatar)" class="profile-avatar">
              {{ (userInfo.realName || userInfo.username)?.charAt(0)?.toUpperCase() }}
            </el-avatar>
            <div class="avatar-overlay">
              <el-icon><Camera /></el-icon>
              <span>更换头像</span>
            </div>
          </div>
          <input 
            ref="avatarInput" 
            type="file" 
            accept="image/*" 
            style="display: none" 
            @change="handleAvatarChange"
          />
          <div class="user-basic">
            <h2>{{ userInfo.realName || userInfo.username }}</h2>
            <p class="username">@{{ userInfo.username }}</p>
            <div class="user-tags">
              <el-tag size="small" effect="dark" type="primary">{{ getRoleName(userInfo.role) }}</el-tag>
              <el-tag v-if="userInfo.department?.name" size="small" effect="dark" type="success">{{ userInfo.department.name }}</el-tag>
            </div>
          </div>
        </div>
        <div class="profile-actions">
          <el-button type="primary" @click="isEditing = true" v-if="!isEditing">
            <el-icon><Edit /></el-icon>
            编辑资料
          </el-button>
          <el-button @click="isEditing = false" v-else>
            <el-icon><Close /></el-icon>
            取消
          </el-button>
        </div>
      </div>
    </div>

    <div class="profile-content">
      <el-row :gutter="24">
        <el-col :xs="24" :lg="16">
          <div class="info-card glass-card">
            <div class="card-header">
              <h3>基本信息</h3>
              <span class="edit-hint" v-if="isEditing">用户名注册后不可更改</span>
            </div>
            
            <el-form 
              ref="formRef" 
              :model="editForm" 
              :rules="formRules" 
              label-width="100px" 
              class="profile-form"
              :disabled="!isEditing"
            >
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="用户名">
                    <el-input v-model="editForm.username" disabled placeholder="用户名不可更改" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="真实姓名" prop="realName">
                    <el-input v-model="editForm.realName" placeholder="请输入真实姓名" />
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="学号" prop="studentId">
                    <el-input v-model="editForm.studentId" placeholder="请输入学号" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="班级" prop="className">
                    <el-input v-model="editForm.className" placeholder="请输入班级" />
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="邮箱" prop="email">
                    <el-input v-model="editForm.email" placeholder="请输入邮箱" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="手机号" prop="phone">
                    <el-input v-model="editForm.phone" placeholder="请输入手机号" />
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="政治面貌" prop="politicalStatus">
                    <el-select v-model="editForm.politicalStatus" placeholder="请选择" style="width: 100%">
                      <el-option label="群众" value="群众" />
                      <el-option label="共青团员" value="共青团员" />
                      <el-option label="中共党员" value="中共党员" />
                      <el-option label="预备党员" value="预备党员" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="QQ" prop="qq">
                    <el-input v-model="editForm.qq" placeholder="请输入QQ号码" />
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="入学年份" prop="enrollmentYear">
                    <el-input v-model="editForm.enrollmentYear" placeholder="如：2025年9月" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="部门">
                    <el-input :value="userInfo.department?.name || '未分配'" disabled />
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-form-item label="住址" prop="address">
                <el-input v-model="editForm.address" placeholder="请输入住址" />
              </el-form-item>
              
              <el-form-item label="自我介绍" prop="bio">
                <el-input v-model="editForm.bio" type="textarea" :rows="4" placeholder="请输入自我介绍" />
              </el-form-item>
              
              <el-form-item v-if="isEditing">
                <el-button type="primary" :loading="saving" @click="handleSave">
                  <el-icon><Check /></el-icon>
                  保存修改
                </el-button>
                <el-button @click="isEditing = false">取消</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-col>
        
        <el-col :xs="24" :lg="8">
          <div class="side-card glass-card">
            <h3>安全设置</h3>
            <div class="security-item" @click="showPasswordDialog = true">
              <div class="security-icon">
                <el-icon><Lock /></el-icon>
              </div>
              <div class="security-info">
                <span class="label">修改密码</span>
                <span class="desc">定期修改密码保护账户安全</span>
              </div>
              <el-icon class="arrow"><ArrowRight /></el-icon>
            </div>
          </div>
          
          <div class="side-card glass-card stats-card">
            <h3>账户统计</h3>
            <div class="stat-item">
              <span class="stat-label">注册时间</span>
              <span class="stat-value">{{ formatDate(userInfo.createdAt) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">最后更新</span>
              <span class="stat-value">{{ formatDate(userInfo.updatedAt) }}</span>
            </div>
          </div>
          
          <div class="side-card glass-card credit-summary">
            <h3>学分概览</h3>
            <div class="credit-total">
              <span class="total-value">{{ creditStats.total.toFixed(1) }}</span>
              <span class="total-label">总学分</span>
            </div>
            <div class="credit-breakdown">
              <div class="breakdown-item">
                <span class="dot comprehensive"></span>
                <span class="type">综合测评</span>
                <span class="value">{{ creditStats.comprehensive.toFixed(1) }}</span>
              </div>
              <div class="breakdown-item">
                <span class="dot classroom"></span>
                <span class="type">第二课堂</span>
                <span class="value">{{ creditStats.secondClassroom.toFixed(1) }}</span>
              </div>
              <div class="breakdown-item">
                <span class="dot volunteer"></span>
                <span class="type">志愿服务</span>
                <span class="value">{{ creditStats.volunteer.toFixed(1) }}</span>
              </div>
              <div class="breakdown-item">
                <span class="dot sports"></span>
                <span class="type">文体活动</span>
                <span class="value">{{ creditStats.sportsCulture.toFixed(1) }}</span>
              </div>
            </div>
            <el-button type="primary" text size="small" @click="router.push('/credit-center')">
              查看详情
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 修改密码弹窗 -->
    <el-dialog v-model="showPasswordDialog" title="修改密码" width="450px" class="modern-dialog">
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="100px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入原密码" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请确认新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button type="primary" :loading="passwordLoading" @click="handleUpdatePassword">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import { Camera } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { updatePassword, updateUser, getUserInfo, updateAvatar } from '@/api/user'
import { getMyCredits } from '@/api/credit'
import type { UserInfo } from '@/api/user'

const userStore = useUserStore()
const formRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()
const avatarInput = ref<HTMLInputElement>()

const isEditing = ref(false)
const saving = ref(false)
const showPasswordDialog = ref(false)
const passwordLoading = ref(false)
const avatarUploading = ref(false)

const userInfo = ref<UserInfo>({} as UserInfo)

const creditStats = reactive({
  total: 0,
  comprehensive: 0,
  secondClassroom: 0,
  volunteer: 0,
  sportsCulture: 0
})

const editForm = reactive({
  username: '',
  realName: '',
  nickname: '',
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

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const formRules: FormRules = {
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { max: 50, message: '真实姓名长度不能超过50个字符', trigger: 'blur' }
  ],
  nickname: [{ max: 50, message: '昵称长度不能超过50个字符', trigger: 'blur' }],
  email: [
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  studentId: [{ max: 20, message: '学号长度不能超过20个字符', trigger: 'blur' }],
  className: [{ max: 50, message: '班级名称长度不能超过50个字符', trigger: 'blur' }],
  qq: [{ max: 20, message: 'QQ长度不能超过20个字符', trigger: 'blur' }],
  address: [{ max: 200, message: '地址长度不能超过200个字符', trigger: 'blur' }],
  bio: [{ max: 500, message: '自我介绍长度不能超过500个字符', trigger: 'blur' }],
  enrollmentYear: [{ max: 10, message: '入学年份长度不能超过10个字符', trigger: 'blur' }]
}

const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const getRoleName = (role: string) => {
  const map: Record<string, string> = {
    ADMIN: '超级管理员',
    PRESIDENT: '学生会主席',
    VICE_PRESIDENT: '副主席',
    MINISTER: '部长',
    MEMBER: '成员'
  }
  return map[role] || role
}

const getAvatarUrl = (avatar?: string) => {
  if (!avatar) return ''
  if (avatar.startsWith('http')) return avatar
  return `http://localhost:3000${avatar}`
}

const triggerAvatarUpload = () => {
  avatarInput.value?.click()
}

const handleAvatarChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过5MB')
    return
  }

  avatarUploading.value = true
  try {
    const res = await updateAvatar(file)
    userInfo.value.avatar = res.data?.url
    await updateUser(userInfo.value.id, { avatar: res.data?.url })
    await userStore.getUserInfoAction()
    ElMessage.success('头像更新成功')
  } catch (error) {
    console.error(error)
    ElMessage.error('头像上传失败')
  } finally {
    avatarUploading.value = false
    target.value = ''
  }
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

import { useRouter } from 'vue-router'

const router = useRouter()

const loadUserInfo = async () => {
  try {
    const res = await getUserInfo()
    userInfo.value = res.data
    
    // 填充编辑表单
    Object.assign(editForm, {
      username: res.data.username,
      realName: res.data.realName || '',
      nickname: res.data.nickname || '',
      email: res.data.email || '',
      phone: res.data.phone || '',
      studentId: res.data.studentId || '',
      className: res.data.className || '',
      politicalStatus: res.data.politicalStatus || '',
      qq: res.data.qq || '',
      address: res.data.address || '',
      bio: res.data.bio || '',
      enrollmentYear: res.data.enrollmentYear || ''
    })
  } catch (error: any) {
    console.error('Failed to load user info:', error)
    if (error.response?.status === 404) {
      ElMessage.error('登录已过期，请重新登录')
      userStore.logoutAction()
      router.push('/login')
    }
  }
}

const loadCreditStats = async () => {
  try {
    const res = await getMyCredits()
    creditStats.total = res.data?.totalCredits || 0
    const stats = res.data?.stats || []
    stats.forEach((s: any) => {
      if (s.type === 'COMPREHENSIVE') creditStats.comprehensive = s.value
      else if (s.type === 'SECOND_CLASSROOM') creditStats.secondClassroom = s.value
      else if (s.type === 'VOLUNTEER') creditStats.volunteer = s.value
      else if (s.type === 'SPORTS_CULTURE') creditStats.sportsCulture = s.value
    })
  } catch (error) {
    console.error('Failed to load credit stats:', error)
  }
}

const handleSave = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      saving.value = true
      try {
        const updateData = {
          realName: editForm.realName,
          nickname: editForm.nickname,
          email: editForm.email,
          phone: editForm.phone,
          studentId: editForm.studentId,
          className: editForm.className,
          politicalStatus: editForm.politicalStatus,
          qq: editForm.qq,
          address: editForm.address,
          bio: editForm.bio,
          enrollmentYear: editForm.enrollmentYear
        }
        
        await updateUser(userInfo.value.id, updateData)
        ElMessage.success('保存成功')
        isEditing.value = false
        await loadUserInfo()
        await userStore.getUserInfoAction()
      } catch (error) {
        console.error(error)
      } finally {
        saving.value = false
      }
    }
  })
}

const handleUpdatePassword = async () => {
  if (!passwordFormRef.value) return
  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      passwordLoading.value = true
      try {
        await updatePassword({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        })
        ElMessage.success('密码修改成功')
        showPasswordDialog.value = false
        passwordFormRef.value?.resetFields()
      } catch (error) {
        console.error(error)
      } finally {
        passwordLoading.value = false
      }
    }
  })
}

onMounted(() => {
  loadUserInfo()
  loadCreditStats()
})
</script>

<style scoped lang="scss">
.profile-container {
  padding: 0;
}

.profile-header {
  position: relative;
  margin-bottom: 24px;
  
  .profile-cover {
    height: 180px;
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  }
  
  .profile-info {
    margin: -60px 24px 0;
    padding: 24px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    position: relative;
    z-index: 1;
    
    .avatar-section {
      display: flex;
      align-items: flex-end;
      gap: 20px;
      
      .avatar-wrapper {
        position: relative;
        cursor: pointer;
        
        &:hover .avatar-overlay {
          opacity: 1;
        }
      }
      
      .profile-avatar {
        border: 4px solid var(--bg-glass);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        font-size: 40px;
      }
      
      .avatar-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
        color: white;
        
        .el-icon {
          font-size: 24px;
          margin-bottom: 4px;
        }
        
        span {
          font-size: 12px;
        }
      }
      
      .user-basic {
        padding-bottom: 8px;
        
        h2 {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        
        .username {
          font-size: 14px;
          color: var(--text-muted);
          margin-bottom: 8px;
        }
        
        .user-tags {
          display: flex;
          gap: 8px;
        }
      }
    }
  }
}

.profile-content {
  padding: 0 24px 24px;
}

.info-card {
  padding: 24px;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
    h3 {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .edit-hint {
      font-size: 12px;
      color: var(--text-muted);
    }
  }
}

.profile-form {
  :deep(.el-form-item__label) {
    color: var(--text-secondary);
  }
  
  :deep(.el-input.is-disabled .el-input__wrapper) {
    background: rgba(255, 255, 255, 0.05);
  }
  
  :deep(.el-input.is-disabled .el-input__inner) {
    color: var(--text-muted);
  }
}

.side-card {
  padding: 20px;
  margin-bottom: 20px;
  
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 16px;
  }
  
  .security-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.08);
    }
    
    .security-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .el-icon {
        font-size: 20px;
        color: white;
      }
    }
    
    .security-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      
      .label {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary);
      }
      
      .desc {
        font-size: 12px;
        color: var(--text-muted);
      }
    }
    
    .arrow {
      color: var(--text-muted);
    }
  }
}

.stats-card {
  .stat-item {
    display: flex;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    
    &:last-child {
      border-bottom: none;
    }
    
    .stat-label {
      font-size: 14px;
      color: var(--text-secondary);
    }
    
    .stat-value {
      font-size: 14px;
      color: var(--text-primary);
    }
  }
}

.credit-summary {
  .credit-total {
    text-align: center;
    padding: 20px 0;
    margin-bottom: 16px;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
    border-radius: var(--radius-md);

    .total-value {
      display: block;
      font-size: 36px;
      font-weight: 700;
      color: var(--primary-color);
      line-height: 1.2;
    }

    .total-label {
      font-size: 14px;
      color: var(--text-secondary);
    }
  }

  .credit-breakdown {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;

    .breakdown-item {
      display: flex;
      align-items: center;
      gap: 10px;

      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;

        &.comprehensive { background: #667eea; }
        &.classroom { background: #43e97b; }
        &.volunteer { background: #f59e0b; }
        &.sports { background: #4facfe; }
      }

      .type {
        flex: 1;
        font-size: 14px;
        color: var(--text-secondary);
      }

      .value {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
      }
    }
  }
}
</style>
