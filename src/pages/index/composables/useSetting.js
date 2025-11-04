import { ref } from 'vue'

export function useSetting() {
  const showSettingModal = ref(false)
  const setting = ref({
    vocation: null,
    partner: '',
    vocationStartMonth: 6,
    vocationEndMonth: 9
  })

  const hideSettingModal = () => {
    showSettingModal.value = !showSettingModal.value
  }

  const displaySetting = () => {
    showSettingModal.value = !showSettingModal.value
    getSetting()
  }

  const vocationChange = (e) => {
    const value = e.detail.value
    setting.value.vocation = value
  }

  const vocationStartMonthChange = (value) => {
    setting.value.vocationStartMonth = value
  }

  const vocationEndMonthChange = (value) => {
    setting.value.vocationEndMonth = value
  }

  const saveSetting = () => {
    const settingData = setting.value
    uni.setStorage({
      key: 'setting',
      data: settingData,
      success: () => {
        hideSettingModal()
        uni.showToast({ title: '保存成功' })
        // 触发设置更新事件
        uni.$emit('settingUpdated')
      }
    })
  }

  const getSetting = () => {
    return new Promise((resolve) => {
      uni.getStorage({
        key: 'setting',
        success: (res) => {
          if (res.data) setting.value = res.data
          resolve(setting.value)
        },
        fail: () => {
          resolve(setting.value)
        }
      })
    })
  }

  return {
    showSettingModal,
    setting,
    hideSettingModal,
    displaySetting,
    vocationChange,
    vocationStartMonthChange,
    vocationEndMonthChange,
    saveSetting,
    getSetting
  }
}