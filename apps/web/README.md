# 娄宿三's Blog

个人博客，类二次元游戏官网风格。采用高质量图片+视频的二次元美术风格，以初音未来为主题配色。

## 技术栈

- **框架**：React 19 + TypeScript
- **构建工具**：Vite 8
- **路由**：React Router 7 + vite-plugin-pages（文件即路由）
- **UI 组件库**：Radix UI Themes
- **包管理**：pnpm

## 开发命令

```bash
pnpm run dev      # 启动开发服务器
pnpm run build    # 构建生产版本（先执行 tsc 类型检查）
pnpm run content:build # 校验并生成文章静态内容
pnpm run lint     # 运行 ESLint 检查
pnpm run preview  # 本地预览生产构建
```

## Markdown 写作台

`/#/Editor` 是一个纯前端的笔记写作台，用于日常写笔记与数学作业，不依赖后端，也不改变阅读端的渲染行为。

- **入口**：开发 `http://localhost:5173/#/Editor`，线上 `<域名>/#/Editor`。不加入导航栏，仅作者直达。
- **内容来源**：授权本地笔记文件夹（`showDirectoryPicker`，句柄存 IndexedDB，保存直写回原文件）；或以只读副本打开本站已发布文章，再另存为到本地。
- **数学公式**：手写 `$…$` / `$$…$$` 即时渲染；工具栏公式按钮或 `Ctrl/⌘+Alt+M` 打开 MathLive 可视化精编，内置常用公式片段。
- **草稿**：内容变化后 800ms 写入 IndexedDB，刷新或重开浏览器可恢复；顶栏「发布信息」用于生成合规 frontmatter 并导出 `.md`。
- **快捷键**：`Ctrl/⌘+S` 保存、`Ctrl/⌘+Shift+S` 另存为、`Ctrl/⌘+Alt+M` 插入公式。
- **运行时资源**：Vditor 的 KaTeX、highlight.js、内容主题等由 `pnpm run vendor:sync` 从 `node_modules/vditor/dist` 复制到 `public/vendor/vditor/dist`（构建产物，不提交 Git），`dev` / `build` 都会先执行该脚本。Vditor 内部按 `${cdn}/dist/...` 拼接资源路径，因此复制目标必须保留 `dist` 层级。
- **浏览器要求**：文件直写依赖 File System Access API，仅 Chromium 系（Chrome / Edge）支持；Firefox / Safari 会自动降级为导入 / 下载方式。

## 文章内容

文章源文件位于仓库根目录的 `blog-content/posts/`。执行开发或生产构建前，脚本会：

1. 校验文章 Frontmatter 和正文。
2. 生成 `public/content/index.json` 文章索引。
3. 将正文保持为 Markdown，输出到 `public/content/articles/<slug>.md`。

`public/content/` 是生成目录，不提交到 Git。GitHub Pages 部署后，前端通过 `/content/index.json` 和 `/content/articles/<slug>.md` 获取内容。

## 项目结构

```
src/
├── components/       # 可复用组件
│   ├── Navbar/       # 顶部毛玻璃导航栏
│   └── EasterEggHint/# 彩蛋提示组件
├── pages/            # 页面路由（vite-plugin-pages）
│   ├── index.tsx     # 根路由重定向
│   ├── [...all].tsx  # 404 页面
│   └── Home/         # 首页
├── utils/            # 工具函数
├── App.tsx           # 布局容器
├── AppBootstrap.tsx  # 启动引导
└── main.tsx          # 应用入口

public/               # 静态资源
├── home/             # 首页背景资源
│   ├── home.png      # 背景图源文件
│   ├── home.webp     # 默认背景图（1920×1080，约 101KB）
│   ├── home-vp9.webm # 回退视频（1080p VP9，约 4.2MB，10s 循环）
│   └── hls/          # HLS 视频清单与分片（VP9 fMP4，总约 2.4MB）
└── loading-chicong.webp # Loading 动画图片
```

## 视觉主题

- **主色**：初音绿 (#39C5BB)
- **风格**：玻璃拟态（glass-morphism）+ 半透明毛玻璃效果
- **字体**：SmileySans（得意黑斜体）via JSDMirror（jsDelivr 国内镜像）
- **背景**：高质量图片 + VP9 视频渐进加载

## 特性

- 渐进式背景加载（图片优先，视频就绪后平滑切换）
- 全局 Loading 动画（页面首帧就绪即揭开，不等待字体与视频）
- 响应式设计，移动端适配
- 无障碍支持（`prefers-reduced-motion` 降级、键盘导航）
- GitHub Pages 部署友好（Hash 路由）

## CDN 与 HLS 复用说明

### 1) 静态资源 CDN 加速逻辑（免费 jsDelivr GitHub CDN）

本项目使用 **jsDelivr 的 GitHub CDN**（免费、无流量限制）加速静态资源，并通过其国内镜像域名 `cdn.jsdmirror.com` 访问，兼顾国内访问速度。

- **CDN 映射**：`https://cdn.jsdmirror.com/gh/MortisQAQ/personal-blog@master/apps/web/public/<path>` 对应仓库 `MortisQAQ/personal-blog` 的 `master` 分支 `apps/web/public/<path>` 文件。
- **发布方式**：直接把 `apps/web/public/` 推到 `master` 即可，CDN 会自动命中，无需再往仓库根目录同步副本。
- **统一入口**：`src/utils/baseUrl.ts` 的 `resolvePublicAsset(assetPath)`。
  - 开发环境：返回本地 `BASE_URL` 路径，便于本地调试。
  - 生产环境：返回 `https://cdn.jsdmirror.com/gh/MortisQAQ/personal-blog@master/apps/web/public/` 前缀路径。
- **首屏硬编码直链**：`index.html` 中 React 挂载前就需要的资源（favicon、OG 图、预加载背景图、Loading 图）使用了硬编码 CDN 链接，保证 React 挂载前即可命中 CDN。
- **字体独立仓库**：字体托管在另一个仓库 `MortisQAQ/mycdn`（目前只有未子集化的 `.ttf`，约 2.6MB），通过 `https://cdn.jsdmirror.com/gh/MortisQAQ/mycdn@main/SmileySans-Oblique.ttf` 加载。`cdn.jsdelivr.net` 在国内已无加速节点，因此字体同样走 jsdmirror，与图片保持同一个源（复用 `index.html` 里已有的 `preconnect`）。
- **字体缓存策略**：jsdmirror 对 `@分支` 与 `@commit` 一律返回 `Cache-Control: public, max-age=300, stale-while-revalidate=86400`，即 5 分钟新鲜期 + 24 小时 stale-while-revalidate；回访时可直接用缓存字体，首访仍需完整下载约 2.6MB。
- **缓存刷新**：jsDelivr 对 `@master` 分支内容有边缘缓存（默认最长约 12 小时更新）。更新文件后如需立即生效，可调用 jsDelivr Purge API：`https://purge.jsdelivr.net/gh/MortisQAQ/personal-blog@master/apps/web/public/<path>`。

#### ⚠️ CDN 路径同步约束（必须遵守）

生产环境的静态资源**统一走 CDN**，因此 CDN 前缀与实际仓库路径必须严格对应。**只要动了下面任意一项，就必须同步修改下列所有位置，否则线上会静默命中旧资源（表现为：本地 dev 正常、线上图片/视频是旧版本）：**

1. **需要同步的引用位置**
   - `src/utils/baseUrl.ts` → `CDN_BASE_URL`
   - `index.html` → favicon、`og:image`、`twitter:image`、`#global-loading` 的 `<img>`
   - `index.html` → 字体 `preload` 与 `@font-face`（指向另一个仓库 `MortisQAQ/mycdn@main`，迁移字体仓库或分支时这两处都要改）
   - 本文档的「CDN 映射」一节
2. **会触发同步的事件**
   - 移动 / 重命名 `apps/web/public/`（例如再次调整 monorepo 层级）
   - 更换部署分支（当前为 `master`，历史上曾用 `main`）
3. **验证方法**（改完后必须实测，任一项返回非 200 即为未生效）
   - `curl -I "https://cdn.jsdmirror.com/gh/MortisQAQ/personal-blog@master/apps/web/public/home/hls/index.m3u8"`
   - 对照 `dist/` 中同名文件，确认 CDN 返回内容与本地构建产物一致

> 历史教训：应用从仓库根目录迁移到 `apps/web/` 后，CDN 前缀仍停留在 `@main/public/`，导致线上长期加载旧结构下的旧视频与旧图片，而本地 dev 一切正常。

### 2) 首页视频 HLS 播放逻辑

- 首页视频入口在 `src/pages/Home/index.tsx`：
  - HLS 清单：`home/hls/index.m3u8`（VP9 fMP4 切片，总大小约 2.4MB）
  - 回退文件：`home/home-vp9.webm`（1080p VP9，约 4.2MB）
- 播放优先级：
  1. Safari / iOS 等支持原生 HLS：`video.canPlayType('application/vnd.apple.mpegurl')`
  2. 其他现代浏览器：使用 `hls.js`（MSE）加载 `.m3u8`
  3. HLS 不可用或发生 fatal error：回退到 `home-vp9.webm`
- 兼容性备注：iOS Safari 不支持 VP9 解码（HLS 与 WebM 均不支持），会停留在默认背景图 `home.webp`，属预期降级。

### 3) 分片资源约定

- `public/home/hls/` 必须随仓库部署（含 `index.m3u8`、`init.mp4`、`segment_*.m4s`）。
- 当前切片为 2s 一段、VP9 fMP4 格式，单片约 470KB，总量约 2.4MB。
- 从源视频重新生成 HLS（在 `public/home/hls/` 目录下执行）：

```bash
ffmpeg -y -i ../home-vp9.webm -c:v libvpx-vp9 -crf 30 -b:v 0 -row-mt 1 \
  -tile-columns 4 -cpu-used 4 -threads 8 -g 48 -keyint_min 48 -sc_threshold 0 -an \
  -f hls -hls_time 2 -hls_playlist_type vod -hls_segment_type fmp4 \
  -hls_fmp4_init_filename init.mp4 -hls_segment_filename "segment_%03d.m4s" \
  -hls_list_size 0 index.m3u8
```

  `-g 48` 对应 23.976fps 下每 2s 一个关键帧，需与源视频帧率匹配。

- 默认背景图重新生成（在 `public/home/` 目录下执行）：

```bash
ffmpeg -y -i home.png -c:v libwebp -quality 90 -preset picture -compression_level 6 home.webp
```

- 更新源视频/背景图后需重新生成产物并提交到仓库，CDN 才会更新。

### 4) 当前性能现象说明

- 当前切片为 2s 一段、单片约 470KB，首片下载与带宽占用已大幅降低。
- DevTools 中"先完整下载首片再起播"与"同一时间只下载一个切片"是 hls.js 的默认行为，属预期现象。
- 若需进一步优化首屏起播时间，优先方向：
  - 缩短切片时长（如 1s）
  - 降低首片码率
  - 使用多码率 HLS（ABR）以适配弱网
