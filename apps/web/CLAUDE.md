<!-- OPENSPEC:START -->
# OpenSpec Instructions
Always respond in Chinese.
These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm run dev      # Start development server
pnpm run build    # Build for production (runs tsc then vite build)
pnpm run lint     # Run ESLint
pnpm run preview  # Preview production build locally
```

## 响应式设计（强制）

任何 Web 端 UI 改动都必须同时完成移动端适配，规范见 [.trae/rules/responsive-design.md](.trae/rules/responsive-design.md)（含断点口径、组件三档行为映射、反模式清单）。文字字号、缩放补偿、对比和容纳空间必须遵守 [设计可读性规范](../../docs/agents/design-system.md)，不能以构图为由把主要内容缩成微字。

- **断点**：只允许 `768 / 1024 / 1440px`（与 `playwright.config.ts` 的 1440 / 834 / 390 三档视口对齐）。编辑器 `1180px` 是已登记的历史遗留，禁止扩散；作品页旧 `1200px` 已退役。
- **验证**：

  ```bash
  pnpm run check:responsive                            # 静态守卫：断点 / px 字号 / 固定宽度 / 内联尺寸
  pnpm exec playwright test blog-responsive.spec.ts    # 三档视口契约（1440 / 834 / 390）
  ```

  Web 验证以 Playwright E2E 为主，不默认做人工视觉验收或批量读截图。**验收先读运行产物 `output/e2e-report/summary.md`**（结论、失败项、动作时间线、截图索引），不自己打开页面；覆盖义务与产物契约见 [docs/agents/e2e-testing.md](../../docs/agents/e2e-testing.md)，测试筛选、变更复验与子代理结束条件见 [docs/agents/verification-workflow.md](../../docs/agents/verification-workflow.md)。

- `check:responsive` 已接入 `pnpm run check`，违反规则会直接失败。
- 新增组件或页面时，在规范文档的「组件响应式行为映射」表补一行；若引入新的布局结构（多栏 / 浮层 / 抽屉），在 `tests/e2e/blog-responsive.spec.ts` 的 `响应式契约` 中补对应断言。

## Architecture

This is a personal blog built with React 19 + Vite 8 + TypeScript. Key architectural decisions:

### Routing
- Uses `vite-plugin-pages` for file-based routing in `src/pages/`
- Hash router (`createHashRouter`) for GitHub Pages compatibility (no server-side URL rewriting)
- Route files: `index.tsx` (redirects to `/Home`), `Home/index.tsx`, `[...all].tsx` (404 catch-all)
- `App.tsx` is a layout wrapper with `<Outlet />`

### UI Framework
- Radix UI Themes for component library (dark theme, teal accent, slate gray)
- Custom CSS files alongside components (e.g., `Navbar.css`, `HomePage.css`)
- Global loading screen defined in `index.html`; `AppBootstrap.tsx` removes it once the current route page signals first paint via `usePageReady`. 字体与首屏视频不再阻塞 Loading：两者已提权并行加载，页面可见后各自渐显接管。

### Asset Handling
- Static assets in `public/` directory (favicon, images, video)
- `src/utils/baseUrl.ts` provides `resolvePublicAsset()` for proper path resolution
- Base URL auto-detected from `GITHUB_REPOSITORY` env var for GitHub Pages deployment

### Pages Structure
页面按体量分级，页面私有组件 / hook / 页面级样式分别放 `components/`、`hooks/`、`styles/`（薄页面不加子目录）。
完整槽位规范与归属判据见 [docs/agents/frontend-structure.md](../../docs/agents/frontend-structure.md)。

To add a new page: create `src/pages/NewPage/index.tsx` and export a default component. 路由页面根组件必须调用 `usePageReady()`（`src/utils/pageReady.ts`），否则首屏 Loading 只能等兜底超时才撤除。

## Project Overview

个人博客，类二次元游戏官网风格。采用高质量图片+视频的二次元美术风格，以初音未来为主题配色（主色 #39C5BB）。

### 主要特性

- **渐进式背景加载**：首页采用图片优先、视频就绪后平滑切换的策略，支持弱网降级
- **全局 Loading 动画**："少女吃葱中"风格，使用自定义字体 SmileySans（via JSDMirror，jsDelivr 国内镜像）；页面首帧就绪即揭开，不等待字体与视频
- **玻璃拟态导航栏**：基于 Radix UI Themes，半透明背景配合毛玻璃效果
- **打字机文字动画**：响应式自动换行，支持 `prefers-reduced-motion` 降级
- **无障碍支持**：键盘导航、屏幕阅读器友好

### 组件清单

| 组件 | 路径 | 说明 |
|------|------|------|
| Navbar | `src/components/Navbar/` | 顶部毛玻璃导航栏 |
| EasterEggHint | `src/components/EasterEggHint/` | 彩蛋提示组件（初音绿色号冷知识） |
| AppBootstrap | `src/AppBootstrap.tsx` | 应用启动引导，等待页面就绪信号后移除全局 Loading |

### 开发记录

详细的研究记录和开发决策位于 `.tasks/` 文件夹：

- `vite-pages-router-research.md` - 路由基础设施与首页背景实现
- `loading-animation-research.md` - 全局 Loading 动画方案
- `radix-glass-theme-research.md` - Radix UI Themes 接入与组件重构