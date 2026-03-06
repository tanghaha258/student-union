import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type ThemeMode = 'dark' | 'light'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<ThemeMode>((localStorage.getItem('theme') as ThemeMode) || 'dark')

  const isDark = ref(theme.value === 'dark')

  const toggleTheme = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    isDark.value = theme.value === 'dark'
    applyTheme(theme.value)
  }

  const applyTheme = (mode: ThemeMode) => {
    document.documentElement.setAttribute('data-theme', mode)
    localStorage.setItem('theme', mode)
  }

  // 初始化主题
  applyTheme(theme.value)

  watch(theme, (newTheme) => {
    isDark.value = newTheme === 'dark'
  })

  return {
    theme,
    isDark,
    toggleTheme
  }
})
