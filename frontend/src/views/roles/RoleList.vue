<template>
  <div class="page-wrapper">
    <div class="page-header">
      <div class="header-info">
        <h1>角色管理</h1>
        <p>管理系统角色和权限配置</p>
      </div>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        新增角色
      </el-button>
    </div>

    <div class="roles-grid" v-loading="loading">
      <div class="role-card glass-card" v-for="role in roleList" :key="role.id">
        <div class="role-header">
          <div class="role-icon" :style="{ background: role.gradient }">
            <el-icon><component :is="role.icon" /></el-icon>
          </div>
          <div class="role-title">
            <h3>{{ role.name }}</h3>
            <span class="role-code">{{ role.code }}</span>
          </div>
        </div>
        <p class="role-desc">{{ role.description }}</p>
        <div class="role-stats">
          <div class="stat">
            <span class="stat-value">{{ role.userCount || 0 }}</span>
            <span class="stat-label">用户数</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ getPermissionCount(role) }}</span>
            <span class="stat-label">权限数</span>
          </div>
        </div>
        <div class="role-actions">
          <el-button type="primary" text size="small" @click="handleViewUsers(role)">
            <el-icon><View /></el-icon>
            查看成员
          </el-button>
          <el-button type="warning" text size="small" @click="handleEditPermissions(role)">
            <el-icon><Setting /></el-icon>
            权限设置
          </el-button>
        </div>
      </div>
    </div>

    <el-dialog v-model="usersDialogVisible" :title="currentRole?.name + ' - 成员列表'" width="600px" class="modern-dialog">
      <el-table :data="roleUsers" v-loading="usersLoading" style="width: 100%">
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="phone" label="电话" />
        <el-table-column label="部门">
          <template #default="{ row }">
            {{ row.department?.name || '-' }}
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="roleUsers.length === 0 && !usersLoading" description="暂无成员" />
    </el-dialog>

    <el-dialog v-model="createDialogVisible" title="新增角色" width="500px" class="modern-dialog">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色代码" prop="code">
          <el-input v-model="formData.code" placeholder="请输入角色代码，如：ADMIN" />
        </el-form-item>
        <el-form-item label="角色描述" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="2" placeholder="请输入角色描述" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-select v-model="formData.icon" placeholder="选择图标" style="width: 100%">
            <el-option v-for="icon in iconOptions" :key="icon.value" :label="icon.label" :value="icon.value">
              <el-icon style="margin-right: 8px;"><component :is="icon.value" /></el-icon>
              {{ icon.label }}
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="渐变色" prop="gradient">
          <el-select v-model="formData.gradient" placeholder="选择渐变色" style="width: 100%">
            <el-option v-for="color in gradientOptions" :key="color.value" :label="color.label" :value="color.value">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div :style="{ width: 20, height: 20, borderRadius: 4, background: color.value }"></div>
                {{ color.label }}
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="permissionDialogVisible" :title="currentRole?.name + ' - 权限设置'" width="700px" class="modern-dialog">
      <div class="permission-header">
        <p>选择该角色可以访问的功能模块</p>
        <el-button type="primary" text size="small" @click="handleSelectAll">全选</el-button>
        <el-button text size="small" @click="handleClearAll">清空</el-button>
      </div>
      <div class="permission-groups">
        <div v-for="group in permissionGroups" :key="group.key" class="permission-group">
          <div class="group-header">
            <el-checkbox 
              v-model="group.checked" 
              :indeterminate="group.indeterminate"
              @change="handleGroupChange(group)"
            >
              <span class="group-title">{{ group.name }}</span>
            </el-checkbox>
          </div>
          <div class="group-items">
            <el-checkbox 
              v-for="item in group.items" 
              :key="item.key" 
              v-model="item.checked"
              @change="handleItemChange(group)"
            >
              {{ item.name }}
            </el-checkbox>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="permissionSubmitting" @click="handleSavePermissions">保存权限</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import { getRoles, getRoleByCode, createRole, updateRole } from '@/api/roles'
import type { Role, RoleDetail } from '@/api/roles'

const loading = ref(false)
const usersLoading = ref(false)
const roleList = ref<Role[]>([])
const usersDialogVisible = ref(false)
const createDialogVisible = ref(false)
const permissionDialogVisible = ref(false)
const currentRole = ref<Role | null>(null)
const roleUsers = ref<RoleDetail['users']>([])
const submitting = ref(false)
const permissionSubmitting = ref(false)
const formRef = ref<FormInstance>()

const permissionGroups = reactive([
  {
    key: 'dashboard',
    name: '首页',
    checked: false,
    indeterminate: false,
    items: [
      { key: 'dashboard:view', name: '查看首页', checked: false }
    ]
  },
  {
    key: 'user',
    name: '用户管理',
    checked: false,
    indeterminate: false,
    items: [
      { key: 'user:list', name: '查看用户列表', checked: false },
      { key: 'user:create', name: '创建用户', checked: false },
      { key: 'user:edit', name: '编辑用户', checked: false },
      { key: 'user:delete', name: '删除用户', checked: false }
    ]
  },
  {
    key: 'role',
    name: '角色管理',
    checked: false,
    indeterminate: false,
    items: [
      { key: 'role:list', name: '查看角色列表', checked: false },
      { key: 'role:create', name: '创建角色', checked: false },
      { key: 'role:edit', name: '编辑角色', checked: false },
      { key: 'role:permission', name: '设置权限', checked: false }
    ]
  },
  {
    key: 'organization',
    name: '组织管理',
    checked: false,
    indeterminate: false,
    items: [
      { key: 'department:list', name: '查看部门列表', checked: false },
      { key: 'department:create', name: '创建部门', checked: false },
      { key: 'department:edit', name: '编辑部门', checked: false },
      { key: 'member:list', name: '查看成员列表', checked: false },
      { key: 'member:edit', name: '编辑成员', checked: false }
    ]
  },
  {
    key: 'activity',
    name: '活动管理',
    checked: false,
    indeterminate: false,
    items: [
      { key: 'activity:list', name: '查看活动列表', checked: false },
      { key: 'activity:create', name: '创建活动', checked: false },
      { key: 'activity:edit', name: '编辑活动', checked: false },
      { key: 'activity:delete', name: '删除活动', checked: false }
    ]
  },
  {
    key: 'announcement',
    name: '公告管理',
    checked: false,
    indeterminate: false,
    items: [
      { key: 'announcement:list', name: '查看公告列表', checked: false },
      { key: 'announcement:create', name: '发布公告', checked: false },
      { key: 'announcement:delete', name: '删除公告', checked: false }
    ]
  },
  {
    key: 'registration',
    name: '报名管理',
    checked: false,
    indeterminate: false,
    items: [
      { key: 'registration:center', name: '报名中心', checked: false },
      { key: 'registration:my', name: '我的报名', checked: false },
      { key: 'registration:manage', name: '活动管理', checked: false },
      { key: 'registration:review', name: '审核报名', checked: false }
    ]
  },
  {
    key: 'credit',
    name: '学分评优',
    checked: false,
    indeterminate: false,
    items: [
      { key: 'credit:center', name: '学分中心', checked: false },
      { key: 'credit:manage', name: '学分管理', checked: false },
      { key: 'evaluation:manage', name: '评优管理', checked: false }
    ]
  },
  {
    key: 'notification',
    name: '通知管理',
    checked: false,
    indeterminate: false,
    items: [
      { key: 'notification:list', name: '查看通知列表', checked: false },
      { key: 'notification:create', name: '发布通知', checked: false },
      { key: 'notification:delete', name: '删除通知', checked: false }
    ]
  },
  {
    key: 'recruitment',
    name: '招新管理',
    checked: false,
    indeterminate: false,
    items: [
      { key: 'recruitment:list', name: '查看招新活动', checked: false },
      { key: 'recruitment:create', name: '创建招新活动', checked: false },
      { key: 'recruitment:review', name: '审核报名', checked: false }
    ]
  }
])

const formData = ref({
  name: '',
  code: '',
  description: '',
  icon: 'User',
  gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
})

const iconOptions = [
  { label: '用户', value: 'User' },
  { label: '管理员', value: 'UserFilled' },
  { label: '设置', value: 'Setting' },
  { label: '奖章', value: 'Medal' },
  { label: '奖杯', value: 'Trophy' },
  { label: '星星', value: 'Star' },
  { label: '皇冠', value: 'OfficeBuilding' },
  { label: '盾牌', value: 'Shield' },
  { label: '钥匙', value: 'Key' },
  { label: '标签', value: 'Tag' }
]

const gradientOptions = [
  { label: '紫色渐变', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { label: '粉色渐变', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { label: '蓝色渐变', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { label: '绿色渐变', value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { label: '橙色渐变', value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { label: '红色渐变', value: 'linear-gradient(135deg, #f77062 0%, #fe5196 100%)' },
  { label: '青色渐变', value: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
  { label: '金色渐变', value: 'linear-gradient(135deg, #f59e0b 0%, #eab308 100%)' }
]

const formRules: FormRules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  code: [
    { required: true, message: '请输入角色代码', trigger: 'blur' },
    { pattern: /^[A-Z_]+$/, message: '角色代码只能包含大写字母和下划线', trigger: 'blur' }
  ],
  description: [{ required: true, message: '请输入角色描述', trigger: 'blur' }],
  icon: [{ required: true, message: '请选择图标', trigger: 'change' }],
  gradient: [{ required: true, message: '请选择渐变色', trigger: 'change' }]
}

const fetchRoles = async () => {
  loading.value = true
  try {
    const res = await getRoles()
    roleList.value = res.data || []
  } catch (error) {
    console.error('Failed to fetch roles:', error)
    ElMessage.error('获取角色列表失败')
  } finally {
    loading.value = false
  }
}

const handleViewUsers = async (role: Role) => {
  currentRole.value = role
  usersDialogVisible.value = true
  usersLoading.value = true
  roleUsers.value = []
  
  try {
    const res = await getRoleByCode(role.code)
    roleUsers.value = res.data?.users || []
  } catch (error) {
    console.error('Failed to fetch role users:', error)
    ElMessage.error('获取角色成员失败')
  } finally {
    usersLoading.value = false
  }
}

const handleCreate = () => {
  formData.value = {
    name: '',
    code: '',
    description: '',
    icon: 'User',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }
  createDialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        await createRole(formData.value)
        ElMessage.success('创建角色成功')
        createDialogVisible.value = false
        fetchRoles()
      } catch (error) {
        console.error('Failed to create role:', error)
        ElMessage.error('创建角色失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

const getPermissionCount = (role: Role) => {
  if (!role.permissions) return 0
  try {
    const perms = JSON.parse(role.permissions)
    return perms.length
  } catch {
    return 0
  }
}

const handleEditPermissions = (role: Role) => {
  currentRole.value = role
  
  // 重置所有权限
  permissionGroups.forEach(group => {
    group.checked = false
    group.indeterminate = false
    group.items.forEach(item => {
      item.checked = false
    })
  })
  
  // 加载已有权限
  if (role.permissions) {
    try {
      const perms: string[] = JSON.parse(role.permissions)
      perms.forEach(perm => {
        permissionGroups.forEach(group => {
          const item = group.items.find(i => i.key === perm)
          if (item) {
            item.checked = true
          }
        })
      })
      
      // 更新分组状态
      permissionGroups.forEach(group => {
        updateGroupState(group)
      })
    } catch (e) {
      console.error('Failed to parse permissions:', e)
    }
  }
  
  permissionDialogVisible.value = true
}

const updateGroupState = (group: typeof permissionGroups[0]) => {
  const checkedCount = group.items.filter(i => i.checked).length
  group.checked = checkedCount === group.items.length
  group.indeterminate = checkedCount > 0 && checkedCount < group.items.length
}

const handleGroupChange = (group: typeof permissionGroups[0]) => {
  group.items.forEach(item => {
    item.checked = group.checked
  })
  group.indeterminate = false
}

const handleItemChange = (group: typeof permissionGroups[0]) => {
  updateGroupState(group)
}

const handleSelectAll = () => {
  permissionGroups.forEach(group => {
    group.checked = true
    group.indeterminate = false
    group.items.forEach(item => {
      item.checked = true
    })
  })
}

const handleClearAll = () => {
  permissionGroups.forEach(group => {
    group.checked = false
    group.indeterminate = false
    group.items.forEach(item => {
      item.checked = false
    })
  })
}

const handleSavePermissions = async () => {
  if (!currentRole.value) return
  
  permissionSubmitting.value = true
  try {
    const permissions: string[] = []
    permissionGroups.forEach(group => {
      group.items.forEach(item => {
        if (item.checked) {
          permissions.push(item.key)
        }
      })
    })
    
    await updateRole(currentRole.value.code, {
      permissions: JSON.stringify(permissions)
    })
    
    ElMessage.success('权限设置成功')
    permissionDialogVisible.value = false
    fetchRoles()
  } catch (error) {
    console.error('Failed to save permissions:', error)
    ElMessage.error('权限设置失败')
  } finally {
    permissionSubmitting.value = false
  }
}

onMounted(() => {
  fetchRoles()
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
}

.roles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.role-card {
  padding: 24px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
  }

  .role-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;

    .role-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;

      .el-icon {
        font-size: 24px;
        color: white;
      }
    }

    .role-title {
      h3 {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 4px;
      }

      .role-code {
        font-size: 12px;
        color: var(--text-muted);
        background: rgba(255, 255, 255, 0.1);
        padding: 2px 8px;
        border-radius: 4px;
      }
    }
  }

  .role-desc {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.6;
    margin-bottom: 20px;
  }

  .role-stats {
    display: flex;
    gap: 24px;
    padding: 16px 0;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 16px;

    .stat {
      display: flex;
      flex-direction: column;

      .stat-value {
        font-size: 24px;
        font-weight: 700;
        color: var(--text-primary);
      }

      .stat-label {
        font-size: 12px;
        color: var(--text-muted);
      }
    }
  }

  .role-actions {
    display: flex;
    gap: 12px;
  }
}
</style>