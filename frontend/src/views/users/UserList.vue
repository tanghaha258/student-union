<template>
  <div class="page-wrapper">
    <div class="page-header">
      <div class="header-info">
        <h1>用户管理</h1>
        <p>管理系统用户账号和权限分配</p>
      </div>
      <el-button type="primary" class="add-btn" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加用户
      </el-button>
    </div>

    <div class="filter-card glass-card">
      <div class="filter-row">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索用户名/邮箱"
          prefix-icon="Search"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
          class="search-input"
        />
        <el-select v-model="filterRole" placeholder="角色筛选" clearable @change="handleSearch">
          <el-option label="全部角色" value="" />
          <el-option label="超级管理员" value="ADMIN" />
          <el-option label="学生会主席" value="PRESIDENT" />
          <el-option label="副主席" value="VICE_PRESIDENT" />
          <el-option label="部长" value="MINISTER" />
          <el-option label="成员" value="MEMBER" />
        </el-select>
        <el-select v-model="filterDepartment" placeholder="部门筛选" clearable @change="handleSearch">
          <el-option label="全部部门" value="" />
          <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id" />
        </el-select>
      </div>
    </div>

    <div class="table-card glass-card">
      <el-table :data="userList" v-loading="loading" class="modern-table" :cell-style="{ padding: '8px 0' }" style="width: 100%">
        <el-table-column label="用户信息" min-width="220">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="36" :src="row.avatar">
                {{ (row.realName || row.username)?.charAt(0)?.toUpperCase() }}
              </el-avatar>
              <div class="user-info">
                <span class="username">{{ row.realName || row.username }}</span>
                <span class="email">{{ row.username }} · {{ row.email }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.role)" effect="dark" size="small">
              {{ getRoleName(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="部门" width="100">
          <template #default="{ row }">
            <span class="dept-name">{{ row.department?.name || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <div class="status-badge" :class="row.status === 'ACTIVE' ? 'active' : 'inactive'">
              <span class="status-dot"></span>
              {{ row.status === 'ACTIVE' ? '正常' : '禁用' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160" />
        <el-table-column label="操作" fixed="right" width="240">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" text size="small" @click="handleEdit(row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button 
                :type="row.status === 'ACTIVE' ? 'warning' : 'success'" 
                text 
                size="small" 
                @click="handleToggleStatus(row)"
              >
                <el-icon><component :is="row.status === 'ACTIVE' ? 'CircleClose' : 'CircleCheck'" /></el-icon>
                {{ row.status === 'ACTIVE' ? '禁用' : '启用' }}
              </el-button>
              <el-button type="danger" text size="small" @click="handleDelete(row)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
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
          @size-change="fetchUserList"
          @current-change="fetchUserList"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px" class="modern-dialog">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px" class="modern-form">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" :disabled="isEdit" placeholder="请输入用户名（登录账号）" />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="formData.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input v-model="formData.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="formData.role" style="width: 100%">
            <el-option label="超级管理员" value="ADMIN" />
            <el-option label="学生会主席" value="PRESIDENT" />
            <el-option label="副主席" value="VICE_PRESIDENT" />
            <el-option label="部长" value="MINISTER" />
            <el-option label="成员" value="MEMBER" />
          </el-select>
        </el-form-item>
        <el-form-item label="部门" prop="departmentId">
          <el-select v-model="formData.departmentId" style="width: 100%" clearable>
            <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { getUserList, createUser, updateUser, deleteUser, updateUserStatus } from '@/api/user'
import { getDepartments } from '@/api/departments'

const loading = ref(false)
const searchKeyword = ref('')
const filterRole = ref('')
const filterDepartment = ref('')
const dialogVisible = ref(false)
const dialogTitle = ref('添加用户')
const isEdit = ref(false)
const formRef = ref<FormInstance>()

const departments = ref<any[]>([])

const userList = ref<any[]>([])

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const formData = reactive({
  id: '',
  username: '',
  realName: '',
  password: '',
  email: '',
  phone: '',
  role: 'MEMBER',
  departmentId: ''
})

const formRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

const getRoleType = (role: string) => {
  const map: Record<string, string> = {
    ADMIN: 'danger',
    PRESIDENT: 'warning',
    VICE_PRESIDENT: 'warning',
    MINISTER: 'success',
    MEMBER: ''
  }
  return map[role] || ''
}

const getRoleName = (role: string) => {
  const map: Record<string, string> = {
    ADMIN: '超管',
    PRESIDENT: '主席',
    VICE_PRESIDENT: '副主席',
    MINISTER: '部长',
    MEMBER: '成员'
  }
  return map[role] || role
}

const handleSearch = () => {
  pagination.page = 1
  fetchUserList()
}

const handleAdd = () => {
  dialogTitle.value = '添加用户'
  isEdit.value = false
  Object.assign(formData, { id: '', username: '', realName: '', password: '', email: '', phone: '', role: 'MEMBER', departmentId: '' })
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  dialogTitle.value = '编辑用户'
  isEdit.value = true
  Object.assign(formData, { ...row, departmentId: row.department?.id || '', password: '' })
  dialogVisible.value = true
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确定要删除用户 "${row.username}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteUser(row.id)
      ElMessage.success('删除成功')
      fetchUserList()
    } catch (error) {
      console.error(error)
    }
  })
}

const handleToggleStatus = async (row: any) => {
  const newStatus = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
  const actionText = newStatus === 'ACTIVE' ? '启用' : '禁用'
  
  try {
    await updateUserStatus(row.id, newStatus)
    ElMessage.success(`${actionText}成功`)
    fetchUserList()
  } catch (error) {
    console.error(error)
    ElMessage.error(`${actionText}失败`)
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await updateUser(formData.id, formData)
          ElMessage.success('修改成功')
        } else {
          await createUser(formData)
          ElMessage.success('添加成功')
        }
        dialogVisible.value = false
        fetchUserList()
      } catch (error) {
        console.error(error)
      }
    }
  })
}

const fetchUserList = async () => {
  loading.value = true
  try {
    const res = await getUserList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchKeyword.value,
      role: filterRole.value,
      departmentId: filterDepartment.value
    })
    userList.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    console.error(error)
    userList.value = [
      { id: '1', username: 'admin', email: 'admin@example.com', phone: '13800138000', role: 'ADMIN', department: null, status: 'ACTIVE', createdAt: '2024-01-01' },
      { id: '2', username: 'zhangsan', email: 'zhangsan@example.com', phone: '13800138001', role: 'MINISTER', department: { id: '1', name: '组织部' }, status: 'ACTIVE', createdAt: '2024-01-02' }
    ]
    pagination.total = 2
  } finally {
    loading.value = false
  }
}

const fetchDepartments = async () => {
  try {
    const res = await getDepartments()
    departments.value = res.data || []
  } catch (error) {
    departments.value = [
      { id: '1', name: '主席团' },
      { id: '2', name: '组织部' },
      { id: '3', name: '宣传部' }
    ]
  }
}

onMounted(() => {
  fetchUserList()
  fetchDepartments()
})
</script>

<style scoped lang="scss">
.page-wrapper {
  padding: 0 20px 0 0;
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
    flex-wrap: wrap;

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

  .modern-table {
    padding: 0;
  }

  .user-cell {
    display: flex;
    align-items: center;
    gap: 12px;

    .user-info {
      display: flex;
      flex-direction: column;

      .username {
        font-weight: 600;
        color: var(--text-primary);
        font-size: 14px;
      }

      .email {
        font-size: 12px;
        color: var(--text-muted);
      }
    }
  }

  .dept-name {
    color: var(--text-secondary);
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 500;

    .status-dot {
      width: 5px;
      height: 5px;
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
    gap: 4px;
  }
}

.pagination-wrapper {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.modern-dialog {
  .modern-form {
    padding: 10px 0;
  }
}
</style>
