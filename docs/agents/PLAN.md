# AI 上下文工程方案（待评审）

> 状态：**草案，未落地**。评审通过后按第 7 节顺序执行，执行完毕删除本文件。
> 决策基线（已与你确认）：知识文件集中放 `docs/agents/`；`AGENTS.md` 只做索引与总框架；
> `.trae/rules` 按情况保留；四块内容（设计风格 / 代码地图+资源CDN / 路由插件+测试 / 修硬伤+架构拓扑）全做。

---

## 0. 设计原则

| 编号 | 原则 | 落地含义 |
|---|---|---|
| P1 | **能从代码读出来的，不写进上下文** | 不罗列目录树、不复述 API 签名、不抄 CSS 变量值；只写"决策、理由、不变量、位置" |
| P2 | **分层 + 按需加载，不堆砌** | `AGENTS.md` 每次必加载 → 必须短；细节文档只在被链接后读取 |
| P3 | **索引优先于内容** | "公共函数在哪"这类需要搜索成本的信息值得写；"它怎么实现"不值得写 |
| P4 | **单一真源，其余只留指针** | 同一规则只维护一处，避免已经发生的三处漂移 |
| P5 | **能脚本化的规则不写成散文** | 沿用 `check:responsive` / `check:size` 的先例，规则进 CI 而非进记忆 |

### 依据（外部调研结论）

- [Anthropic: Effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)：`CLAUDE.md` 类文件是**裸塞进上下文**的，必须与 glob/grep 的即时检索分开设计。
- [arXiv 2602.11988「Evaluating AGENTS.md」](https://arxiv.org/abs/2602.11988)：静态上下文文件平均**降低**任务成功率，推理成本 **+20%~23%**（步数变多）。→ 结论不是"别写"，而是"**别写代码里已有的东西**"。
- [ACE, ICLR 2026](https://arxiv.org/abs/2510.04618)：**动态**上下文才有 +10.6% 增益 → 支持"短索引 + 按需读取"。
- [AGENTS.md 规范](https://agents.md/) / [Augment 指南](https://www.augmentcode.com/guides/how-to-build-agents-md)：AGENTS.md 已是跨工具通用格式（Claude Code / Codex / Cursor / Copilot / Gemini CLI 原生读取），只写 agent 无法自行发现的内容。

### 明确**不写入**上下文的内容（反向清单）

- `src/index.css` 的 CSS 变量具体值、`siteProfile` 的字段值、`navigationItems` 的条目。
- 各组件的 props 签名、hook 返回值结构、类型定义全文。
- 完整的 `src/` 目录树、每个文件的行数。
- 依赖版本号（`package.json` 是唯一真源）。

上面这些一律只写"**去哪读**"。

---

## 1. 目标结构

```
AGENTS.md                            # 主索引（重写，目标 ≤ 60 行）
CLAUDE.md                            # 新建，仅一行 @AGENTS.md + Claude 专属补充
apps/
└── web/
    ├── AGENTS.md                    # 新建（由 CLAUDE.md 收敛而来，目标 ≤ 50 行）
    ├── CLAUDE.md                    # 改为一行桥接：@AGENTS.md
    ├── README.md                    # 保留：工程手册（CDN / HLS / ffmpeg 命令原文）
    └── .trae/rules/
        ├── responsive-design.md     # 保留为唯一真源（可执行规则）
        └── git-workflow.md          # 保留为唯一真源
blog-content/
└── AGENTS.md                        # 保留不动
docs/agents/                         # 新建：知识库正文
├── README.md                        # 索引：每个文件一行说明 + 何时该读
├── architecture.md                  # monorepo 拓扑、包边界、幽灵包与死代码标注
├── design-system.md                 # 设计风格：视觉决策与不可改项（不写 token 值）
├── code-map.md                      # 公共函数 / hook / 脚本位置索引
├── assets-and-cdn.md                # 资源分布 + CDN 机制（由 apps/web/README 晋升）
├── routing-and-plugins.md           # pages 文件路由约定 + vite 插件原理
└── testing.md                       # 测试分层、门禁顺序、三档视口契约
```

层级对应（渐进式披露）：

- **Tier 0 常驻**：`AGENTS.md`（根 / apps/web / blog-content）。
- **Tier 1 触发**：`.trae/rules/*.md`（Trae 按 glob 命中）。
- **Tier 2 按需**：`docs/agents/*.md`（仅在被 Tier 0/1 链接后读取）。
- **Tier 3 原文**：`apps/web/README.md`、源码本身。

---

## 2. 根 `AGENTS.md` 重写大纲（只做索引）

现有 37 行中，OpenSpec 托管块需处理（见 §5-1），响应式规则需降级为指针。目标结构：

```markdown
# 仓库上下文索引

## 定位
个人博客 monorepo：apps/web（React 19 + Vite 8 站点）、blog-content（Markdown 内容源）、
packages/contracts（OpenAPI → TS 客户端，未接入）。详见 docs/agents/architecture.md

## 环境
Windows；一律中文回答。

## 常用命令
（只列到"能跑起来"的粒度，不展开）
- 站点：`pnpm --dir apps/web dev|build|check`
- 内容：`pnpm --dir apps/web content:build`
- 完整门禁顺序见 docs/agents/testing.md

## 红线（违反即返工）
- 改 apps/web UI 必须三档适配 → 唯一真源 apps/web/.trae/rules/responsive-design.md
- 提交/推送流程 → 唯一真源 apps/web/.trae/rules/git-workflow.md

## 需要时再读
- 架构与包边界 → docs/agents/architecture.md
- 视觉风格与不可改的视觉决策 → docs/agents/design-system.md
- 公共函数/脚本在哪 → docs/agents/code-map.md
- 资源与 CDN（改路径必读） → docs/agents/assets-and-cdn.md
- 路由与 vite 插件 → docs/agents/routing-and-plugins.md
- 测试怎么写、改完跑什么 → docs/agents/testing.md
- 内容写作规范 → blog-content/AGENTS.md
```

要点：**红线只给指针不给正文**，把响应式细则从根文件里摘出去（消除三处重复）。

---

## 3. 桥接策略（AGENTS.md 单一真源）

- 根新建 `CLAUDE.md`，内容仅：`@AGENTS.md` + Claude 专属补充（若有）。
- `apps/web/CLAUDE.md` 同样降级为 `@AGENTS.md`（其正文迁到 `apps/web/AGENTS.md`）。
- `.claude/skills/` 与 `.agents/skills/` 的关系：以 `.agents/skills/` 为源，`skills-lock.json` 补齐未登记项（见 §5-6）。**本轮不引入软链**（Windows 需开发者模式，协作易踩坑），改为在 `docs/agents/README.md` 注明"两处内容需同步"并加守卫（见 §6）。
- `.trae/rules/*.md` 保留在 `.trae`（Trae 的 glob 触发依赖该目录），在 `docs/agents/README.md` 中登记为真源位置。

---

## 4. `docs/agents/` 各文件内容大纲

### 4.1 `architecture.md`

- monorepo 真实拓扑（一句话级）：`apps/web` 独立可构建、`packages/contracts` 为契约包、`blog-content` 为内容源、根 `tests/` 是外部 VRT 生成物。
- **边界与状态标注**（这是代码读不出来的关键信息）：
  - `pnpm-workspace.yaml` 声明 `apps/api` 但目录不存在；根 `package.json` 的 `build:api` 等脚本会失败 → 是「规划中」还是「已废弃」？
  - `packages/contracts` 生成的 `web-client.ts` 当前**无消费方**（apps/web 未依赖）。
  - `tripleuni-frontend-wechat/` 为历史小程序，与本站发布无关。
- 依赖方向约束：apps 不得反向依赖、contracts 不得依赖 apps。
- 内容流水线：`blog-content/posts/**` → `scripts/build-content.mjs` → `apps/web/public/content/` → 部署。

### 4.2 `design-system.md`（不写 token 值，写决策）

内容来源：`apps/web/README.md`「视觉主题」+ `index.css` 里的**决策型注释** + `HomePage*.css` 的布局手法。示例条目：

- 风格定位：类二次元游戏官网（参考《明日方舟》官网的信息层级与电光青交互色），非通用 SaaS 风格。
- 主色语义：主色 `#39C5BB`（初音绿）用于身份识别；交互悬浮/激活专用 `--accent-blue`（电光青）——**该分工不可混用**。
- 字体策略：正文与标题统一 SmileySans 得意黑斜体，走 jsdmirror 独立仓库；不引入第二款展示字体。
- 背景分层：首页为「静态底图 → HLS 视频渐入」的两级策略，弱网/不支持时停在底图（**不是 bug，禁止"修"成空白**）。
- 阅读区底色链：波浪填充 / Hero 溶解渐变终点 / 阅读区背板三者同源，改任一处必须同步。
- 「不可改项」清单：沉浸式无原生滚动条、`overflow-x: clip`、路由级 Hash 等。
- **不含**：具体色值表、`--xxx` 变量列表（代码可读）。

### 4.3 `code-map.md`（索引，不写实现）

按"要找 X → 看 Y"组织，分四组：

1. **跨模块基础设施**（`src/utils/`）：`baseUrl.resolvePublicAsset`（10 处引用）、`contentApi`（文章索引/正文，全 Blog 依赖）、`seo`、`pageReady`（页面就绪信号）、`apiClient`。
2. **领域逻辑**：`Blog/contentUtils.ts`、`Blog/types.ts`、`ArticleList/useArticleIndex`、`ArticleReader/useArticleReader`、`HomePanels/useHomeDescent`、`MusicToggle/useBgmAudio`、`Live2DWidget/loadLive2DWidget`。
3. **编辑器子系统**（`MarkdownEditor/lib` + `hooks`）：`draftStore`（IndexedDB）、`fileAccess`（File System Access）、`fileTree`、`frontmatter`（与 `article-schema.mjs` 口径对齐）、`localImages`、`mathSnippets`、`vditorOptions`。
4. **构建/质量脚本**：`scripts/content/*`、`scripts/quality/*`（含阈值常量位置）、`scripts/vendor/*`。

每组附「**状态标注**」，例如：`markdown-compiler.mjs` 与 `remark-controlled-mdx.mjs` 当前**未被** `build-content.mjs` 调用（仅测试引用），避免被误认为在主链路。

### 4.4 `assets-and-cdn.md`

由 `apps/web/README.md` 的 CDN / HLS 章节**晋升**（原文保留在 README，本文件做要点 + 指针，避免两处维护）：

- CDN 映射：`cdn.jsdmirror.com/gh/<repo>@master/apps/web/public/<path>`。
- **路径同步约束**：改 `public/` 位置或部署分支时，必须同步 `baseUrl.ts` 的 `CDN_BASE_URL`、`index.html` 的首屏直链与字体 `@font-face`、README 的映射说明。
- 首屏硬编码直链 vs 运行时 `resolvePublicAsset` 的分工。
- 字体独立仓库与缓存策略（5 分钟新鲜 + 24h SWR）。
- 验证命令（`curl -I` 检查 HLS 清单返回 200）。
- 常见故障现象："本地 dev 正常、线上是旧资源" → 即路径未同步。

### 4.5 `routing-and-plugins.md`

- `vite-plugin-pages` 约定：`src/pages/` 文件即路由；`main.tsx` 导入 `~react-pages`；`index.tsx` 重定向、`[...all].tsx` 兜底、`Post/[slug].tsx` 动态段。
- **为什么必须 Hash Router**：GitHub Pages 无服务端重写，直连 `/<slug>` 会 404。
- `base` 自动探测逻辑（`vite.config.ts`）：`CNAME` 存在 → `/`；`GITHUB_REPOSITORY` 非 `*.github.io` → `/<repo>/`；`VITE_BASE_URL` 可覆盖。→ 解释"为什么本地引用资源要用 `resolvePublicAsset` 而不是写死绝对路径"。
- 代码分割现状：仅 `Editor/index.tsx` 显式 `lazy()`，其余靠 `App.tsx` 的 `<Suspense>` 兜底。
- 新增页面的步骤（含"需同步补响应式映射表一行"）。

### 4.6 `testing.md`

- **分层策略**（"什么时候写哪种"）：
  - `tests/unit`（Vitest + Testing Library）：纯函数与组件契约 → 如 `localImages`、`frontmatter`、`siteProfile.contract`。
  - `tests/scripts`（`node --test`）：构建脚本与守卫脚本 → `build-content`、`check-responsive`、`check-file-lines`、`markdown-compiler`、`loadLive2DWidget`。
  - `tests/e2e`（Playwright，3 个 project：1440 / 834 / 390）：真实行为契约 → experience / performance / preferences / responsive。
- **门禁顺序**（`pnpm run check`）：`check:size`（500 行上限）→ `check:responsive` → `lint` → `test:unit` → `build`；界面改动追加 `test:e2e`。
- 关键约定：`playwright.config.ts` 强制 `reducedMotion: 'reduce'`；**当前无截图快照**（`__screenshots__/` 不存在、无 spec 调用 `toHaveScreenshot`），故视觉验收依赖根 `tests/` 的外部 VRT 框架。
- 根 `tests/` 说明：外部套件 `pia-vrt-test/unified-e2e` 的**生成产物**（含 trace / 基线 png），非源码，其 spec 文件当前不在仓库中 —— 建议评估是否加入 `.gitignore`。
- 新增测试时的落位判断表。

---

## 5. 硬伤修复清单（具体到可执行）

| # | 问题 | 证据 | 建议处置 |
|---|---|---|---|
| 1 | 根 `AGENTS.md` 指向不存在的 `openspec/AGENTS.md` | [AGENTS.md](file:///d:/projects/playground/blog/AGENTS.md#L6) | 删除 OpenSpec 托管块，或确认后再启用。当前为**每次注入的无效路径** |
| 2 | `apps/web/CLAUDE.md` 指向不存在的 `.tasks/` | [CLAUDE.md](file:///d:/projects/playground/blog/apps/web/CLAUDE.md#L103) | 删除该节（内容由 README + docs/agents 承接） |
| 3 | `CLAUDE.md` 写的 `home.css` 实际是 `HomePage.css` | [CLAUDE.md](file:///d:/projects/playground/blog/apps/web/CLAUDE.md#L76) | 修正；并考虑把"Pages Structure"细节移到 `routing-and-plugins.md` |
| 4 | 幽灵工作区 `apps/api` | [pnpm-workspace.yaml](file:///d:/projects/playground/blog/pnpm-workspace.yaml)、根 [package.json](file:///d:/projects/playground/blog/package.json#L14) | **需你决策**：删除条目，或在 `architecture.md` 标注「规划中」 |
| 5 | `packages/contracts` 生成物无消费方 | `generate-web-client.mjs` 产出的 `web-client.ts` 无 import | 在 `architecture.md` 标注状态 |
| 6 | `skills-lock.json` 漏登记 `project-dossier` | [skills-lock.json](file:///d:/projects/playground/blog/skills-lock.json) 只有 2 项，`.agents/skills/` 有 3 个 | 补齐锁文件，或移除本地 skill |
| 7 | 根目录无 `CLAUDE.md` 桥接 | Glob 仅找到 `apps/web/CLAUDE.md` | 新建一行桥接（§3） |
| 8 | 响应式规则三处重复且已漂移 | 根 AGENTS.md / CLAUDE.md / `.trae/rules` | 收敛为 `.trae/rules` 单一真源，其余降级为指针 |
| 9 | `markdown-compiler.mjs` 状态不明 | 未被 `build-content.mjs` 调用，仅测试引用 | 在 `code-map.md` 标注；若确定废弃则删 |
| 10 | 根 `tests/` 为外部生成物 | `.run-manifest.json` 记录 `managedBy: pia-vrt-test/unified-e2e` | 评估加入 `.gitignore`（**需你决策**，涉及历史产物清理） |

---

## 6. 防漂移机制

延续本仓库已有的"可执行守卫"传统（`check:responsive` / `check:size`）：

1. **`check:docs`（新增，建议）**：校验 Tier0/Tier1 文档中出现的所有仓库内路径与命令真实存在。
   - 能一次性防住 §5-1 / §5-2 / §5-3 这类悬空引用。
   - 实现路线：复用 `scripts/quality/` 现有风格，扫描 `AGENTS.md`、`docs/agents/**`、`.trae/rules/**` 里的 markdown 链接与反引号路径，逐个 `existsSync`。
2. **同步守卫**：校验 `.agents/skills/<x>/SKILL.md` 与 `.claude/skills/<x>/SKILL.md` 内容一致（在未采用软链的前提下）。
3. **纳入门禁**：把 `check:docs` 接进 `pnpm run check` 与 `check:responsive` 同级。
4. **登记纪律写进 `docs/agents/README.md`**：新增组件/页面/规则时，必须同步对应索引文件（与现有「响应式行为映射表补一行」的纪律同构）。

---

## 7. 落地顺序与验证

| 步骤 | 内容 | 验证 |
|---|---|---|
| 1 | 修硬伤 §5-1/2/3/7（纯文档，零风险） | 手动核对链接；后续由 `check:docs` 兜底 |
| 2 | 建 `docs/agents/` 骨架 + `README.md` 索引 | 索引里每个链接可点 |
| 3 | 填 `architecture.md`、`assets-and-cdn.md`（依据最充分） | 与 `README.md`、`pnpm-workspace.yaml` 交叉核对 |
| 4 | 填 `code-map.md`、`routing-and-plugins.md`、`testing.md` | 逐个 `existsSync` 校验路径 |
| 5 | 填 `design-system.md` | 与 `index.css` 注释、HomePanel 样式手法核对 |
| 6 | 重写根 `AGENTS.md` 为索引；`apps/web/CLAUDE.md` → `apps/web/AGENTS.md` + 一行桥接 | 根文件 ≤ 60 行且无重复正文 |
| 7 | 新增 `check:docs` 并接入 `check` | `pnpm --dir apps/web run check` 通过 |

**回归要求**：本方案只动文档与守卫脚本，不触碰 `apps/web/src/**`，故不触发响应式三档适配流程；但步骤 7 若新增脚本，需补 `tests/scripts/check-docs.test.mjs`。

---

## 8. 待你决策的开放问题

1. **`apps/api`**：删除幽灵条目，还是保留并标注「规划中」？
2. **`packages/contracts`**：短期会接入吗？决定它是"死代码清理"还是"待接入"。
3. **根 `tests/`**：是否加 `.gitignore`（会涉及历史产物清理，属破坏性操作，需单独授权）。
4. **OpenSpec**：这个仓库到底用不用？决定 §5-1 是删除还是修复。
5. **`check:docs`**：是否本轮就做，还是先只写文档、守卫留到下一轮。

---

## 9. 本轮已落地（目录语义纠正）

按「A 语义纠正」执行，行为零变化：

| 改动 | 内容 |
|---|---|
| 页面私有件下沉 | `HomePanels/HeroPanel/`（含 `HeroRail`）+ `useHomeDescent.ts` → `src/pages/Home/`；`HomePanels/IntroPanel/` → `src/pages/Information/`；`HomePanels/DetailPanel/` → `src/pages/Portfolio/`；空目录 `components/HomePanels/` 已删除 |
| 配置目录收敛 | `src/app/navigation/navigationConfig.ts` → `src/config/navigationConfig.ts`，删除 `src/app/` |
| 删除死代码 | `src/assets/`（`hero.png` / `react.svg` / `vite.svg` 全仓零引用）、空的 `src/hooks/` |
| CSS 公约落地 | `DetailPanel` 的 `DetailPanelLayout.css` + `DetailPanelCard.css` + 2 行间接层 `DetailPanel.css` 合并为单个 `DetailPanel.css`（538 行） |
| 行数守卫调整 | `check-file-lines.mjs` 不再约束样式表（移除 `.css/.scss/.styl`），仅约束脚本与组件代码 |
| 守卫与规范同步 | `check-responsive.mjs` 与 `check-responsive.test.mjs` 的 1200px 遗留白名单路径、`responsive-design.md` 的 4 处路径引用 |
| 顺带修正 | `apps/web/CLAUDE.md` 里 `home.css` → `HomePage.css`（原有漂移） |

**归属判据（本轮确立）**：去掉页面背景后能自解释的组件 → `components/`；只在某页面视觉/语义下成立的 → `pages/<Page>/`。
**CSS 停放策略**：与组件同目录，一个组件最多一个 CSS 文件；跨组件共享样式才单独成文件（如 `blog-shared.css`）；样式文件不设行数上限。

**验证**：`pnpm run check` 全绿（size / responsive / lint / 39 脚本测试 / 66 单测 / build）；`pnpm run test:e2e -- blog-responsive` 三档（1440 / 834 / 390）4 passed。

## 10. 记录：`PanelPageLayout` 是旧版「一页三面板」设计的残留（本轮未处理）

核实属实，但它已泄漏成跨组件隐式契约，本轮只记录。

**证据**

1. **面板切换动画永不执行**：`.home-panel` 带 `opacity: 0` + 860ms `transition`，靠 `.home-panel--current` 点亮；但三个页面是独立路由，同一时刻 DOM 里只有一个 panel，过渡不会触发。
2. **`.home-panel--current` 退化为必须手写的魔法开关**：漏写即白屏，且被 3 处 CSS 当祖先条件使用（恒为真 = 死条件）：
   - `IntroPanel.css`：`--current` 下背景 `scale(1.02)` → `scale(1)`
   - `IntroPanel.css`：`--current` 下卡片才 `opacity: 1`（**关键**）
   - `DetailPanel.css`：`--current` 下仅把 card 动画 delay 由 0.2s 改成 0.4s
3. **跨页面硬编码**：`PANEL_TITLES` 硬编码三项，`currentIndex` 由页面手写魔法数字（Information=1 / Portfolio=2）；而 `src/config/navigationConfig.ts` 已有 `navigationItems`（含 `label`/`shortLabel`），同一信息存了两份。
4. **命名谎言**：`.home-container` / `.home-panels` / `.home-panel` 全用在 Information / Portfolio 上，与首页无关。
5. **`ScrollIndicator` 提示不存在的能力**：`visible={currentIndex < 2}` 让 Information 显示「下滑」，但 `.home-container` 是 `height: 100vh; overflow: hidden`，没有可滚动内容。
6. **尺寸单位隐患**：`width: 100vw; height: 100vh`，移动端地址栏伸缩会裁切；仓库别处已用 `100dvh`，此处未登记例外。
7. **chunk 级隐式耦合**：构建产物中 `PanelPageLayout.css` 是独立 chunk，而 Home 的 `HeroPanel` 也用了 `.home-panel` 类名 → 其样式是否生效取决于「另一个 chunk 是否已加载」，属路由相关的隐性行为。

**建议的下一轮方案**

1. 删 `PanelPageLayout` 组件及其 CSS 中的面板切换机制（`opacity` / `transition` / `--current`）。
2. `SideIndicator` 改为从 `navigationConfig.navigationItems` 派生 `currentIndex` / `total` / `titles`，消灭 `PANEL_TITLES` 与魔法数字。
3. 各页面自写 `<main>`（或使用语义化的 `PageShell`），类名前缀 `home-*` 改为页面语义。
4. `100vw / 100vh` → `100% / 100dvh`。
5. 3 处 `.home-panel--current .x` 化简为 `.x`；删除 `HeroPanel` 的 `panelClass` prop。

**前置条件**：Portfolio 在 `tests/e2e/` 中零覆盖，动手前应先补三档渲染与卡片切换断言。
