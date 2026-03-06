<template>
  <div class="page-wrapper">
    <div class="page-header">
      <div class="header-info">
        <h1>成员管理</h1>
        <p>管理学生会成员信息和部门分配</p>
      </div>
      <el-button type="primary" class="add-btn" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加成员
      </el-button>
    </div>

    <div class="filter-card glass-card">
      <div class="filter-row">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索成员姓名/昵称/学号"
          prefix-icon="Search"
          clearable
          class="search-input"
          @input="handleSearch"
        />
        <el-select v-model="selectedDepartment" placeholder="选择部门" clearable @change="handleSearch">
          <el-option label="全部部门" value="" />
          <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id" />
        </el-select>
        <el-select v-model="selectedRole" placeholder="选择角色" clearable @change="handleSearch">
          <el-option label="全部角色" value="" />
          <el-option label="超级管理员" value="ADMIN" />
          <el-option label="学生会主席" value="PRESIDENT" />
          <el-option label="副主席" value="VICE_PRESIDENT" />
          <el-option label="部长" value="MINISTER" />
          <el-option label="成员" value="MEMBER" />
        </el-select>
      </div>
    </div>

    <div class="table-card glass-card">
      <el-table :data="memberList" v-loading="loading" class="modern-table">
        <el-table-column label="成员信息" min-width="180">
          <template #default="{ row }">
            <div class="member-cell">
              <el-avatar :size="40">
                {{ (row.realName || row.username)?.charAt(0)?.toUpperCase() }}
              </el-avatar>
              <div class="member-info">
                <span class="name">{{ row.realName || row.username }}</span>
                <span class="username">@{{ row.username }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="studentId" label="学号" width="120" />
        <el-table-column prop="className" label="班级" width="120" />
        <el-table-column label="部门" width="120">
          <template #default="{ row }">
            <el-tag effect="dark" size="small">
              {{ row.department?.name || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.role)" size="small">
              {{ getRoleName(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="qq" label="QQ" width="120" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <div class="status-badge" :class="row.status === 'ACTIVE' ? 'active' : 'inactive'">
              <span class="status-dot"></span>
              {{ row.status === 'ACTIVE' ? '正常' : '禁用' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="220">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" text size="small" @click="handleView(row)">查看</el-button>
              <el-button type="primary" text size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button type="danger" text size="small" @click="handleDelete(row)" :disabled="row.role === 'ADMIN'">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="fetchMembers"
          @size-change="fetchMembers"
        />
      </div>
    </div>

    <!-- 添加/编辑成员弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="650px" class="modern-dialog">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="90px" class="modern-form">
        <el-divider content-position="left">基本信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="formData.username" placeholder="登录账号，不可更改" :disabled="!!formData.id" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="昵称" prop="nickname">
              <el-input v-model="formData.nickname" placeholder="显示名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="密码" prop="password" v-if="!formData.id">
              <el-input v-model="formData.password" type="password" placeholder="请输入密码" show-password />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部门" prop="departmentId">
              <el-select v-model="formData.departmentId" style="width: 100%" placeholder="请选择部门">
                <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="角色" prop="role">
              <el-select v-model="formData.role" style="width: 100%" placeholder="请选择角色">
                <el-option label="超级管理员" value="ADMIN" />
                <el-option label="学生会主席" value="PRESIDENT" />
                <el-option label="副主席" value="VICE_PRESIDENT" />
                <el-option label="部长" value="MINISTER" />
                <el-option label="成员" value="MEMBER" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学号" prop="studentId">
              <el-input v-model="formData.studentId" placeholder="请输入学号" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-divider content-position="left">联系信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="formData.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="formData.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="QQ" prop="qq">
              <el-input v-model="formData.qq" placeholder="请输入QQ号码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="班级" prop="className">
              <el-input v-model="formData.className" placeholder="请输入班级" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-divider content-position="left">其他信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="政治面貌" prop="politicalStatus">
              <el-select v-model="formData.politicalStatus" style="width: 100%" placeholder="请选择">
                <el-option label="群众" value="群众" />
                <el-option label="共青团员" value="共青团员" />
                <el-option label="中共党员" value="中共党员" />
                <el-option label="预备党员" value="预备党员" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入学年份" prop="enrollmentYear">
              <el-input v-model="formData.enrollmentYear" placeholder="如：2025年9月" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="住址" prop="address">
          <el-input v-model="formData.address" placeholder="请输入住址" />
        </el-form-item>
        <el-form-item label="自我介绍" prop="bio">
          <el-input v-model="formData.bio" type="textarea" :rows="3" placeholder="请输入自我介绍" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 查看成员详情弹窗 -->
    <el-dialog v-model="viewDialogVisible" title="成员详情" width="600px" class="modern-dialog member-detail-dialog">
      <div class="member-detail" v-if="currentMember">
        <div class="detail-header">
          <div class="avatar-wrapper">
            <el-avatar :size="90" class="detail-avatar">
              {{ (currentMember.nickname || currentMember.username)?.charAt(0)?.toUpperCase() }}
            </el-avatar>
            <div class="status-indicator" :class="currentMember.status === 'ACTIVE' ? 'active' : 'inactive'"></div>
          </div>
          <div class="detail-basic">
            <h3>{{ currentMember.nickname || currentMember.username }}</h3>
            <p class="detail-username">@{{ currentMember.username }}</p>
            <div class="detail-tags">
              <span class="role-badge" :class="currentMember.role">{{ getRoleName(currentMember.role) }}</span>
              <span v-if="currentMember.department?.name" class="dept-badge">{{ currentMember.department.name }}</span>
            </div>
          </div>
        </div>
        
        <div class="detail-body">
          <div class="info-section">
            <div class="section-title">
              <el-icon><User /></el-icon>
              <span>基本信息</span>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">学号</span>
                <span class="info-value">{{ currentMember.studentId || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">班级</span>
                <span class="info-value">{{ currentMember.className || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">政治面貌</span>
                <span class="info-value">{{ currentMember.politicalStatus || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">入学年份</span>
                <span class="info-value">{{ currentMember.enrollmentYear || '-' }}</span>
              </div>
            </div>
          </div>
          
          <div class="info-section">
            <div class="section-title">
              <el-icon><Phone /></el-icon>
              <span>联系方式</span>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">手机号</span>
                <span class="info-value">{{ currentMember.phone || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">QQ</span>
                <span class="info-value">{{ currentMember.qq || '-' }}</span>
              </div>
              <div class="info-item full-width">
                <span class="info-label">邮箱</span>
                <span class="info-value">{{ currentMember.email || '-' }}</span>
              </div>
              <div class="info-item full-width">
                <span class="info-label">住址</span>
                <span class="info-value">{{ currentMember.address || '-' }}</span>
              </div>
            </div>
          </div>
          
          <div class="info-section" v-if="currentMember.bio">
            <div class="section-title">
              <el-icon><Document /></el-icon>
              <span>自我介绍</span>
            </div>
            <div class="bio-content">
              <p>{{ currentMember.bio }}</p>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { getUserList, createUser, updateUser, deleteUser } from '@/api/user'
import { getDepartments } from '@/api/departments'
import type { UserInfo } from '@/api/user'

interface Member extends UserInfo {
  departmentId?: string | null
}

const loading = ref(false)
const submitting = ref(false)
const searchKeyword = ref('')
const selectedDepartment = ref('')
const selectedRole = ref('')
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const dialogTitle = ref('添加成员')
const formRef = ref<FormInstance>()
const currentMember = ref<Member | null>(null)

const departments = ref<{ id: string; name: string }[]>([])
const memberList = ref<Member[]>([])

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const formData = reactive({
  id: '',
  username: '',
  nickname: '',
  password: '',
  departmentId: '',
  role: 'MEMBER',
  phone: '',
  email: '',
  studentId: '',
  className: '',
  politicalStatus: '',
  qq: '',
  address: '',
  bio: '',
  enrollmentYear: ''
})

const formRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  email: [{ type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }]
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

const getRoleType = (role: string) => {
  const map: Record<string, string> = {
    ADMIN: 'danger',
    PRESIDENT: 'warning',
    VICE_PRESIDENT: 'warning',
    MINISTER: 'primary',
    MEMBER: ''
  }
  return map[role] || ''
}

const fetchDepartments = async () => {
  try {
    const res = await getDepartments()
    departments.value = (res.data || []).map((d: any) => ({ id: d.id, name: d.name }))
  } catch (error) {
    console.error('Failed to fetch departments:', error)
  }
}

const fetchMembers = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (selectedDepartment.value) params.departmentId = selectedDepartment.value
    if (selectedRole.value) params.role = selectedRole.value

    const res = await getUserList(params)
    memberList.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    console.error('Failed to fetch members:', error)
    ElMessage.error('获取成员列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchMembers()
}

const handleAdd = () => {
  dialogTitle.value = '添加成员'
  Object.assign(formData, {
    id: '',
    username: '',
    nickname: '',
    password: '',
    departmentId: '',
    role: 'MEMBER',
    phone: '',
    email: '',
    studentId: '',
    className: '',
    politicalStatus: '',
    qq: '',
    address: '',
    bio: '',
    enrollmentYear: ''
  })
  dialogVisible.value = true
}

const handleEdit = (row: Member) => {
  dialogTitle.value = '编辑成员'
  Object.assign(formData, {
    id: row.id,
    username: row.username,
    nickname: row.nickname || '',
    password: '',
    departmentId: row.departmentId || '',
    role: row.role,
    phone: row.phone || '',
    email: row.email || '',
    studentId: row.studentId || '',
    className: row.className || '',
    politicalStatus: row.politicalStatus || '',
    qq: row.qq || '',
    address: row.address || '',
    bio: row.bio || '',
    enrollmentYear: row.enrollmentYear || ''
  })
  dialogVisible.value = true
}

const handleView = (row: Member) => {
  currentMember.value = row
  viewDialogVisible.value = true
}

const handleDelete = (row: Member) => {
  ElMessageBox.confirm(`确定要删除成员 "${row.nickname || row.username}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteUser(row.id)
      ElMessage.success('删除成功')
      fetchMembers()
    } catch (error) {
      console.error(error)
    }
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (formData.id) {
          await updateUser(formData.id, {
            nickname: formData.nickname,
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
            departmentId: formData.departmentId || null,
            studentId: formData.studentId,
            className: formData.className,
            politicalStatus: formData.politicalStatus,
            qq: formData.qq,
            address: formData.address,
            bio: formData.bio,
            enrollmentYear: formData.enrollmentYear
          })
          ElMessage.success('修改成功')
        } else {
          await createUser({
            username: formData.username,
            password: formData.password,
            nickname: formData.nickname,
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
            departmentId: formData.departmentId || null,
            studentId: formData.studentId,
            className: formData.className,
            politicalStatus: formData.politicalStatus,
            qq: formData.qq,
            address: formData.address,
            bio: formData.bio,
            enrollmentYear: formData.enrollmentYear
          })
          ElMessage.success('添加成功')
        }
        dialogVisible.value = false
        fetchMembers()
      } catch (error) {
        console.error(error)
      } finally {
        submitting.value = false
      }
    }
  })
}

onMounted(() => {
  fetchDepartments()
  fetchMembers()
})
</script>

<style scoped lang="scss">
.page-wrapper {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  .header-info {
    h1 {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 6px;
    }

    p {
      font-size: 14px;
      color: var(--text-secondary);
    }
  }

  .add-btn {
    display: flex;
    align-items: center;
    gap: 6px;
  }
}

.filter-card {
  padding: 20px;
  margin-bottom: 20px;

  .filter-row {
    display: flex;
    gap: 16px;

    .search-input {
      width: 280px;
    }

    .el-select {
      width: 150px;
    }
  }
}

.table-card {
  padding: 0;
  overflow: hidden;

  .member-cell {
    display: flex;
    align-items: center;
    gap: 12px;

    .member-info {
      display: flex;
      flex-direction: column;

      .name {
        font-weight: 600;
        color: var(--text-primary);
      }

      .username {
        font-size: 12px;
        color: var(--text-muted);
      }
    }
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    &.active {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;

      .status-dot {
        background: #34d399;
      }
    }

    &.inactive {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;

      .status-dot {
        background: #f87171;
      }
    }
  }

  .action-buttons {
    display: flex;
    gap: 8px;
  }
}

.pagination-wrapper {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.member-detail-dialog {
  :deep(.el-dialog) {
    background: var(--bg-glass) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    border-radius: var(--radius-xl) !important;
    backdrop-filter: blur(20px) !important;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
  }
  
  :deep(.el-dialog__header) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding: 20px 24px;
    margin-right: 0;
    
    .el-dialog__title {
      color: var(--text-primary);
      font-weight: 600;
    }
  }
  
  :deep(.el-dialog__body) {
    padding: 0;
  }
}

.member-detail {
  padding: 24px;
  
  .detail-header {
    display: flex;
    align-items: center;
    gap: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 24px;
    
    .avatar-wrapper {
      position: relative;
      
      .detail-avatar {
        font-size: 40px;
        background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%) !important;
        border: 3px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 8px 32px rgba(99, 102, 241, 0.3);
      }
      
      .status-indicator {
        position: absolute;
        bottom: 4px;
        right: 4px;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid var(--bg-glass);
        
        &.active {
          background: #34d399;
          box-shadow: 0 0 8px #34d399;
        }
        
        &.inactive {
          background: #f87171;
        }
      }
    }

    .detail-basic {
      flex: 1;
      
      h3 {
        font-size: 24px;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 6px;
      }

      .detail-username {
        font-size: 14px;
        color: var(--text-muted);
        margin-bottom: 12px;
      }

      .detail-tags {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        
        .role-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          
          &.ADMIN {
            background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
            color: white;
          }
          &.PRESIDENT, &.VICE_PRESIDENT {
            background: linear-gradient(135deg, #f59e0b 0%, #eab308 100%);
            color: white;
          }
          &.MINISTER {
            background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
            color: white;
          }
          &.MEMBER {
            background: rgba(255, 255, 255, 0.15);
            color: var(--text-primary);
          }
        }
        
        .dept-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
        }
      }
    }
  }
  
  .detail-body {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .info-section {
    background: rgba(255, 255, 255, 0.05);
    border-radius: var(--radius-lg);
    padding: 20px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    
    .section-title {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
      color: var(--text-primary);
      font-weight: 600;
      font-size: 15px;
      
      .el-icon {
        font-size: 18px;
        color: var(--primary-light);
      }
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      
      .info-item {
        display: flex;
        flex-direction: column;
        gap: 6px;
        
        &.full-width {
          grid-column: span 2;
        }
        
        .info-label {
          font-size: 12px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .info-value {
          font-size: 14px;
          color: var(--text-primary);
          font-weight: 500;
          word-break: break-all;
        }
      }
    }
    
    .bio-content {
      background: rgba(255, 255, 255, 0.03);
      border-radius: var(--radius-md);
      padding: 16px;
      border-left: 3px solid var(--primary-color);
      
      p {
        font-size: 14px;
        color: var(--text-secondary);
        line-height: 1.8;
        margin: 0;
      }
    }
  }
}
</style>
