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
		
		<view class="cu-list menu sm-border card-menu margin-sm bg-white">
			<view class="text-center text-xl margin-tb-xs">{{checkedDate}}</view>
			<view v-if="checkedDay==''" class="text-center">
				<image style="height: 200rpx;" src="https://r2.airmole.cn/i/2025/05/02/%E7%82%92%E9%A5%AD.gif" mode="heightFix"></image>
				<view class="text-xl margin-tb-sm">数据待更新</view>
			</view>
			<template v-else>
				<view class="margin-sm">
					<view class="cu-capsule radius margin-lr-xs">
					    <view class='cu-tag bg-blue'>天气</view>
					    <view class="cu-tag line-blue">{{checkedDay.weather}}</view>
					</view>
					<view v-if="checkedDay.wind" class="cu-capsule radius margin-lr-xs">
					    <view class='cu-tag bg-blue'>风力</view>
					    <view class="cu-tag line-blue">{{checkedDay.wind}}</view>
					</view>
					<view class="cu-tag line-blue margin-lr-xs">{{checkedDay.event}}</view>
				</view>
			</template>
		</view>
		
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

	</view>
</template> 
<script>
	export default {
		data() {
			return {
				defaultDay: '',
				type: "month",
				mode: "single",
				color: "#3c9cff",
				insert: true,
				fold: true,
				startWeek: "mon",
				slideSwitchMode: "horizontal",
				startDate: "2025-01-01",
				monthShowCurrentMonth: false,
				lunar: false,
				showMonth: true,
				calendarMessage: [],
				checkedDay: '',
				checkedDate: '',
				showSettingModal: false,
				setting: {
					vocation: null, // 公休假期 0-1~8日，1-9~16日
					partner: '',    // 代办同事姓名
				}
			}
		},
		onLoad () {
			this.defaultDay = this.getFirstDayOfMonth()
			this.checkedDate = this.defaultDay
			this.getMonthInfo()
		},
		methods: {
			calendarChange(e) {
				console.log(e);
				const date = e.fulldate
				this.checkedDate = date
				console.log(date)
				
				let checkedDay = ''
				const calendarMessage = this.calendarMessage
				for (var i = 0; i < calendarMessage.length; i++) {
					const day = calendarMessage[i]
					if (day.date == date) checkedDay = day
				}
				this.checkedDay = checkedDay
			},
			monthChange(e) {
				console.log('monthChange', e)
				this.getMonthInfo(e.fullDate)
			},
			getMonthInfo (month = '') {
				uni.request({
					url: `/api/calendar?month=${month}`,
					method: 'GET',
					success: (res) => {
						if (res.data) {
							const calendarMessage = []
							for (const month in res.data) {
								for (let day of res.data[month]) {
									let weatherText = day.weather;
									if (weatherText.length > 4) {
										const weatherPattern = /^[\u4e00-\u9fa5]+/
										weatherText = weatherPattern.test(day.weather)
									}
									calendarMessage.push({
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
							this.calendarMessage = calendarMessage
						} else {
							if (res.data.message) uni.showToast({ title: res.data.message, icon: 'none' })
						}
						if (month) {
							this.calendarChange({ fulldate: month + '-01' })
							this.defaultDay = month + '-01'
						}
					}
				})
			},
			getFirstDayOfMonth(y = '', m = '') {
			  const currentDate = new Date(); // 当前日期
			  // 创建本月1号的Date对象（月份参数无需+1，因为Date构造函数月份从0开始）
			  const firstDay = new Date(y ? y : currentDate.getFullYear(), m ? m : currentDate.getMonth(), 1);
			  
			  // 提取年、月、日并补零
			  const year = firstDay.getFullYear();
			  const month = String(firstDay.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需+1
			  const day = String(firstDay.getDate()).padStart(2, '0');
			  
			  return `${year}-${month}-${day}`;
			},
			hideSettingModal () {
				this.showSettingModal = !this.showSettingModal
			},
			displaySetting () {
				this.showSettingModal = !this.showSettingModal
				this.getSetting()
			},
			vocationChange (e) {
				const value = e.detail.value
				console.log(value)
				this.setting.vocation = value
			},
			saveSetting () {
				const setting = this.setting
				uni.setStorage({
					key: 'setting',
					data: setting,
					success: () => {
						this.hideSettingModal()
						uni.showToast({ title: '保存成功'})
					}
				})
			},
			getSetting () {
				uni.getStorage({
					key: 'setting',
					success: (res) => {
						if (res.data) this.setting = res.data
					}
				});
			}
		}
	}
</script>