<template>
  <view>
    <view class="cu-bar bg-white">
      <view class="action">
        <text class="cuIcon-title text-green"></text>
        <text class="text-xl text-bold">巡护日志生成器</text>
      </view>
      <view class="action text-blue" @click="displaySetting()">
        <text class="cuIcon cuIcon-settingsfill"></text>设置
      </view>
    </view>
    
    <wu-calendar
      :date="defaultDay"
      :type="type"
      :mode="mode"
      :color="color"
      :insert="insert"
      :fold="fold"
      :startWeek="startWeek"
      :slideSwitchMode="slideSwitchMode"
      :startDate="startDate"
      :monthShowCurrentMonth="monthShowCurrentMonth"
      :lunar="lunar"
      :showMonth="showMonth"
      :selected="calendarMessage"
      @change="calendarChange"
      @monthSwitch="monthChange"
    ></wu-calendar>
    
    <CalendarInfo 
      :checkedDate="checkedDate" 
      :checkedDay="checkedDay" 
    />
    
    <SettingModal
      :showSettingModal="showSettingModal"
      :setting="setting"
      @update:showSettingModal="showSettingModal = $event"
      @vocationChange="vocationChange"
      @saveSetting="saveSetting"
    />
  </view>
</template>

<script setup>
import { onMounted } from 'vue'
import { useCalendar } from './composables/useCalendar'
import { useSetting } from './composables/useSetting'
import CalendarInfo from './components/CalendarInfo.vue'
import SettingModal from './components/SettingModal.vue'

const {
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
} = useCalendar()

const {
  showSettingModal,
  setting,
  hideSettingModal,
  displaySetting,
  vocationChange,
  saveSetting,
  getSetting
} = useSetting()

onMounted(() => {
  defaultDay.value = getFirstDayOfMonth()
  checkedDate.value = defaultDay.value
  getMonthInfo()
})
</script>