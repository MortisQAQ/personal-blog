# 前端目录与分层规范（apps/web/src）

> 本文是**规范**，不是方案记录。改目录、加组件、抽 hook 之前先读它。
> 适用范围：`apps/web/src/**`。配套守卫：`pnpm run check:responsive`、`pnpm run check:size`。

## 1. 一句话原则

**就近归属（colocation）**：经常一起改的东西放在一起；能在本地自解释的，不要往上提。

---

## 2. 组件归属

| 条件 | 去处 |
|---|---|
| 去掉页面背景后仍能自解释（通用 UI、挂件、站点级） | `src/components/` |
| 只在某个页面的视觉 / 语义下成立 | `src/pages/<Page>/components/` |

现有落点示例：

- `src/components/`：`Navbar`、`MusicToggle`、`Live2DWidget`、`ScrollIndicator`、`EasterEggHint`、`Icons`、`Blog`、`MarkdownEditor`、`PanelPageLayout`
- `src/pages/Home/components/`：`HeroPanel`（含 `HeroQuote`、`HeroRail`、`useHeroEntrance`）、`HomePageWave`

## 3. 页面目录槽位

按体量分级，**不建空目录、不追求形式统一**：

| 体量 | 判据 | 槽位 |
|---|---|---|
| 大页面 | 页面私有组件 ≥2，或入口 >100 行 | `components/` + `hooks/` + `styles/`（`utils/` 按需） |
| 中页面 | 有 1 个页面私有组件 | 只建 `components/` |
| 薄页面 | 入口 ≤20 行且无私有件 | **不加任何子目录** |

当前形态：

```text
pages/
├── Home/                     # 大页面
│   ├── index.tsx             # 只做编排：读 hook、拼 JSX
│   ├── components/
│   │   ├── HeroPanel/        # 组件与其私有 hook、样式同目录
│   │   └── HomePageWave.tsx
│   ├── hooks/                # 页面级 hook（被入口或本页多个组件使用）
│   ├── utils/                # 页面级纯函数
│   └── styles/               # 仅页面级样式
├── Information/              # 中页面
│   ├── index.tsx
│   └── components/IntroPanel/
├── Portfolio/                # 大页面
│   ├── index.tsx             # 调用页面 controller，组合共享布局与场景
│   ├── components/           # PortfolioStage 编排目录/卡组/详情，Artwork 三处复用
│   │   ├── PortfolioStage/
│   │   ├── ProjectDirectory/
│   │   ├── ProjectDeck/
│   │   ├── ProjectDetails/
│   │   └── ProjectArtwork/
│   ├── hooks/usePortfolioController.ts
│   ├── utils/                # projects 与键盘判定纯函数
│   └── styles/PortfolioPage.css
├── Post/[slug].tsx           # 薄页面，无子目录
├── Editor/index.tsx          # 薄页面，无子目录
├── index.tsx                 # 根重定向
└── [...all].tsx              # 404 兜底
```

`index.tsx` 的职责边界：**只做编排**。出现成段副作用或派生计算时应下沉到 `hooks/` 或 `utils/`。

`vite-plugin-pages` 的扫描配置必须排除 `components/`、`hooks/`、`utils/`、`styles/`、测试文件和声明文件，不能把页面私有模块注册为路由。`tests/unit/routes.test.ts` 直接验证真实 Vite 配置只生成页面入口；目录就近归属不是将模块全部搬回全局目录的理由。

## 4. 样式停放（三级）

| 层级 | 位置 | 判据 |
|---|---|---|
| 组件级 | 与组件同目录 | 选择器挂在某个组件根节点上 |
| 页面级 | `pages/<Page>/styles/` | 选择器挂在页面根容器上、被本页 ≥2 个组件共享 |
| 跨页面共享 | `src/components/**` | 被 ≥2 个页面使用 |

约定：

- **一个组件最多一个 CSS 文件**；样式表**不设行数上限**（`check:size` 只约束脚本与组件代码）。
- 组件级样式**不要**放进页面 `styles/`。
- 移动 CSS 目录前先确认文件内没有相对 `url()` / `@import`（当前 `pages/**/*.css` 均无）。

## 5. ViewModel：不一定是 hook

React 的「ViewModel」由两类东西共同承担，按**是否调用 Hook** 二分：

| 类型 | 判据 | 位置 |
|---|---|---|
| **纯逻辑**（Presenter / Selector） | 不调用任何 Hook 也能算出结果：格式化、过滤、派生、判定 | 跨页 → `src/utils/`；页内 → `pages/<Page>/utils/` |
| **有状态 / 副作用** | 需要 `useState` / `useEffect` / `useRef` / 订阅 / 定时器 / rAF | `pages/<Page>/hooks/`；组件私有则与组件同目录 |

官方判据（[react.dev](https://react.dev/learn/reusing-logic-with-custom-hooks)）：

> 如果你的函数不调用任何 Hook，就不要加 `use` 前缀，写成普通函数。

```js
// 🔴 名为 hook，实则纯函数
function useSorted(items) {
  return items.slice().sort();
}

// ✅ 纯函数就该是普通函数
function getSorted(items) {
  return items.slice().sort();
}
```

仓库内的正例：[contentUtils.ts](file:///d:/projects/playground/blog/apps/web/src/components/Blog/contentUtils.ts) 的 `filterArticles` / `articleSearchText` / `formatNumber` 都是纯函数，没有包装成 hook。

补充：react.dev 还建议——当多个 Effect 需要大量协调时，把逻辑整个移出 Effect / Hook，让它成为「外部系统」（如 GSAP 时间线、鼠标跟随循环）。`useHomeDescent` 即此模式。跨页面的运行时信号（如 `src/utils/pageReady.ts` 的页面就绪事件与 `usePageReady`）同属外部系统，允许放在 `src/utils/`，不承载 ViewModel 派生逻辑。

## 6. 值不值得抽（防过早抽象）

满足**任一条**才抽；都不满足就留在原地：

1. 有分支或边界条件**值得单测**；
2. 被 **≥2 处**使用；
3. 抽出来能让调用点**显著变短或变清晰**。

反例：只有一行、只被用一次的阈值算式（如 `scrollY < innerHeight * 0.35`）不要单独成文件，在 hook 内用具名常量表达即可。

## 7. 迁移时同步更新（易漏清单）

改动页面目录或组件路径后，必须同步：

1. `apps/web/.trae/rules/responsive-design.md` 的「组件响应式行为映射」表路径；
2. `apps/web/scripts/quality/check-responsive.mjs` 的 `LEGACY_BREAKPOINTS` 白名单路径；
3. `apps/web/tests/scripts/check-responsive.test.mjs` 的夹具路径；
4. `apps/web/tests/unit/**` 中直接 import 组件的用例；
5. 页面入口的相对 import 与 CSS `import`。

改完跑：

```bash
cd apps/web
pnpm run check
pnpm exec playwright test blog-responsive.spec.ts
```
