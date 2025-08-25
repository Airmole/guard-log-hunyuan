<template>
  <view class="cu-modal bottom-modal" :class="showSettingModal?'show':''">
    <view class="cu-dialog">
      <view class="cu-bar justify-center"><view class="text-center">生成设置</view></view>
      <view class="padding-lr-sm padding-bottom">
        <view class="text-left">
          设置休假日期和代班同事，以生成更合理的巡护日志
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
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  showSettingModal: Boolean,
  setting: Object
})

const emit = defineEmits([
  'update:showSettingModal',
  'update:setting',
  'vocationChange',
  'saveSetting'
])

const hideSettingModal = () => {
  emit('update:showSettingModal', !props.showSettingModal)
}

const vocationChange = (e) => {
  emit('vocationChange', e)
}

const saveSetting = () => {
  emit('saveSetting')
}
</script>