<template>
	<view>
		<view class="cu-modal" :class="!logined?'show':''" style="z-index: 99;">
			<view class="cu-dialog">
				<view class="cu-bar bg-white justify-end">
					<view class="content">请输入密码</view>
				</view>
				<view class="padding-xl">
					<view class="cu-form-group margin-top">
						<view class="title">密码</view>
						<input type="password" placeholder="请输入管理密码" name="input" v-model="password"></input>
					</view>
				</view>
				<view class="cu-bar bg-white justify-end">
					<view class="action">
						<button class="cu-btn bg-green margin-left round" @tap="loginAction">确定</button>
					</view>
				</view>
			</view>
		</view>


		<view class="cu-bar bg-white radius">
			<view class="action">
				<text class="cuIcon-title text-green"></text>
				<text class="text-xl text-bold">巡护数据管理</text>
			</view>
		</view>
		<view class="margin-lr-sm">
			<view class="cu-form-group margin-top round">
				<view class="title">日期选择</view>
				<picker mode="date" :value="form.date" @change="dateChanged">
					<view class="picker">{{form.date}}</view>
				</picker>
			</view>
			<view class="cu-form-group margin-top round text-right">
				<view class="title">天气</view>
				<input placeholder="输入天气情况，例如：晴" name="weather" v-model="form.weather"></input>
			</view>
			<view class="cu-form-group margin-top round text-right">
				<view class="title">风力</view>
				<input placeholder="可不填" name="wind" v-model="form.wind"></input>
			</view>
			<view class="cu-form-group margin-top round text-right">
				<view class="title">关键字</view>
				<input placeholder="日历日期下方展示关键字(可不填)" name="keyword" v-model="form.keyword"></input>
			</view>
			<view class="cu-form-group margin-top round text-right">
				<view class="title">当日事件</view>
				<input placeholder="当天事件的简要描述(可不填)" name="event" v-model="form.event"></input>
			</view>
			<view class="margin-tb-xl flex justify-between margin-lr">
				<button @tap="clearForm" class="cu-btn bg-white round"><text class="cuIcon cuIcon-delete margin-right-xs"></text>清空数据</button>
				<button @tap="submit" class="cu-btn bg-gradual-green round"><text class="cuIcon cuIcon-check margin-right-xs"></text>保存</button>
			</view>
		</view>
	</view>
</template>

<script>
	import { useCalendar } from './composables/useCalendar'
	const { getFirstDayOfMonth } = useCalendar()
	export default {
		data() {
			return {
				logined: false,
				password: '',
				form: {
					date: "",
					weather: "晴",
					wind: "",
					keyword: "",
					event: ""
				}
			}
		},
		onLoad() {
			this.form.date = getFirstDayOfMonth()
		},
		methods: {
			submit () {
				const form = this.form
				uni.request({
					url: `/api/save`,
					method: 'POST',
					data: form,
					success: () => {
						this.clearForm()
						uni.showToast({ title: '保存成功'})
					}
				})
			},
			loginAction() {
				const password = this.password
				const correctPassword = process.env.ADMIN_PASSWORD || 'admin@airmole.cn'
				if (password !== correctPassword) {
					uni.showToast({
						title: '密码错误',
						icon: 'error'
					})
					return
				}

				this.logined = true
			},
			dateChanged (e) {
				this.form.date = e.detail.value
			},
			clearForm () {
				this.form = {
					date: getFirstDayOfMonth(),
					weather: "",
					wind: "",
					keyword: "",
					event: ""
				}
			}
		}
	}
</script>

<style>

</style>