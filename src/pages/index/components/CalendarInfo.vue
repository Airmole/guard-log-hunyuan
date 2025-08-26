<template>
  <view class="cu-list menu sm-border card-menu margin-sm bg-white">
    <view class="text-center text-xl margin-tb-xs">{{ checkedDate }}</view>
    <view v-if="checkedDay==''" class="text-center">
      <image style="height: 200rpx;" src="https://r2.airmole.cn/i/2025/05/02/%E7%82%92%E9%A5%AD.gif" mode="heightFix"></image>
      <view class="text-xl margin-tb-sm">数据待更新</view>
    </view>
    <template v-else>
      <view class="margin-sm">
        <view class="cu-capsule radius margin-lr-xs">
          <view class='cu-tag bg-blue'>天气</view>
          <view class="cu-tag line-blue">{{ checkedDay.weather }}</view>
        </view>
        <view v-if="checkedDay.wind" class="cu-capsule radius margin-lr-xs">
          <view class='cu-tag bg-blue'>风力</view>
          <view class="cu-tag line-blue">{{ checkedDay.wind }}</view>
        </view>
        <view v-if="checkedDay.info == '休假'" class="cu-tag line-blue margin-lr-xs">{{ checkedDay.info }}</view>
        <view v-if="checkedDay.event" class="cu-tag line-blue margin-lr-xs">{{ checkedDay.event }}</view>
      </view>
    </template>
  </view>
</template>

<script setup>
defineProps({
  checkedDate: String,
  checkedDay: [String, Object]
})
</script>