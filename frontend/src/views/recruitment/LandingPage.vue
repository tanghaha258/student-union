<template>
  <div class="recruitment-landing">
    <div class="stars-container">
      <div class="stars"></div>
      <div class="stars2"></div>
      <div class="stars3"></div>
      <div class="shooting-stars">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 未找到招新活动 -->
    <div v-else-if="notFound" class="not-found-container">
      <div class="not-found-icon">😕</div>
      <h2>暂无招新活动</h2>
      <p>当前没有开放的招新活动，请稍后再来</p>
    </div>

    <!-- 正常内容 -->
    <template v-else>
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-badge">🔥 {{ recruitment?.title || '招新进行中' }}</div>
        <h1 class="hero-title">
          <span class="gradient-text">{{ recruitment?.intro || '加入学生会' }}</span>
          <br />
          <span class="sub-title">开启你的精彩大学生活</span>
        </h1>
        <p class="hero-desc">
          在这里，你将遇见志同道合的伙伴，收获成长与蜕变
          <br />
          用热情点燃青春，用行动书写未来
        </p>
        <div class="hero-actions">
          <button class="btn-primary pulse" @click="scrollToApply">
            <span>立即报名</span>
            <el-icon><ArrowRight /></el-icon>
          </button>
          <button class="btn-secondary" @click="scrollToInfo">
            <span>了解更多</span>
          </button>
        </div>
        <div class="hero-stats">
          <div class="stat-item">
            <span class="stat-value">{{ stats.members }}+</span>
            <span class="stat-label">活跃成员</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">{{ stats.departments }}</span>
            <span class="stat-label">职能部门</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">{{ stats.activities }}+</span>
            <span class="stat-label">年度活动</span>
          </div>
        </div>
      </div>
      <div class="scroll-indicator">
        <div class="mouse">
          <div class="wheel"></div>
        </div>
        <span>向下滚动</span>
      </div>
    </section>

    <section class="departments-section" id="departments">
      <div class="section-container">
        <div class="section-header">
          <span class="section-tag">组织架构</span>
          <h2 class="section-title">选择你的舞台</h2>
          <p class="section-desc">六大部门，总有一个适合你</p>
        </div>
        <div class="departments-grid">
          <div 
            class="dept-card" 
            v-for="(dept, index) in departments" 
            :key="dept.name"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <div class="dept-icon" :style="{ background: dept.gradient }">
              <el-icon><component :is="dept.icon" /></el-icon>
            </div>
            <h3 class="dept-name">{{ dept.name }}</h3>
            <p class="dept-desc">{{ dept.description }}</p>
            <div class="dept-tags">
              <span class="tag" v-for="tag in dept.tags" :key="tag">{{ tag }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="benefits-section">
      <div class="section-container">
        <div class="section-header">
          <span class="section-tag">加入我们</span>
          <h2 class="section-title">你将收获什么</h2>
        </div>
        <div class="benefits-grid">
          <div class="benefit-card" v-for="(benefit, index) in benefits" :key="benefit.title">
            <div class="benefit-number">{{ String(index + 1).padStart(2, '0') }}</div>
            <h3 class="benefit-title">{{ benefit.title }}</h3>
            <p class="benefit-desc">{{ benefit.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="timeline-section">
      <div class="section-container">
        <div class="section-header">
          <span class="section-tag">招新流程</span>
          <h2 class="section-title">简单四步，开启旅程</h2>
        </div>
        <div class="timeline">
          <div class="timeline-item" v-for="(step, index) in timeline" :key="step.title">
            <div class="timeline-marker">
              <span class="timeline-number">{{ index + 1 }}</span>
            </div>
            <div class="timeline-content">
              <h3 class="timeline-title">{{ step.title }}</h3>
              <p class="timeline-desc">{{ step.description }}</p>
              <span class="timeline-date">{{ step.date }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="apply-section" id="apply" ref="applySection">
      <div class="section-container">
        <div class="apply-card">
          <div class="apply-header">
            <h2>在线报名</h2>
            <p>填写以下信息，开启你的学生会之旅</p>
            <div class="deadline" v-if="recruitment">
              <el-icon><Clock /></el-icon>
              <span>截止时间：{{ formatDate(recruitment.endDate) }}</span>
            </div>
          </div>
          
          <el-form 
            ref="formRef" 
            :model="formData" 
            :rules="formRules" 
            class="apply-form"
            label-position="top"
          >
            <div class="form-section">
              <h4><el-icon><User /></el-icon> 基本信息</h4>
              <div class="form-grid form-grid-2">
                <el-form-item label="姓名" prop="name">
                  <el-input v-model="formData.name" placeholder="请输入真实姓名" />
                </el-form-item>
                <el-form-item label="学号" prop="studentId">
                  <el-input v-model="formData.studentId" placeholder="请输入学号" />
                </el-form-item>
              </div>
              <div class="form-grid form-grid-2">
                <el-form-item label="班级" prop="className">
                  <el-input v-model="formData.className" placeholder="如：高一1班" />
                </el-form-item>
                <el-form-item label="手机号" prop="phone">
                  <el-input v-model="formData.phone" placeholder="请输入手机号" />
                </el-form-item>
              </div>
              <div class="form-grid form-grid-2">
                <el-form-item label="性别">
                  <el-select v-model="formData.gender" placeholder="请选择" style="width: 100%">
                    <el-option label="男" value="男" />
                    <el-option label="女" value="女" />
                  </el-select>
                </el-form-item>
                <el-form-item label="出生日期">
                  <el-input v-model="formData.birthday" placeholder="如：2006年5月" />
                </el-form-item>
              </div>
              <div class="form-grid form-grid-2">
                <el-form-item label="QQ">
                  <el-input v-model="formData.qq" placeholder="请输入QQ号" />
                </el-form-item>
                <el-form-item label="邮箱">
                  <el-input v-model="formData.email" placeholder="请输入邮箱（选填）" />
                </el-form-item>
              </div>
            </div>

            <div class="form-section">
              <h4><el-icon><OfficeBuilding /></el-icon> 志愿选择</h4>
              <div class="form-grid form-grid-2">
                <el-form-item label="第一志愿" prop="department1">
                  <el-select v-model="formData.department1" placeholder="请选择第一志愿部门" style="width: 100%">
                    <el-option v-for="dept in departments" :key="dept.name" :label="dept.name" :value="dept.name" />
                  </el-select>
                </el-form-item>
                <el-form-item label="第二志愿">
                  <el-select v-model="formData.department2" placeholder="请选择第二志愿部门（选填）" style="width: 100%">
                    <el-option v-for="dept in departments" :key="dept.name" :label="dept.name" :value="dept.name" />
                  </el-select>
                </el-form-item>
              </div>
              <el-form-item>
                <el-checkbox v-model="formData.isAdjusted">愿意服从调剂</el-checkbox>
              </el-form-item>
            </div>

            <div class="form-section">
              <h4><el-icon><EditPen /></el-icon> 个人展示</h4>
              <el-form-item label="技能特长">
                <el-input v-model="formData.skills" type="textarea" :rows="3" placeholder="请描述你的技能特长，如：文案写作、摄影剪辑、活动策划等" />
              </el-form-item>
              <el-form-item label="相关经历">
                <el-input v-model="formData.experience" type="textarea" :rows="3" placeholder="请描述你的学生工作、社会实践等相关经历（选填）" />
              </el-form-item>
              <el-form-item label="申请理由" prop="reason">
                <el-input v-model="formData.reason" type="textarea" :rows="4" placeholder="为什么想加入学生会？你对学生会的认识是什么？" />
              </el-form-item>
              <el-form-item label="期望与规划">
                <el-input v-model="formData.expectation" type="textarea" :rows="3" placeholder="加入学生会后，你有什么期望和规划？（选填）" />
              </el-form-item>
            </div>

            <el-form-item>
              <button type="button" class="submit-btn" :disabled="submitting" @click="handleSubmit">
                <span v-if="!submitting">提交报名</span>
                <span v-else>提交中...</span>
              </button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </section>

    <el-dialog 
      v-model="successVisible" 
      title="" 
      width="400px" 
      class="success-dialog"
      :close-on-click-modal="false"
      :show-close="false"
    >
      <div class="success-content">
        <div class="success-icon">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <h3>报名成功！</h3>
        <p>感谢你的报名，我们会尽快审核</p>
        <p class="application-id">报名编号：{{ applicationId }}</p>
        <p class="tip">请保存报名编号，可用于查询报名状态</p>
        <el-button type="primary" @click="successVisible = false">确定</el-button>
      </div>
    </el-dialog>

    <footer class="landing-footer">
      <div class="footer-content">
        <div class="footer-brand">
          <div class="footer-logo">学生会</div>
          <p>Student Union</p>
        </div>
        <div class="footer-links">
          <div class="link-group">
            <h4>联系我们</h4>
            <p>邮箱：studentunion@example.edu.cn</p>
            <p>地址：学生活动中心301室</p>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© 2025 学生会 · 用心服务每一位同学</p>
      </div>
    </footer>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import { getCurrentRecruitment, getRecruitmentById, submitRecruitmentApplication } from '@/api/recruitment'
import type { Recruitment } from '@/api/recruitment'

const route = useRoute()
const formRef = ref<FormInstance>()
const applySection = ref<HTMLElement>()
const recruitment = ref<Recruitment | null>(null)
const submitting = ref(false)
const successVisible = ref(false)
const applicationId = ref('')
const loading = ref(true)
const notFound = ref(false)

const stats = {
  members: 120,
  departments: 6,
  activities: 50
}

const departments = [
  { 
    name: '主席团', 
    description: '统筹协调学生会各项工作，制定发展规划',
    icon: 'Medal',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #eab308 100%)',
    tags: ['领导力', '统筹规划', '决策能力']
  },
  { 
    name: '组织部', 
    description: '负责组织建设、干部培养、考核评优',
    icon: 'UserFilled',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
    tags: ['组织协调', '人才培养', '制度建设']
  },
  { 
    name: '宣传部', 
    description: '负责宣传推广、新媒体运营、活动报道',
    icon: 'PictureFilled',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
    tags: ['新媒体', '设计', '文案']
  },
  { 
    name: '学习部', 
    description: '组织学术活动、学习交流、知识竞赛',
    icon: 'Reading',
    gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    tags: ['学术活动', '知识竞赛', '学习交流']
  },
  { 
    name: '文体部', 
    description: '策划文艺演出、体育赛事、娱乐活动',
    icon: 'Trophy',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
    tags: ['文艺活动', '体育赛事', '娱乐策划']
  },
  { 
    name: '外联部', 
    description: '负责对外联络、赞助洽谈、校际交流',
    icon: 'Connection',
    gradient: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
    tags: ['对外联络', '赞助洽谈', '校际交流']
  }
]

const benefits = [
  { title: '领导力提升', description: '参与组织策划各类活动，锻炼领导才能' },
  { title: '人脉拓展', description: '结识各学院优秀同学，拓展社交圈层' },
  { title: '技能成长', description: '学习活动策划、新媒体运营等实用技能' },
  { title: '荣誉认证', description: '优秀学生干部、先进个人等荣誉评选优先' }
]

const timeline = computed(() => {
  if (!recruitment.value) {
    return [
      { title: '在线报名', description: '填写报名表，提交个人信息', date: '即日起' },
      { title: '简历筛选', description: '各部门审核报名材料', date: '报名截止后3天内' },
      { title: '面试考核', description: '线下面试，展示你的风采', date: '另行通知' },
      { title: '录用公示', description: '公布最终录用名单', date: '面试后3天内' }
    ]
  }
  return [
    { title: '在线报名', description: '填写报名表，提交个人信息', date: '即日起' },
    { title: '简历筛选', description: '各部门审核报名材料', date: '报名截止后3天内' },
    { title: '面试考核', description: '线下面试，展示你的风采', date: '另行通知' },
    { title: '录用公示', description: '公布最终录用名单', date: '面试后3天内' }
  ]
})

const formData = reactive({
  name: '',
  studentId: '',
  className: '',
  phone: '',
  email: '',
  qq: '',
  gender: '',
  birthday: '',
  skills: '',
  experience: '',
  reason: '',
  expectation: '',
  department1: '',
  department2: '',
  isAdjusted: true
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  studentId: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  className: [{ required: true, message: '请输入班级', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  department1: [{ required: true, message: '请选择第一志愿部门', trigger: 'change' }],
  reason: [{ required: true, message: '请填写申请理由', trigger: 'blur' }]
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

const scrollToApply = () => {
  applySection.value?.scrollIntoView({ behavior: 'smooth' })
}

const scrollToInfo = () => {
  document.getElementById('departments')?.scrollIntoView({ behavior: 'smooth' })
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      if (!recruitment.value) {
        ElMessage.error('当前没有开放的招新活动')
        return
      }
      submitting.value = true
      try {
        const res = await submitRecruitmentApplication(recruitment.value.id, formData)
        applicationId.value = res.data?.id || ''
        successVisible.value = true
        formRef.value?.resetFields()
      } catch (error: any) {
        ElMessage.error(error.response?.data?.message || '报名失败，请稍后重试')
      } finally {
        submitting.value = false
      }
    }
  })
}

const fetchRecruitment = async () => {
  loading.value = true
  notFound.value = false
  try {
    const recruitmentId = route.params.id as string
    if (recruitmentId) {
      const res = await getRecruitmentById(recruitmentId)
      recruitment.value = res.data
      if (!recruitment.value) {
        notFound.value = true
      }
    } else {
      const res = await getCurrentRecruitment()
      recruitment.value = res.data
    }
  } catch (error) {
    console.error('Failed to fetch recruitment:', error)
    notFound.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchRecruitment()
})
</script>

<style scoped lang="scss">
.recruitment-landing {
  min-height: 100vh;
  background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
  color: #fff;
  overflow-x: hidden;
  position: relative;
}

.loading-container,
.not-found-container {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .loading-spinner {
    width: 50px;
    height: 50px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top-color: #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
  }

  p {
    color: rgba(255, 255, 255, 0.6);
    font-size: 16px;
  }
}

.not-found-container {
  .not-found-icon {
    font-size: 80px;
    margin-bottom: 20px;
  }

  h2 {
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 12px;
  }

  p {
    color: rgba(255, 255, 255, 0.5);
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.stars-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.stars, .stars2, .stars3 {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-repeat: repeat;
}

.stars {
  background-image: 
    radial-gradient(1px 1px at 100px 50px, #eee, transparent),
    radial-gradient(1px 1px at 200px 150px, #fff, transparent),
    radial-gradient(1px 1px at 300px 250px, #ddd, transparent),
    radial-gradient(1px 1px at 400px 350px, #fff, transparent),
    radial-gradient(1px 1px at 500px 100px, #eee, transparent),
    radial-gradient(1px 1px at 50px 200px, #fff, transparent),
    radial-gradient(1.5px 1.5px at 150px 300px, #fff, transparent),
    radial-gradient(1px 1px at 250px 400px, #ddd, transparent),
    radial-gradient(1.5px 1.5px at 350px 500px, #fff, transparent),
    radial-gradient(1px 1px at 450px 50px, #eee, transparent),
    radial-gradient(1px 1px at 550px 150px, #fff, transparent),
    radial-gradient(1.5px 1.5px at 650px 250px, #fff, transparent),
    radial-gradient(1px 1px at 750px 350px, #ddd, transparent),
    radial-gradient(1px 1px at 850px 450px, #fff, transparent),
    radial-gradient(1.5px 1.5px at 950px 100px, #eee, transparent),
    radial-gradient(1px 1px at 1050px 200px, #fff, transparent),
    radial-gradient(1px 1px at 1150px 300px, #ddd, transparent),
    radial-gradient(1.5px 1.5px at 1250px 400px, #fff, transparent),
    radial-gradient(1px 1px at 1350px 500px, #eee, transparent),
    radial-gradient(1px 1px at 1450px 150px, #fff, transparent);
  background-size: 1500px 600px;
  animation: starsMove 100s linear infinite;
}

.stars2 {
  background-image: 
    radial-gradient(1px 1px at 50px 100px, #fff, transparent),
    radial-gradient(1.5px 1.5px at 150px 200px, #ddd, transparent),
    radial-gradient(1px 1px at 250px 300px, #fff, transparent),
    radial-gradient(1px 1px at 350px 400px, #eee, transparent),
    radial-gradient(1.5px 1.5px at 450px 500px, #fff, transparent),
    radial-gradient(1px 1px at 550px 50px, #ddd, transparent),
    radial-gradient(1px 1px at 650px 150px, #fff, transparent),
    radial-gradient(1.5px 1.5px at 750px 250px, #eee, transparent),
    radial-gradient(1px 1px at 850px 350px, #fff, transparent),
    radial-gradient(1px 1px at 950px 450px, #ddd, transparent);
  background-size: 1000px 550px;
  animation: starsMove 150s linear infinite;
}

.stars3 {
  background-image: 
    radial-gradient(2px 2px at 100px 200px, #fff, transparent),
    radial-gradient(2px 2px at 400px 100px, #fff, transparent),
    radial-gradient(2px 2px at 700px 300px, #fff, transparent),
    radial-gradient(2px 2px at 1000px 200px, #fff, transparent),
    radial-gradient(2px 2px at 1300px 100px, #fff, transparent);
  background-size: 1400px 400px;
  animation: starsMove 200s linear infinite;
  opacity: 0.8;
}

@keyframes starsMove {
  from { transform: translateY(0); }
  to { transform: translateY(-600px); }
}

.shooting-stars {
  position: absolute;
  width: 100%;
  height: 100%;
  
  span {
    position: absolute;
    width: 3px;
    height: 3px;
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 0 6px 2px rgba(255, 255, 255, 0.5);
    animation: shooting 8s linear infinite;
    
    &::before {
      content: '';
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 100px;
      height: 1px;
      background: linear-gradient(90deg, rgba(255,255,255,0.8), transparent);
    }
    
    &:nth-child(1) {
      top: 10%;
      left: 20%;
      animation-delay: 0s;
    }
    &:nth-child(2) {
      top: 20%;
      left: 60%;
      animation-delay: 2s;
    }
    &:nth-child(3) {
      top: 40%;
      left: 40%;
      animation-delay: 4s;
    }
    &:nth-child(4) {
      top: 60%;
      left: 80%;
      animation-delay: 6s;
    }
  }
}

@keyframes shooting {
  0% {
    transform: translateX(0) translateY(0);
    opacity: 1;
  }
  70% {
    opacity: 1;
  }
  100% {
    transform: translateX(300px) translateY(300px);
    opacity: 0;
  }
}

.hero-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 80px 20px;
  z-index: 1;
  
  .hero-content {
    position: relative;
    z-index: 1;
    text-align: center;
    max-width: 900px;
  }

  .hero-badge {
    display: inline-block;
    padding: 8px 20px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50px;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 30px;
    backdrop-filter: blur(10px);
  }

  .hero-title {
    font-size: clamp(40px, 8vw, 80px);
    font-weight: 800;
    line-height: 1.1;
    margin-bottom: 24px;

    .gradient-text {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .sub-title {
      font-size: 0.5em;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.8);
    }
  }

  .hero-desc {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.8;
    margin-bottom: 40px;
  }

  .hero-actions {
    display: flex;
    gap: 20px;
    justify-content: center;
    margin-bottom: 60px;

    .btn-primary {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 50px;
      font-size: 18px;
      font-weight: 600;
      color: white;
      cursor: pointer;
      transition: all 0.3s ease;

      &.pulse {
        animation: pulse 2s infinite;
      }

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 20px 40px rgba(102, 126, 234, 0.4);
      }
    }

    .btn-secondary {
      padding: 16px 40px;
      background: transparent;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50px;
      font-size: 18px;
      font-weight: 600;
      color: white;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.5);
      }
    }
  }

  .hero-stats {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 40px;

    .stat-item {
      text-align: center;

      .stat-value {
        display: block;
        font-size: 36px;
        font-weight: 800;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .stat-label {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.6);
      }
    }

    .stat-divider {
      width: 1px;
      height: 40px;
      background: rgba(255, 255, 255, 0.2);
    }
  }

  .scroll-indicator {
    position: absolute;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;

    .mouse {
      width: 24px;
      height: 40px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 12px;
      position: relative;

      .wheel {
        width: 4px;
        height: 8px;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 2px;
        position: absolute;
        top: 8px;
        left: 50%;
        transform: translateX(-50%);
        animation: scroll 2s infinite;
      }
    }
  }
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4); }
  50% { box-shadow: 0 0 0 20px rgba(102, 126, 234, 0); }
}

@keyframes scroll {
  0% { opacity: 1; top: 8px; }
  100% { opacity: 0; top: 20px; }
}

.section-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 100px 20px;
  position: relative;
  z-index: 1;
}

.section-header {
  text-align: center;
  margin-bottom: 60px;

  .section-tag {
    display: inline-block;
    padding: 6px 16px;
    background: rgba(102, 126, 234, 0.2);
    color: #667eea;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 16px;
  }

  .section-title {
    font-size: 40px;
    font-weight: 700;
    margin-bottom: 16px;
  }

  .section-desc {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.6);
  }
}

.departments-section {
  position: relative;
  z-index: 1;
}

.departments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 24px;
}

.dept-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 32px;
  transition: all 0.4s ease;
  animation: fadeInUp 0.6s ease forwards;
  opacity: 0;
  backdrop-filter: blur(10px);

  &:hover {
    transform: translateY(-8px);
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.15);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  }

  .dept-icon {
    width: 60px;
    height: 60px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;

    .el-icon {
      font-size: 28px;
      color: white;
    }
  }

  .dept-name {
    font-size: 22px;
    font-weight: 600;
    margin-bottom: 12px;
  }

  .dept-desc {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1.6;
    margin-bottom: 16px;
  }

  .dept-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .tag {
      padding: 4px 12px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
    }
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.benefits-section {
  position: relative;
  z-index: 1;
}

.benefits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 30px;
}

.benefit-card {
  position: relative;
  padding: 30px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(-5px);
  }

  .benefit-number {
    font-size: 48px;
    font-weight: 800;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 16px;
  }

  .benefit-title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 10px;
  }

  .benefit-desc {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1.6;
  }
}

.timeline-section {
  position: relative;
  z-index: 1;
}

.timeline {
  position: relative;
  max-width: 600px;
  margin: 0 auto;

  &::before {
    content: '';
    position: absolute;
    left: 30px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  }
}

.timeline-item {
  display: flex;
  gap: 30px;
  margin-bottom: 40px;
  position: relative;

  .timeline-marker {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    z-index: 1;

    .timeline-number {
      font-size: 24px;
      font-weight: 700;
      color: white;
    }
  }

  .timeline-content {
    flex: 1;
    padding-top: 8px;

    .timeline-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .timeline-desc {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 8px;
    }

    .timeline-date {
      font-size: 12px;
      color: #667eea;
    }
  }
}

.apply-section {
  position: relative;
  z-index: 1;
  padding: 80px 0;
}

.apply-card {
  max-width: 800px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 40px;
  backdrop-filter: blur(20px);

  .apply-header {
    text-align: center;
    margin-bottom: 40px;

    h2 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 10px;
    }

    p {
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 16px;
    }

    .deadline {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: rgba(239, 68, 68, 0.1);
      border-radius: 20px;
      color: #f87171;
      font-size: 14px;
    }
  }
}

.apply-form {
  .form-section {
    margin-bottom: 30px;
    padding-bottom: 30px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    &:last-of-type {
      border-bottom: none;
    }

    h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #667eea;
    }
  }

  .form-grid {
    display: grid;
    gap: 0 20px;
    
    &.form-grid-2 {
      grid-template-columns: repeat(2, 1fr);
    }
    
    &.form-grid-3 {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  :deep(.el-form-item__label) {
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;
  }

  :deep(.el-input__wrapper) {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: none;

    &:hover {
      border-color: rgba(255, 255, 255, 0.2);
    }

    &.is-focus {
      border-color: #667eea;
    }
  }

  :deep(.el-input__inner) {
    color: #fff;

    &::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }
  }

  :deep(.el-textarea__inner) {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;

    &:hover {
      border-color: rgba(255, 255, 255, 0.2);
    }

    &:focus {
      border-color: #667eea;
    }

    &::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }
  }

  :deep(.el-select .el-input__wrapper) {
    background: rgba(255, 255, 255, 0.05);
  }

  :deep(.el-checkbox__label) {
    color: rgba(255, 255, 255, 0.7);
  }

  .submit-btn {
    width: 100%;
    padding: 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 12px;
    font-size: 18px;
    font-weight: 600;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.success-dialog {
  :deep(.el-dialog) {
    background: #1a1a24;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .success-content {
    text-align: center;
    padding: 20px;

    .success-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;

      .el-icon {
        font-size: 40px;
        color: white;
      }
    }

    h3 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 12px;
    }

    p {
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 8px;
    }

    .application-id {
      font-size: 18px;
      font-weight: 600;
      color: #667eea;
      padding: 12px 20px;
      background: rgba(102, 126, 234, 0.1);
      border-radius: 10px;
      display: inline-block;
      margin: 16px 0;
    }

    .tip {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.4);
      margin-bottom: 24px;
    }

    .el-button {
      padding: 12px 40px;
      border-radius: 10px;
    }
  }
}

.landing-footer {
  background: rgba(0, 0, 0, 0.3);
  padding: 60px 20px 30px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
  z-index: 1;

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 40px;
  }

  .footer-brand {
    .footer-logo {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    p {
      color: rgba(255, 255, 255, 0.4);
      font-size: 14px;
    }
  }

  .footer-links {
    .link-group {
      h4 {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 16px;
        color: rgba(255, 255, 255, 0.8);
      }

      p {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.4);
        margin-bottom: 8px;
      }
    }
  }

  .footer-bottom {
    text-align: center;
    padding-top: 30px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);

    p {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.3);
    }
  }
}

@media (max-width: 768px) {
  .hero-section {
    .hero-title {
      font-size: 36px;
    }

    .hero-actions {
      flex-direction: column;
      align-items: center;
    }

    .hero-stats {
      flex-wrap: wrap;
      gap: 20px;
    }
  }

  .departments-grid {
    grid-template-columns: 1fr;
  }

  .apply-card {
    padding: 24px;
  }

  .apply-form {
    .form-grid {
      &.form-grid-2, &.form-grid-3 {
        grid-template-columns: 1fr;
      }
    }
  }

  .timeline::before {
    left: 20px;
  }

  .timeline-item .timeline-marker {
    width: 40px;
    height: 40px;

    .timeline-number {
      font-size: 18px;
    }
  }
}
</style>
