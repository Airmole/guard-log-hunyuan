import { ref } from 'vue'

export function useSetting() {
  const showSettingModal = ref(false)
  const setting = ref({
    vocation: null,
    partner: ''
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

  const saveSetting = () => {
    const settingData = setting.value
    uni.setStorage({
      key: 'setting',
      data: settingData,
      success: () => {
        hideSettingModal()
        uni.showToast({ title: '保存成功' })
      }
    })
  }

  const getSetting = () => {
    uni.getStorage({
      key: 'setting',
      success: (res) => {
        if (res.data) setting.value = res.data
      }
    })
  }

  return {
    showSettingModal,
    setting,
    hideSettingModal,
    displaySetting,
    vocationChange,
    saveSetting,
    getSetting
  }
}