import { ref, computed } from 'vue'

export function useCalendar() {
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
    getMonthInfo(e.fullDate)
  }

  const getMonthInfo = (month = '') => {
    uni.showLoading({title: '加载中...'})
    uni.request({
      url: `/api/calendar?month=${month}`,
      method: 'GET',
      success: (res) => {
        if (res.data) {
          const messages = []
          for (const monthKey in res.data) {
            for (let day of res.data[monthKey]) {
              let weatherText = day.weather
              if (weatherText.length > 4) {
                const weatherPattern = /^[\u4e00-\u9fa5]+/
                weatherText = weatherPattern.test(day.weather)
              }
              messages.push({
                date: day.date,
                info: day.keyword,
                infoColor: '#3c9cff',
                topInfo: weatherText,
                topInfoColor: '#3c9cff',
                weather: day.weather,
                wind: day.wind,
                event: day.event,
              })
            }
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
    getMonthInfo
  }
}