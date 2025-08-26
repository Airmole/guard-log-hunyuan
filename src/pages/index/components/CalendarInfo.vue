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
        
        <!-- 生成护林员日志部分 -->
        <view class="margin-top-sm">
          <button class="cu-btn bg-blue margin-lr-xs" @click="generateGuardLog" :disabled="generating">
            {{ generating ? '生成中...' : '生成护林员日志' }}
          </button>
        </view>
        
        <!-- 显示生成的日志 -->
        <view v-if="guardLog" class="margin-top-sm padding-sm bg-gray-100 rounded">
          <view class="text-base" style="white-space: pre-line;">{{ guardLog }}</view>
        </view>
        
        <!-- 显示错误信息 -->
        <view v-if="error" class="margin-top-sm text-red-500">{{ error }}</view>
      </view>
    </template>
  </view>
</template>

<script setup>
import { ref, defineProps, onMounted } from 'vue';

// 定义props
const props = defineProps({
  checkedDate: String,
  checkedDay: [String, Object]
});

const guardLog = ref('');
const generating = ref(false);
const error = ref('');
const substituteName = ref('');

// 获取代班同事姓名设置
onMounted(async () => {
  try {
    const setting = await uni.getStorage({ key: 'setting' });
    if (setting.data && setting.data.partner) {
      substituteName.value = setting.data.partner;
    }
  } catch (error) {
    console.log('未找到代班同事设置');
  }
});

/**
 * 生成护林员日志
 */
function generateGuardLog() {
  if (!props.checkedDay || typeof props.checkedDay === 'string') {
    error.value = '请先选择有效的日期';
    return;
  }

  console.log(props.checkedDay)
  
  guardLog.value = '';
  error.value = '';
  generating.value = true;
  
  // 构建API请求参数
  const params = new URLSearchParams();
  params.append('date', props.checkedDate);
  params.append('weather', props.checkedDay.weather || '');
  params.append('wind', props.checkedDay.wind || '');
  params.append('isMeeting', props.checkedDay.info.includes('护林例会') ? 'true' : 'false');
  params.append('isHoliday', props.checkedDay.info === '休假' ? 'true' : 'false');
  params.append('substituteName', substituteName.value || '');
  params.append('keywords', props.checkedDay.event || '');
  
  // 构建API URL
  const apiUrl = `http://localhost:8088/api/ailog?${params.toString()}`;
  
  // 创建SSE连接
  const eventSource = new EventSource(apiUrl);
  
  // 监听消息事件
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.status === 'success' && data.log) {
        guardLog.value = data.log;
      } else if (data.status === 'error' && data.error) {
        error.value = data.error;
      }
    } catch (e) {
      error.value = '解析日志数据失败';
      console.error('解析SSE数据失败:', e);
    }
    
    // 关闭连接并重置状态
    eventSource.close();
    generating.value = false;
  };
  
  // 监听错误事件
  eventSource.onerror = (err) => {
    error.value = '生成日志失败，请重试';
    generating.value = false;
    eventSource.close();
    console.error('SSE连接错误:', err);
  };
}
</script>