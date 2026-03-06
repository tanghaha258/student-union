<template>
  <div class="page-wrapper">
    <div class="page-header">
      <div class="header-info">
        <h1>部门管理</h1>
        <p>管理学生会组织架构和部门信息</p>
      </div>
      <el-button type="primary" class="add-btn" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加部门
      </el-button>
    </div>

    <div class="departments-grid" v-loading="loading">
      <div class="dept-card glass-card" v-for="dept in departmentList" :key="dept.id">
        <div class="dept-header">
          <div class="dept-avatar">
            {{ dept.name.charAt(0) }}
          </div>
          <div class="dept-info">
            <h3>{{ dept.name }}</h3>
            <span class="member-count">{{ dept.memberCount || 0 }} 名成员</span>
          </div>
        </div>
        <p class="dept-desc">{{ dept.description || '暂无描述' }}</p>
        <div class="dept-actions">
          <el-button type="primary" text size="small" @click="handleViewMembers(dept)">
            <el-icon><View /></el-icon>
            查看成员
          </el-button>
          <el-button type="primary" text size="small" @click="handleEdit(dept)">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button type="danger" text size="small" @click="handleDelete(dept)">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </div>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" class="modern-dialog">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px" class="modern-form">
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入部门描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="membersDialogVisible" :title="currentDept?.name + ' - 成员列表'" width="600px" class="modern-dialog">
      <el-table :data="deptMembers" v-loading="membersLoading" style="width: 100%">
        <el-table-column prop="username" label="用户名" />
        <el-table-column label="角色">
          <template #default="{ row }">
            {{ getRoleName(row.role) }}
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="phone" label="电话" />
      </el-table>
      <el-empty v-if="deptMembers.length === 0 && !membersLoading" description="暂无成员" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { getDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment } from '@/api/departments'

interface Department {
  id: string
  name: string
  description: string | null
  memberCount: number
}

interface DepartmentMember {
  id: string
  username: string
  email: string | null
  phone: string | null
  role: string
}

const dialogVisible = ref(false)
const dialogTitle = ref('添加部门')
const formRef = ref<FormInstance>()
const loading = ref(false)
const submitting = ref(false)
const membersDialogVisible = ref(false)
const membersLoading = ref(false)
const currentDept = ref<Department | null>(null)
const deptMembers = ref<DepartmentMember[]>([])

const departmentList = ref<Department[]>([])

const formData = reactive({
  id: '',
  name: '',
  description: ''
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }]
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

const handleAdd = () => {
  dialogTitle.value = '添加部门'
  Object.assign(formData, { id: '', name: '', description: '' })
  dialogVisible.value = true
}

const handleEdit = (row: Department) => {
  dialogTitle.value = '编辑部门'
  Object.assign(formData, row)
  dialogVisible.value = true
}

const handleViewMembers = async (dept: Department) => {
  currentDept.value = dept
  membersDialogVisible.value = true
  membersLoading.value = true
  deptMembers.value = []
  
  try {
    const res = await getDepartmentById(dept.id)
    deptMembers.value = res.data?.members || []
  } catch (error) {
    console.error('Failed to fetch department members:', error)
    ElMessage.error('获取部门成员失败')
  } finally {
    membersLoading.value = false
  }
}

const handleDelete = (row: Department) => {
  ElMessageBox.confirm(`确定要删除部门 "${row.name}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteDepartment(row.id)
      ElMessage.success('删除成功')
      fetchDepartments()
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
          await updateDepartment(formData.id, formData)
          ElMessage.success('修改成功')
        } else {
          await createDepartment(formData)
          ElMessage.success('添加成功')
        }
        dialogVisible.value = false
        fetchDepartments()
      } catch (error) {
        console.error(error)
      } finally {
        submitting.value = false
      }
    }
  })
}

const fetchDepartments = async () => {
  loading.value = true
  try {
    const res = await getDepartments()
    departmentList.value = res.data || []
  } catch (error) {
    console.error(error)
    ElMessage.error('获取部门列表失败')
    departmentList.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDepartments()
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

.departments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.dept-card {
  padding: 24px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
  }

  .dept-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;

    .dept-avatar {
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: 700;
      color: white;
    }

    .dept-info {
      h3 {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 4px;
      }

      .member-count {
        font-size: 13px;
        color: var(--text-muted);
      }
    }
  }

  .dept-desc {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.6;
    margin-bottom: 16px;
  }

  .dept-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
}
</style>
