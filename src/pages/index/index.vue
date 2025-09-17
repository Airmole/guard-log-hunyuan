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
      ref="calendarInfoRef"
      :checkedDate="checkedDate" 
      :checkedDay="checkedDay" 
    />
    
    <SettingModal
      :showSettingModal="showSettingModal"
      :setting="setting"
      @update:showSettingModal="showSettingModal = $event"
      @vocationChange="vocationChange"
      @vocationStartMonthChange="vocationStartMonthChange"
      @vocationEndMonthChange="vocationEndMonthChange"
      @saveSetting="saveSetting"
    />
	
	<view class="flex justify-center flex-direction align-center margin-tb-xl">
		<view class='cu-avatar round margin-right-xs' :style="`background-image: url(${airmoleAvatar});`"></view>
		<view><text>Airmole.</text></view>
		<view><text class="text-xs">陇ICP备17001242号-2</text></view>
	</view>
  </view>
</template>

<script setup>
import { onMounted, onBeforeMount, ref, watch } from 'vue'
import { useCalendar } from './composables/useCalendar'
import { useSetting } from './composables/useSetting'
import CalendarInfo from './components/CalendarInfo.vue'
import SettingModal from './components/SettingModal.vue'

const calendarInfoRef = ref(null);
const airmoleAvatar = ref('https://r2.airmole.cn/avatar.jpg')

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
  vocationStartMonthChange,
  vocationEndMonthChange,
  saveSetting,
  getSetting
} = useSetting()

onBeforeMount(() => {
  // defaultDay.value = getFirstDayOfMonth()
  defaultDay.value = '2025-09-01'
  checkedDate.value = defaultDay.value
})

onMounted(() => {
  // defaultDay.value = getFirstDayOfMonth()
  defaultDay.value = '2025-09-01'
  checkedDate.value = defaultDay.value
  getMonthInfo(checkedDate.value.substring(0, 7))
  
  // 检查是否有设置，如果没有则弹出设置弹窗
  uni.getStorage({
    key: 'setting',
    success: (res) => {
      if (!res.data || !res.data.vocation) {
        displaySetting()
      }
    },
    fail: () => {
      displaySetting()
    }
  })
})

// 监听日历数据加载完成，自动生成日志
watch(() => checkedDay.value, (newVal) => {
  if (newVal && calendarInfoRef.value) {
    // 延迟一下确保组件渲染完成
    setTimeout(() => {
      calendarInfoRef.value.autoGenerateLog()
    }, 100)
  }
})
</script>