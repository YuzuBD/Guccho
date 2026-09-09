# Guccho 前端重构 - Nirnor 风格（更新版）

## 概述
基于 https://nirnor.jp/ 的极简主义设计理念，对 Guccho 项目进行了全面的前端重构。

## 设计理念

### 核心特点
- **真正的极简**: 去除一切非必要元素
- **留白空间**: 大量使用空白区域，提升视觉舒适度
- **优雅排版**: 精细的字体选择和间距控制
- **平滑动画**: 细腻的过渡效果和交互
- **纯粹配色**: 纯黑白配色方案

## 主要更改

### 1. 首页 (`src/pages/index.vue`)
**完全重新设计为超极简风格**:
- 中央旋转3D立方体动画（线框风格）
- 鼠标跟随的3D视差效果
- 单一入口链接
- 去除所有介绍文字和多余元素
- 纯粹的视觉体验

特点：
- 全屏居中布局
- 响应式立方体大小
- 流畅的动画效果
- 移动端优化

### 2. 用户页面重构

#### 用户头部 (`src/components/userpage/heading.vue`)
- 极简的网格布局
- 大型头像（方形，简洁边框）
- 超大号用户名（轻字重）
- 简化的徽章展示
- 极简操作按钮

#### 统计信息 (`src/components/userpage/statistics.vue`)
- 网格式统计卡片
- 轻字重数字显示
- 简洁的标签和描述
- 等宽数字字体
- 统一的间距系统

### 3. 谱面页面样式 (`src/assets/styles/beatmap-minimal.scss`)
新增专用样式文件：
- 极简的谱面头部
- 简化的难度标签
- 网格式信息展示
- 极简排行榜表格
- 响应式卡片布局

### 4. 样式系统 (`src/assets/styles/main.scss`)
完全重写：
- Inter 字体作为主字体
- 纯黑白配色
- 新的排版层次
- 极简按钮样式
- 滚动显示动画
- 统一的容器和间距

### 5. 主题配置 (`daisyui.themes.ts`)
- 完全去除彩色元素
- 浅色：`#FFFFFF` 背景
- 深色：`#0A0A0A` 背景
- 最小化边框圆角
- 简化所有组件样式

### 6. 导航系统
- 玻璃态导航栏
- 极简菜单项
- 统一的悬停效果
- 简化的下拉菜单

### 7. 页脚
- 轻量级设计
- 简洁的链接布局
- 统一的排版

## 设计细节

### 首页动画
```css
立方体：200x200px（桌面），150x150px（移动端）
旋转动画：20秒完整周期
鼠标交互：3D视差效果
透视距离：1000px
边框：细线框，透明度20%
```

### 色彩系统
```
浅色模式：
- 主背景：#FFFFFF
- 主文字：#000000
- 次级背景：#FAFAFA, #F5F5F5
- 次级文字：#666666, #999999
- 边框：rgba(0,0,0,0.05-0.1)

深色模式：
- 主背景：#0A0A0A
- 主文字：#FFFFFF
- 次级背景：#1A1A1A, #2A2A2A
- 次级文字：#999999, #666666
- 边框：rgba(255,255,255,0.05-0.1)
```

### 排版系统
```
字体：Inter (300/400/500/600/700)

标题：
- H1: 5xl-8xl, font-weight: 300
- H2: 3xl-6xl, font-weight: 300
- H3: 2xl-4xl, font-weight: 400

正文：
- 基础：base-lg, line-height: 1.8
- 小字：sm-xs, line-height: 1.6

字母间距：
- 标题：-0.02em (tighter)
- 导航：0.1-0.15em (wide/wider)
- 正文：0.01em (wide)
```

### 间距系统
```
Section 间距：
- py-20 (移动端)
- py-32 (平板)
- py-40 (桌面)

容器：
- max-w-7xl
- px-6 (移动端)
- px-12 (平板)
- px-16 (桌面)

元素间距：
- 小：gap-2/4
- 中：gap-8/12
- 大：gap-16/20
```

### 动画时序
```
快速交互：0.2s
标准过渡：0.3s
页面元素：0.8s
页面加载：1.2s

缓动函数：
- ease-out (默认)
- cubic-bezier(0.4, 0, 0.2, 1)
```

## 文件结构

```
src/
├── assets/styles/
│   ├── main.scss                    (主样式 - 完全重写)
│   └── beatmap-minimal.scss         (谱面页面样式 - 新增)
├── components/
│   ├── app/
│   │   ├── nav/
│   │   │   ├── index.vue           (导航 - 极简化)
│   │   │   ├── brand.vue           (品牌 - 简化)
│   │   │   └── items.vue           (菜单项 - 简化)
│   │   └── footer.vue              (页脚 - 极简化)
│   └── userpage/
│       ├── heading.vue             (用户头部 - 重构)
│       └── statistics.vue          (统计信息 - 重构)
├── pages/
│   ├── index.vue                    (首页 - 完全重写)
│   └── beatmapset/[id].vue         (谱面页 - 待进一步优化)
├── app.vue                          (主应用 - 简化)
├── daisyui.themes.ts                (主题 - 极简化)
└── tailwind.config.ts               (Tailwind - 更新)
```

## 技术实现

### 3D立方体动画
```vue
<script setup>
const mouseX = ref(0)
const mouseY = ref(0)

const handleMouseMove = (e: MouseEvent) => {
  mouseX.value = (e.clientX / window.innerWidth - 0.5) * 20
  mouseY.value = (e.clientY / window.innerHeight - 0.5) * 20
}
</script>

<template>
  <div 
    class="cube" 
    :style="{
      transform: `rotateX(${mouseY}deg) rotateY(${mouseX}deg)`
    }"
  >
    <!-- 6 个立方体面 -->
  </div>
</template>
```

### 滚动显示动画
```javascript
onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed')
      }
    })
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  })

  document.querySelectorAll('.scroll-reveal').forEach((el) => {
    observer.observe(el)
  })
})
```

## 使用指南

### 开发
```bash
cd Guccho
pnpm install
pnpm run dev
```

### 构建
```bash
pnpm run build
pnpm run start:prod
```

### 代码检查
```bash
pnpm run lint
pnpm run typecheck
```

## 优化建议

### 短期优化
1. ✅ 首页超极简设计
2. ✅ 用户页面重构
3. ✅ 统计信息极简化
4. 🔄 谱面页面完整重构
5. 🔄 排行榜页面极简化
6. 🔄 成绩详情页简化

### 中期优化
1. 添加更多微交互动画
2. 优化移动端体验
3. 实现平滑页面过渡
4. 添加骨架屏加载
5. 优化图片懒加载
6. 添加深色模式切换动画

### 长期优化
1. 性能优化（虚拟滚动、代码分割）
2. 无障碍性改进
3. SEO 优化
4. PWA 支持
5. 国际化完善
6. 自定义主题系统

## 设计原则

1. **Less is More**: 每个元素都必须有明确的目的
2. **空间即设计**: 留白是设计的一部分
3. **一致性**: 保持统一的视觉语言
4. **可读性**: 清晰的层次结构
5. **响应式**: 适配所有设备尺寸
6. **性能**: 流畅的动画和交互
7. **可访问性**: 支持键盘导航和屏幕阅读器

## 浏览器支持

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- 移动端浏览器（iOS Safari 14+, Chrome Android）

## 技术栈

- Nuxt 3.15.4
- Vue 3 (Composition API)
- Tailwind CSS
- DaisyUI (高度定制)
- TypeScript
- SCSS

## 参考资源

- [nirnor.jp](https://nirnor.jp/) - 主要设计灵感
- [Swiss Design](https://www.swissdesignawards.ch/) - 瑞士设计美学
- [Brutalist Websites](https://brutalistwebsites.com/) - 简约主义网站
- [Minimal Gallery](https://minimal.gallery/) - 极简设计作品集

## 更新日志

### v2.0.0 (当前)
- 首页完全重写为3D立方体动画
- 用户页面极简化重构
- 统计信息组件重写
- 新增谱面页面专用样式
- 导航系统简化
- 主题系统纯黑白化

### v1.0.0
- 初始极简化设计
- 基础组件重构
- 主题配置更新
