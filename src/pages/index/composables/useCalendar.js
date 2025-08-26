import { ref, computed } from 'vue'
import { useSetting } from './useSetting.js'

export function useCalendar() {
  const { getSetting } = useSetting()
  const defaultDay = ref('')
  const type = ref("month")
  const mode = ref("single")
  const color = ref("#3c9cff")
  const insert = ref(true)
  const fold = ref(true)
  const startWeek = ref("mon")
  const slideSwitchMode = ref("horizontal")
  const startDate = ref("2025-01-01")
  const monthShowCurrentMonth = ref(false)
  const lunar = ref(false)
  const showMonth = ref(true)
  const calendarMessage = ref([])
  const checkedDay = ref('')
  const checkedDate = ref('')

  // 监听设置更新事件
  uni.$on('settingUpdated', () => {
    refreshCalendar()
  })

  const getFirstDayOfMonth = (y = '', m = '') => {
    const currentDate = new Date()
    const firstDay = new Date(y ? y : currentDate.getFullYear(), m ? m : currentDate.getMonth(), 1)

    const year = firstDay.getFullYear()
    const month = String(firstDay.getMonth() + 1).padStart(2, '0')
    const day = String(firstDay.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  const calendarChange = (e) => {
    const date = e.fulldate
    checkedDate.value = date

    let foundDay = ''
    const messages = calendarMessage.value
    for (let i = 0; i < messages.length; i++) {
      const day = messages[i]
      if (day.date == date) foundDay = day
    }
    checkedDay.value = foundDay
  }

  const monthChange = (e) => {
    // getMonthInfo(e.fullDate)
  }

  const refreshCalendar = () => {
    if (defaultDay.value) {
      const currentMonth = defaultDay.value.substring(0, 7)
      getMonthInfo(currentMonth)
    }
  }

  const getMonthInfo = (month = '') => {
    uni.showLoading({ title: '加载中...' })

    // 先获取设置，然后再请求日历数据
    getSetting().then(setting => {
      uni.request({
        url: `/api/calendar?month=${month}`,
        method: 'GET',
        success: (res) => {
          if (res.data) {
            const messages = []

            for (let day of res.data) {
              let weatherText = day.weather
              if (weatherText.length > 4) {
                const weatherPattern = /^[\u4e00-\u9fa5]+/
                weatherText = weatherPattern.exec(day.weather)
                weatherText = weatherText ? weatherText[0] : ''
              }

              // 检查是否为公休日
              let info = day.keyword
              if (isVocationDay(day.date, setting)) {
                info = '休假'
              }

              messages.push({
                date: day.date,
                info: info || '　',
                infoColor: '#3c9cff',
                topInfo: weatherText,
                topInfoColor: '#3c9cff',
                weather: day.weather,
                wind: day.wind,
                event: day.event,
              })
            }

            calendarMessage.value = messages
          } else {
            if (res.data.message) uni.showToast({ title: res.data.message, icon: 'none' })
          }
          if (month) {
            calendarChange({ fulldate: month + '-01' })
            defaultDay.value = month + '-01'
          }
        },
        complete: () => {
          uni.hideLoading()
        }
      })
    })
  }

  // 检查是否为公休日
  const isVocationDay = (dateStr, setting) => {
    if (!setting || !setting.vocation) return false

    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()

    // 检查月份是否在公休月份范围内
    if (month < setting.vocationStartMonth || month > setting.vocationEndMonth) {
      return false
    }

    // 检查日期是否在公休日期范围内
    if (setting.vocation === '0') {
      return day >= 1 && day <= 8
    } else if (setting.vocation === '1') {
      return day >= 9 && day <= 16
    }

    return false
  }

  return {
    defaultDay,
    type,
    mode,
    color,
    insert,
    fold,
    startWeek,
    slideSwitchMode,
    startDate,
    monthShowCurrentMonth,
    lunar,
    showMonth,
    calendarMessage,
    checkedDay,
    checkedDate,
    getFirstDayOfMonth,
    calendarChange,
    monthChange,
    getMonthInfo,
    refreshCalendar
  }
}