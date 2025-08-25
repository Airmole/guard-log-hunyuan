<template>
  <view class="cu-modal bottom-modal" :class="showSettingModal?'show':''" style="z-index: 99;">
    <view class="cu-dialog">
      <view class="cu-bar justify-center"><view class="text-center">生成设置</view></view>
      <view class="padding-lr-sm padding-bottom">
        <view class="text-left">
          设置休假日期和代班同事，以生成更合理的巡护日志
        </view>
        <view class="cu-form-group margin-top">
          <view class="title">公休月份</view>
          <view class="flex align-center">
            <picker mode="selector" :range="monthRange" :value="setting.vocationStartMonth - 1" @change="vocationStartMonthChange">
              <view class="picker margin-right-sm">{{ setting.vocationStartMonth }}月</view>
            </picker>
            <text class="margin-lr-xs">至</text>
            <picker mode="selector" :range="monthRange" :value="setting.vocationEndMonth - 1" @change="vocationEndMonthChange">
              <view class="picker margin-left-sm">{{ setting.vocationEndMonth }}月</view>
            </picker>
          </view>
        </view>
        <radio-group class="block" @change="vocationChange">
          <view class="cu-form-group margin-top">
            <view class="title">每月公休</view>
            <label>
              <radio class="radio" :class="setting.vocation=='0'?'checked':''" :checked="setting.vocation=='0'?true:false" value="0"></radio>1~8日
            </label>
            <label>
              <radio class="radio" :class="setting.vocation=='1'?'checked':''" :checked="setting.vocation=='1'?true:false" value="1"></radio>9~16日
            </label>
          </view>
        </radio-group>
        <view class="cu-form-group margin-top">
          <view class="title">代班同事</view>
          <input v-model="setting.partner" placeholder="输入休假代班同事姓名" name="input"></input>
        </view>
        <view class="margin-top justify-center">
          <button @tap="hideSettingModal" class="cu-btn round margin-lr bg-blue">暂不设置</button>
          <button @tap="saveSetting" class="cu-btn round margin-lr bg-gradual-green">保存设置</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { defineProps, defineEmits, ref } from 'vue'

const props = defineProps({
  showSettingModal: Boolean,
  setting: Object
})

const emit = defineEmits([
  'update:showSettingModal',
  'update:setting',
  'vocationChange',
  'saveSetting',
  'vocationStartMonthChange',
  'vocationEndMonthChange'
])

const monthRange = ref(['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'])

const hideSettingModal = () => {
  emit('update:showSettingModal', !props.showSettingModal)
}

const vocationChange = (e) => {
  emit('vocationChange', e)
}

const vocationStartMonthChange = (e) => {
  const value = parseInt(e.detail.value) + 1
  emit('vocationStartMonthChange', value)
}

const vocationEndMonthChange = (e) => {
  const value = parseInt(e.detail.value) + 1
  emit('vocationEndMonthChange', value)
}

const saveSetting = () => {
  emit('saveSetting')
}
</script>
