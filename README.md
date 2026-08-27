# 巡护日志生成器

一个基于uni-app和讯飞星火大模型的护林员巡护日志自动生成工具。

## 项目概述

本项目是一个跨平台的移动应用，专为护林员设计，能够根据日期、天气等信息自动生成专业的巡护日志。应用使用讯飞星火 Spark Lite 模型进行AI内容生成，提供智能化的日志撰写体验。

## 技术栈

- **前端框架**: uni-app (Vue 3 + Composition API)
- **UI组件库**: ColorUI + Wu-UI组件库
- **AI服务**: 讯飞星火 Spark Lite 模型
- **部署平台**: EdgeOne
- **构建工具**: Vite

## 功能特性

### 核心功能
- 📅 **智能日历选择**: 支持农历显示和日期选择
- 🌤️ **天气信息集成**: 自动识别天气条件生成相应日志
- 🤖 **AI智能生成**: 基于讯飞星火 Spark Lite 模型生成专业巡护日志
- ⚙️ **个性化设置**: 可配置代班同事、休假安排等
- 📱 **跨平台支持**: 支持H5、微信小程序、支付宝小程序等多端

### 特殊场景处理
- **会议日**: 自动生成护林工作例会日志
- **休假日**: 生成代班同事巡护记录
- **雨雪天气**: 生成驻守管护站日志
- **代班情况**: 支持跨区域代班巡护记录

## 项目结构

```
guard-log-hunyuan/
├── functions/           # EdgeOne边缘函数 API
│   └── api/
│       ├── ailog.js     # 日志生成API（对接讯飞星火）
│       └── calendar.js  # 日历数据API
├── src/                # 前端源码
│   ├── components/      # 公共组件
│   │   └── colorui/    # ColorUI样式库
│   ├── pages/          # 页面组件
│   │   └── index/      # 主页面
│   │       ├── components/
│   │       │   ├── CalendarInfo.vue    # 日志显示组件
│   │       │   └── SettingModal.vue    # 设置弹窗组件
│   │       └── composables/
│   │           ├── useCalendar.js      # 日历逻辑
│   │           └── useSetting.js      # 设置逻辑
│   ├── static/         # 静态资源
│   └── uni_modules/    # uni-app插件
│       ├── wu-calendar/    # 日历组件
│       ├── wu-icon/        # 图标组件
│       ├── wu-safe-bottom/ # 安全区域组件
│       └── wu-ui-tools/    # UI工具库
├── package.json        # 项目配置
├── vite.config.js     # Vite配置
└── index.html         # HTML入口
```

## 安装和运行

### 环境要求
- Node.js 16+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 开发运行
```bash
# H5开发模式
npm run dev:h5

# 微信小程序开发模式
npm run dev:mp-weixin

# 其他平台开发模式
npm run dev:mp-alipay    # 支付宝小程序
npm run dev:mp-baidu     # 百度小程序
npm run dev:mp-qq        # QQ小程序
```

### 生产构建
```bash
# H5构建
npm run build:h5

# 微信小程序构建
npm run build:mp-weixin

# 其他平台构建
npm run build:mp-alipay    # 支付宝小程序
npm run build:mp-baidu     # 百度小程序
npm run build:mp-qq        # QQ小程序
```

## API配置

### 讯飞星火大模型配置
在EdgeOne环境变量中配置：

```bash
SPARK_API_KEY=your_spark_api_key_here
```

可选环境变量（如不需要可省略）：
```bash
SPARK_API_ENDPOINT=https://spark-api-open.xf-yun.com/v1/chat/completions  # 默认使用此端点
SPARK_MODEL=lite  # 默认使用 Spark Lite
```

> 获取API密钥请访问 [讯飞开放平台](https://console.xfyun.cn/)

### API端点
- `GET /api/ailog` - 生成巡护日志（非流式）
- `GET /api/calendar` - 获取日历数据

## 使用说明

1. **首次使用**: 打开应用后会提示进行基本设置
2. **选择日期**: 在日历中选择需要生成日志的日期
3. **查看天气**: 系统会自动显示当天的天气信息
4. **生成日志**: 点击"重新生成"按钮或等待自动生成
5. **个性化设置**: 点击右上角设置图标配置代班同事等信息

## 错误处理

当讯飞星火接口调用失败时（如API密钥无效、余额不足、模型限流等），后端会将讯飞返回的错误码和错误信息传递给前端展示，方便排查问题。

常见错误码：
- `400`: 请求参数错误
- `401`: 身份验证失败（APIPassword无效）
- `403`: 无权限访问
- `429`: 请求速率超限

完整错误码列表请参考 [讯飞星火API文档](https://www.xfyun.cn/doc/spark/HTTP%E8%B0%83%E7%94%A8%E6%96%87%E6%A1%A3.html)

## 日志生成规则

### 常规巡护日志
包含以下元素（选择性出现）：
- 巡护路线和时间
- 道路通畅情况
- 野生动物活动观察
- 非法行为检查
- 火灾隐患排查
- 林木病虫害检查

### 特殊场景
- **会议日**: 生成护林工作例会记录
- **休假日**: 生成代班同事巡护记录
- **雨雪天气**: 生成驻守管护站记录
- **代班情况**: 生成跨区域代班巡护记录

## 开发指南

### 添加新的天气类型
在 `src/pages/index/composables/useCalendar.js` 中扩展天气类型处理逻辑。

### 自定义日志模板
修改 `functions/api/ailog.js` 中的 `buildPrompt` 函数来调整日志生成规则。

### 添加新的平台支持
在 `package.json` 的 scripts 中添加对应的构建和运行命令。

## 部署说明

### EdgeOne部署
1. 配置EdgeOne函数计算环境
2. 部署API函数到EdgeOne平台
3. 配置环境变量 `SPARK_API_KEY`

### 静态资源部署
构建后的H5版本可部署到任何静态文件服务器：
```bash
npm run build:h5
# 构建文件在 dist/build/h5 目录
```

## 技术支持

如有技术问题，请联系开发团队或提交Issue。

---

**注意**: 生成的巡护日志仅供参考，请根据实际情况进行核实和调整。
