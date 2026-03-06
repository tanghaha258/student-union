<template>
  <div class="page-wrapper">
    <div class="page-header">
      <div class="header-info">
        <h1>成员展示</h1>
        <p>查看学生会成员信息，互相认识交流</p>
      </div>
    </div>

    <div class="filter-card glass-card">
      <div class="filter-row">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索姓名、学号、班级"
          prefix-icon="Search"
          clearable
          class="search-input"
          @input="handleSearch"
        />
        <el-select v-model="selectedDepartment" placeholder="选择部门" clearable @change="handleSearch">
          <el-option label="全部部门" value="" />
          <el-option v-for="dept in departmentList" :key="dept.id" :label="dept.name" :value="dept.id" />
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

    <div class="members-grid" v-loading="loading">
      <div class="member-card glass-card" v-for="member in filteredMembers" :key="member.id" @click="handleViewDetail(member)">
        <div class="member-avatar">
          <el-avatar :size="80" :src="member.avatar">
            {{ member.realName?.charAt(0) || member.username?.charAt(0) }}
          </el-avatar>
          <div class="member-role" :class="member.role">
            {{ getRoleName(member.role) }}
          </div>
        </div>
        <div class="member-info">
          <h3 class="member-name">{{ member.realName || member.username }}</h3>
          <p class="member-nickname" v-if="member.nickname">{{ member.nickname }}</p>
          <div class="member-detail">
            <div class="detail-item">
              <el-icon><School /></el-icon>
              <span>{{ member.studentId || '暂无学号' }}</span>
            </div>
            <div class="detail-item">
              <el-icon><OfficeBuilding /></el-icon>
              <span>{{ member.department?.name || '暂无部门' }}</span>
            </div>
            <div class="detail-item">
              <el-icon><User /></el-icon>
              <span>{{ member.className || '暂无班级' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-empty v-if="filteredMembers.length === 0 && !loading" description="暂无成员数据" />

    <!-- 成员详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" :title="currentMember?.realName || currentMember?.username" width="500px" class="modern-dialog">
      <div class="member-detail-dialog" v-if="currentMember">
        <div class="detail-header">
          <el-avatar :size="100" :src="currentMember.avatar">
            {{ currentMember.realName?.charAt(0) || currentMember.username?.charAt(0) }}
          </el-avatar>
          <div class="header-info">
            <h3>{{ currentMember.realName || currentMember.username }}</h3>
            <p v-if="currentMember.nickname">{{ currentMember.nickname }}</p>
            <el-tag :type="getRoleType(currentMember.role)" size="small">
              {{ getRoleName(currentMember.role) }}
            </el-tag>
          </div>
        </div>
        <el-divider />
        <div class="detail-body">
          <div class="detail-row">
            <span class="label">学号</span>
            <span class="value">{{ currentMember.studentId || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">班级</span>
            <span class="value">{{ currentMember.className || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">部门</span>
            <span class="value">{{ currentMember.department?.name || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">邮箱</span>
            <span class="value">{{ currentMember.email || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">手机号</span>
            <span class="value">{{ currentMember.phone || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="label">个人简介</span>
            <span class="value bio">{{ currentMember.bio || '暂无简介' }}</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getUserList } from '@/api/user'
import { getDepartmentList } from '@/api/departments'

interface Member {
  id: string
  username: string
  realName?: string
  nickname?: string
  studentId?: string
  className?: string
  role: string
  avatar?: string
  email?: string
  phone?: string
  bio?: string
  department?: {
    id: string
    name: string
  }
}

const loading = ref(false)
const searchKeyword = ref('')
const selectedDepartment = ref('')
const selectedRole = ref('')
const memberList = ref<Member[]>([])
const departmentList = ref<any[]>([])
const detailDialogVisible = ref(false)
const currentMember = ref<Member | null>(null)

const filteredMembers = computed(() => {
  let result = memberList.value

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(m =>
      (m.realName && m.realName.toLowerCase().includes(keyword)) ||
      (m.username && m.username.toLowerCase().includes(keyword)) ||
      (m.studentId && m.studentId.toLowerCase().includes(keyword)) ||
      (m.className && m.className.toLowerCase().includes(keyword))
    )
  }

  if (selectedDepartment.value) {
    result = result.filter(m => m.department?.id === selectedDepartment.value)
  }

  if (selectedRole.value) {
    result = result.filter(m => m.role === selectedRole.value)
  }

  return result
})

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
    VICE_PRESIDENT: 'success',
    MINISTER: 'primary',
    MEMBER: 'info'
  }
  return map[role] || 'info'
}

const handleSearch = () => {
  // 筛选已通过 computed 处理
}

const handleViewDetail = (member: Member) => {
  currentMember.value = member
  detailDialogVisible.value = true
}

const fetchMembers = async () => {
  loading.value = true
  try {
    const res = await getUserList({ page: 1, pageSize: 1000 })
    memberList.value = res.data?.list || []
  } catch (error) {
    console.error(error)
    ElMessage.error('获取成员列表失败')
  } finally {
    loading.value = false
  }
}

const fetchDepartments = async () => {
  try {
    const res = await getDepartmentList()
    departmentList.value = res.data || []
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  fetchMembers()
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
}

.filter-card {
  padding: 16px 20px;
  margin-bottom: 24px;

  .filter-row {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;

    .search-input {
      width: 300px;
    }
  }
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.member-card {
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }

  .member-avatar {
    position: relative;
    margin-bottom: 16px;

    .el-avatar {
      font-size: 32px;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
    }

    .member-role {
      position: absolute;
      bottom: -4px;
      left: 50%;
      transform: translateX(-50%);
      padding: 2px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;

      &.ADMIN {
        background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
        color: white;
      }

      &.PRESIDENT {
        background: linear-gradient(135deg, #f59e0b 0%, #eab308 100%);
        color: white;
      }

      &.VICE_PRESIDENT {
        background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
        color: white;
      }

      &.MINISTER {
        background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
        color: white;
      }

      &.MEMBER {
        background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
        color: white;
      }
    }
  }

  .member-info {
    .member-name {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 4px;
    }

    .member-nickname {
      font-size: 13px;
      color: var(--text-muted);
      margin-bottom: 12px;
    }

    .member-detail {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .detail-item {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        font-size: 13px;
        color: var(--text-secondary);

        .el-icon {
          color: var(--text-muted);
        }
      }
    }
  }
}

.member-detail-dialog {
  .detail-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;

    .el-avatar {
      font-size: 40px;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
    }

    .header-info {
      h3 {
        font-size: 20px;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 4px;
      }

      p {
        font-size: 14px;
        color: var(--text-muted);
        margin-bottom: 8px;
      }
    }
  }

  .detail-body {
    .detail-row {
      display: flex;
      padding: 12px 0;
      border-bottom: 1px solid var(--border-color);

      &:last-child {
        border-bottom: none;
      }

      .label {
        width: 80px;
        flex-shrink: 0;
        font-size: 14px;
        color: var(--text-muted);
      }

      .value {
        flex: 1;
        font-size: 14px;
        color: var(--text-primary);

        &.bio {
          line-height: 1.6;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .filter-card {
    .filter-row {
      flex-direction: column;

      .search-input,
      .el-select {
        width: 100%;
      }
    }
  }

  .members-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }
}
</style>
