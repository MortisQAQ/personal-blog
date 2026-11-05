# webpack：从模块化背景到打包原理

> 本文以 webpack 5 为主，采用常见的 loader + plugin 配置。目标是理解“为什么要打包、配置在做什么、产物如何运行”，而不是背配置项。
>
> 前置知识：知道文件路径、npm 的基本用途，以及 `import` / `export`。模块规范的来龙去脉可先读 [模块化的演进](../03-javascript-typescript/模块化/1-模块化的演进.md)。

## 一、webpack 是什么，为什么需要它

**webpack 是一个静态模块打包工具**：从一个或多个入口文件出发，分析代码依赖，把模块及其关联资源组织成浏览器或其他目标环境可使用的产物。

“静态”指主要在**构建时分析依赖**，并不意味着程序不能使用动态导入；“打包”也不等于把所有文件拼成一个文件，webpack 可以输出多个 JS 文件、CSS 文件和图片等资源。

例如业务源码中有：

```js
import { add } from './math.js'
import './style.css'

console.log(add(1, 2))
```

webpack 可以把 JS 依赖组织起来，配合 loader 处理 CSS，再生成供网页引用的文件。开发者负责按模块编写源码，构建工具负责把源码整理成适合交付的形式。

### 1. 历史背景：模块规范解决了什么，又留下了什么

结合模块化的演进，可以把背景分成三个阶段：

| 阶段 | 已解决的问题 | 仍然存在的问题 |
|---|---|---|
| `<script>`、命名空间、IIFE | 能拆文件，IIFE 能隔离内部变量 | 依赖顺序靠人维护，缺少统一加载机制 |
| CommonJS、AMD / CMD | 明确导入导出，提供模块组织与加载方案 | CommonJS 的 `require` 不能直接交给普通浏览器；网络加载大量小模块也需要优化 |
| ESM | 语言原生模块语法，支持静态分析 | 不自动提供压缩、资源转换、按项目需求拆包和目标环境适配 |

**模块规范回答“模块怎么声明和关联”，打包工具回答“这些模块如何变成可交付的资源”。** 两者不是互相替代的关系。

webpack 由 Tobias Koppers 在 2012 年左右创建，其早期动机与 Web 应用优化、**代码分割（code splitting）**有关，而不只是把文件合并。随着应用变大，一次下载所有代码并不划算：首屏只需要首页，编辑器、图表等功能可以等用户需要时再加载。历史来源见 [GitHub 对作者的访谈](https://github.com/readme/podcast/masters-thesis-to-webpack)。

所以不要把 webpack 的起源解释成“为了解决 ES6 的 import”：它出现时 ES2015 尚未成为正式标准。

### 2. 浏览器已经支持 ESM，为什么还要构建工具

浏览器原生 ESM 能加载 JS 模块，但实际项目还经常需要：

- **资源转换**：处理 TypeScript、JSX、Sass 等源码。
- **依赖解析**：把 npm 包及其依赖组织起来；浏览器不会默认按 Node.js 的规则查找 `node_modules`。
- **交付优化**：压缩、删除未使用代码、拆分公共依赖、按需加载。
- **资源管理**：生成带内容哈希的文件名，并更新 HTML 中的引用。
- **开发体验**：开发服务器、源码映射、热更新。

原生 ESM 项目不一定需要打包。是否构建、如何构建，应取决于项目需求，而不是“没有 webpack 就不能运行 JavaScript”。

## 二、先认清几个核心概念

| 概念 | 含义 | 例子 |
|---|---|---|
| entry（入口） | 从哪个文件开始分析依赖 | `./src/index.js` |
| module（模块） | 依赖图中的处理单元 | JS 文件、经过规则处理的 CSS 文件 |
| loader | 对模块内容进行转换 | 把 Sass 转成 CSS、把 JSX 转成 JS |
| plugin（插件） | 在构建生命周期中扩展能力 | 生成 HTML、提取 CSS |
| chunk（代码块） | webpack 对模块进行组织、拆分后的分组 | 主入口 chunk、懒加载 chunk |
| asset（资源产物） | 最终生成的文件 | JS、CSS、图片、源码映射文件 |
| output（输出） | 指定产物位置、名称等 | `dist/main.js` |
| mode（模式） | 选择开发或生产的默认配置组合 | `development`、`production` |

**module → chunk → asset 是三个不同层次。** 一个 chunk 可以包含多个模块，也可以关联 JS、CSS 等多个产物，不能简单说“一个模块就是一个打包文件”。bundle 常泛指打包后的文件或代码包，不必把它当作严格的一对一术语。

## 三、跑通第一个项目

下面的命令在一个独立的练习目录中执行，不是在已有业务项目中覆盖配置。先安装当前工具链支持的 Node.js LTS 版本，再确认 `node -v` 和 `npm -v` 可用。

### 1. 初始化与安装

```powershell
mkdir webpack-demo
cd webpack-demo
npm init -y
npm install --save-dev webpack@5 webpack-cli webpack-dev-server html-webpack-plugin css-loader style-loader
```

- `webpack`：核心打包能力。
- `webpack-cli`：通过命令行调用 webpack。
- `webpack-dev-server`：提供本地开发服务器。
- 其余包负责 HTML 生成和 CSS 处理，后面解释。
- `--save-dev`：记入开发依赖。构建工具通常不需要跟随网页在用户浏览器中安装。

建立以下文件：

```text
webpack-demo/
├── package.json
├── webpack.config.cjs
└── src/
    ├── index.html
    ├── index.js
    ├── math.js
    └── style.css
```

使用 `.cjs` 配置文件，是为了明确让 Node.js 按 CommonJS 解析它，不受 `package.json` 的 `"type": "module"` 影响。**配置文件的模块格式与业务源码的模块格式可以不同。**

### 2. 编写源码

`src/math.js`：

```js
export function add(a, b) {
  return a + b
}
```

`src/index.js`：

```js
import { add } from './math.js'
import './style.css'

const title = document.createElement('h1')
title.textContent = `总计：${add(1, 2)}`
document.body.appendChild(title)
```

`src/style.css`：

```css
body {
  font-family: sans-serif;
  margin: 2rem;
}

h1 {
  color: #2563eb;
}
```

`src/index.html`：

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>webpack 入门</title>
  </head>
  <body></body>
</html>
```

这里故意不手写 `<script>`：插件会把构建后的 JS 引用插进去。

### 3. 编写配置

`webpack.config.cjs`：

```js
const path = require('node:path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = (_env, argv) => {
  const isProduction = argv.mode === 'production'

  return {
    mode: isProduction ? 'production' : 'development',
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].[contenthash:8].js',
      chunkFilename: '[name].[contenthash:8].js',
      publicPath: 'auto',
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({ template: './src/index.html' }),
    ],
    devtool: isProduction ? false : 'eval-cheap-module-source-map',
    devServer: {
      port: 8080,
      open: true,
      hot: true,
    },
  }
}
```

逐项理解：

- `output.path` 是磁盘目录，要求绝对路径；`path.resolve` 用于生成该路径。
- `[name]` 是 chunk 名称，单入口通常为 `main`；`[contenthash:8]` 是内容哈希的前 8 位，用于区分内容变化后的资源。
- `chunkFilename` 控制非入口 chunk 的文件名，后面的懒加载会用到。
- `publicPath` 是**浏览器请求资源时的 URL 基址**，不是磁盘目录。`auto` 让 webpack 在运行时推断；部署到特殊子路径或 CDN 时应核对它是否符合实际地址。
- `clean: true` 在构建时清理输出目录中的旧产物，所以不要把需长期保留的文件放进 `dist`。
- `module.rules` 按条件选择处理规则；`test` 匹配 CSS 文件，`use` 指定转换链。
- `plugins` 中放插件实例，HTML 插件会生成 HTML 并插入入口脚本引用。
- `devtool` 控制 source map：把生成代码的位置映射回源码，便于调试。这里生产环境关闭它只是入门选择，不是所有项目的最佳方案。

### 4. 启动与构建

在 `package.json` 的 `scripts` 中加入以下字段，保留已有的其他字段：

```json
{
  "scripts": {
    "dev": "webpack serve --config webpack.config.cjs --mode development",
    "build": "webpack --config webpack.config.cjs --mode production"
  }
}
```

```powershell
npm run dev
```

访问 `http://localhost:8080`，应看到蓝色的“总计：3”。修改 CSS 可以观察样式更新。

停止开发服务器后执行：

```powershell
npm run build
```

会生成 `dist/index.html` 和带哈希的 JS 文件。此示例的 CSS 由 JS 注入页面，**还不会输出独立 CSS 文件**。

两条命令的区别：

| 命令 | 用途 | 产物 |
|---|---|---|
| `webpack serve` | 开发时编译、监听和提供页面 | 默认把构建资源放在内存中提供，不必看到磁盘上的 `dist` 更新 |
| `webpack` | 执行一次构建 | 写入配置指定的输出目录 |

生产部署需要托管完整的 `dist`。需要预览生产结果时，用静态 HTTP 服务器提供该目录，尤其不要靠双击 HTML 验证动态导入。

## 四、loader 与 plugin：职责不同

### 1. loader 处理模块内容

webpack 原生理解 JavaScript 和 JSON 等模块；其他源码或资源按模块类型和规则处理。不能笼统地说“webpack 5 以前只能处理 JS”。

常见 loader：

| loader | 做什么 | 不做什么 |
|---|---|---|
| `css-loader` | 处理 CSS 中的 `@import`、`url()` 等依赖，生成可被后续环节使用的模块 | 不负责自己把样式放进页面 |
| `style-loader` | 在浏览器运行时插入 `<style>` 应用样式 | 不生成独立 CSS 产物 |
| `sass-loader` | 调用 Sass 编译器把 Sass 转成 CSS | 不负责最终应用样式，还需安装 `sass` 等实现 |
| `babel-loader` | 调用 Babel 转换 JS / JSX 等语法 | 不会仅凭安装就自动配置所有转换或补齐所有新 API |
| `ts-loader` | 调用 TypeScript 编译器处理 TS | 不负责浏览器运行时 API 的兼容 |

普通 loader 链的**内容转换阶段通常从右向左执行**：

```js
use: ['style-loader', 'css-loader', 'sass-loader']
```

对应的思路是：Sass → CSS → 可消费的 CSS 模块 → 浏览器应用样式。完整 loader 生命周期还有从左向右的 pitch 阶段，入门时先掌握正常转换链，不要把右到左推广为所有阶段的规则。

若需要 Babel，可安装：

```powershell
npm install --save-dev babel-loader @babel/core @babel/preset-env
```

再向 `module.rules` 添加规则：

```js
{
  test: /\.m?js$/,
  exclude: /node_modules/,
  use: {
    loader: 'babel-loader',
    options: {
      presets: [['@babel/preset-env', { modules: false }]],
    },
  },
}
```

`modules: false` 保留 ESM 供 webpack 分析。真实项目还应通过 Browserslist 等明确目标浏览器；**语法转换不等于 API 补齐**，如 `Promise` 等 API 的兼容需要另外设计 polyfill 策略。webpack 自身生成的运行时代码也需按目标环境配置，不能认为“接上 Babel 就兼容所有旧浏览器”。

### 2. plugin 扩展整个构建过程

插件通过构建过程暴露的钩子（hook）介入：可以读取模块和 chunk 信息、修改产物、生成额外文件，不局限于转换一个文件。

例如 `HtmlWebpackPlugin` 根据模板生成 HTML，并根据本次构建的文件名注入脚本。文件名含哈希时，就不用每次手动改 `<script src="...">`。

常见插件还有：

- `MiniCssExtractPlugin`：配合其 loader 提取独立 CSS。
- `DefinePlugin`：webpack 内置插件，在构建时替换指定标识符，常用于编译期常量。
- `BundleAnalyzerPlugin`：来自 `webpack-bundle-analyzer`，可视化查看包中各模块占用情况。

**loader 主要转换模块内容；plugin 可参与构建生命周期和产物处理。** 两者可以合作，不是互斥关系。注意编译期替换进前端代码的常量会随产物公开，不能拿它保存服务端密钥。

## 五、webpack 5 的资源模块：不是内置了所有 loader

原笔记中“webpack 5 内置了 css-loader、style-loader、file-loader”的说法不准确：这些仍是独立的 npm 包。webpack 5 引入的是 **Asset Modules（资源模块）**，覆盖许多原来由 `file-loader`、`url-loader`、`raw-loader` 承担的场景。

常用类型：

| 类型 | 导入结果 / 行为 | 常见用途 |
|---|---|---|
| `asset/resource` | 输出资源文件，导出它的 URL | 图片、字体 |
| `asset/inline` | 导出 data URI，把内容内联 | 很小的图标 |
| `asset/source` | 导出源码字符串 | 文本内容 |
| `asset` | 按大小在 resource 与 inline 间选择，默认阈值约 8 KiB | 自动决定图片输出方式 |

向 `module.rules` 添加：

```js
{
  test: /\.(png|jpe?g|gif|svg)$/i,
  type: 'asset/resource',
  generator: {
    filename: 'images/[name].[contenthash:8][ext]',
  },
}
```

把自己的图片放到 `src/logo.png`，再在入口中使用：

```js
import logoUrl from './logo.png'

const logo = document.createElement('img')
logo.src = logoUrl
logo.alt = '项目标志'
document.body.appendChild(logo)
```

这里 `logoUrl` 是构建后资源的访问地址，不是图片像素数据。没有进入依赖图的任意文件，不会仅因放在 `src` 下就自动被复制。

> 版本说明：较新的 webpack 5.x 还提供 `experiments.css` 原生 CSS 能力，但这与“内置 css-loader”不是一回事。本文使用常见 loader 方案，不开启该实验选项；若尝试原生 CSS，应按所用版本的 [实验选项文档](https://webpack.js.org/configuration/experiments/#experimentscss) 配置，不要直接混用两套 CSS 处理规则。

## 六、从源码到产物：webpack 到底做了什么

### 1. 构建阶段：在 Node.js 中运行

可以用下面的主线理解，而不必一开始就背全部内部 hook：

```text
读取配置、注册插件
    ↓
从 entry 出发解析文件路径
    ↓
读取模块 → 按规则转换 → 解析 AST → 收集依赖
    ↓
递归构建模块依赖图（ModuleGraph）
    ↓
组织 chunk、优化代码、生成运行时代码与资源
    ↓
输出 assets
```

AST（抽象语法树）是对代码结构的表示，便于识别导入、导出等语法节点。模块图记录“谁依赖谁”，chunk 的组织则进一步决定“哪些模块一起交付、哪些按需加载”。插件可在上述不同阶段介入。

这里的分析过程**不是把业务代码全部执行一次**。例如 `document.createElement` 是留给浏览器执行的，不能因为打包在 Node.js 中运行，就推断业务 DOM 代码也在构建时执行。

webpack 支持 ESM、CommonJS 等依赖形式，但依赖必须能够被构建工具分析。`import('./editor.js')` 很明确；部分动态表达式可能创建包含一批候选文件的上下文模块；完全任意的运行时路径不能被期待自动打包。

### 2. 运行阶段：浏览器执行产物

关联文章中的 `main → format → math` 示例展示了依赖执行顺序。理解典型 webpack 运行时，可以先看一个仅用于说明的 CommonJS 风格小模型：

```js
const modules = {
  math(module) {
    module.exports = { add: (a, b) => a + b }
  },
  main(module, exports, requireModule) {
    const { add } = requireModule('math')
    console.log(add(1, 2))
  },
}

const cache = Object.create(null)

function requireModule(id) {
  if (cache[id]) return cache[id].exports
  const module = { exports: {} }
  cache[id] = module
  modules[id](module, module.exports, requireModule)
  return module.exports
}

requireModule('main') // 3
```

关键是三部分：**模块表、模块缓存、模块执行函数**。先登记缓存再执行模块，有助于理解循环依赖为什么会读到尚未完成的导出。

这不是完整 webpack 实现，也不代表 ESM 会被简单转换成普通值拷贝：真实 ESM 产物常通过 getter 等维护实时绑定，还要处理循环依赖、异步 chunk 等情况。生产优化也可能合并模块作用域（scope hoisting），因此不保证每个源文件都保留独立包装函数。

要区分两件事：

- 同一已加载 chunk 中的模块调用通常不需要再发网络请求。
- 懒加载 chunk 尚未到达时，运行时需要先异步获取该文件，再执行其中模块。

所以“webpack 的模块调用是同步的”不能用来否定 `import()` 的异步加载。这里只讨论默认的典型浏览器产物；webpack 也能配置其他输出形式，并非所有产物都长成同一张模块表。

## 七、代码分割：把“需要时再加载”落到产物上

### 1. 动态 import：调整加载时机

新增 `src/editor.js`：

```js
export function openEditor() {
  const textarea = document.createElement('textarea')
  textarea.placeholder = '开始编辑'
  document.body.appendChild(textarea)
}
```

在入口文件末尾追加：

```js
const button = document.createElement('button')
button.textContent = '打开编辑器'
button.addEventListener('click', async () => {
  const { openEditor } = await import(
    /* webpackChunkName: "editor" */ './editor.js'
  )
  openEditor()
})
document.body.appendChild(button)
```

通常会生成主入口和 `editor` 两个 JS chunk：

1. 打开页面，先加载主入口。
2. 点击按钮，运行到 `import()` 才请求编辑器 chunk。
3. chunk 加载、模块求值完成后，Promise 得到模块命名空间对象，再调用 `openEditor`。

代码分割不等于“不构建这个模块”：编辑器仍在构建时被分析、生成产物，只是**浏览器获取与执行它的时机推迟了**。重复导入通常复用已加载的 chunk 和模块，但重复点击仍会再次调用 `openEditor`。

该示例省略交互状态与失败提示；实际项目需要处理网络失败，并避免用户重复点击造成不符合预期的行为。

### 2. SplitChunks：提取可共享的依赖

动态导入主要决定何时加载，`splitChunks` 主要决定如何把可共享的模块提取出来。可在配置返回的对象中加入：

```js
optimization: {
  splitChunks: {
    chunks: 'all',
  },
  runtimeChunk: 'single',
},
```

- `chunks: 'all'` 让同步和异步 chunk 都参与拆分分析。
- `runtimeChunk: 'single'` 将运行时代码提取到单独的 chunk，有助于分离业务代码与运行时变化。

提取还受到大小、复用次数、请求数量等条件影响，**不是所有 npm 包都会各自生成一个文件**。小型入门示例可能没有值得提取的公共依赖，也不一定因此多出 vendor 文件。

拆包不是越细越好：过多小文件会增加请求与管理开销。先观察体积和加载链，再决定拆分策略。

## 八、生产优化：分清优化目标

### 1. Tree Shaking：删除不需要的代码

```js
// utils.js
export const add = (a, b) => a + b
export const multiply = (a, b) => a * b

// index.js
import { add } from './utils.js'
console.log(add(1, 2))
```

若 `multiply` 无其他用途且能够安全删除，生产构建可以移除它。webpack 基于 ESM 静态结构分析使用情况，再配合优化和压缩过程删除无用代码。

这里有一个重要边界：**没有使用导出，不代表整个文件都能删除**。文件可能在顶层注册事件、修改全局对象、安装 polyfill，或通过 CSS 导入应用样式，这些属于副作用。

`package.json` 的 `sideEffects` 声明用于帮助 webpack 判断是否可以跳过模块：

```json
{
  "sideEffects": ["**/*.css", "./src/polyfills.js"]
}
```

这表示所列文件应保留副作用，其余文件被声明为无副作用。只有在确实核对过项目代码时才采用；不要无脑写 `"sideEffects": false`，否则生产环境可能丢失样式或初始化逻辑。

开发模式中看到“未使用导出”的标记，也不代表代码已经从产物删除。检查最终效果应看生产构建。CommonJS 的动态性让这类分析通常更困难，不能简单把 ESM 换成 `require` 后仍期待同样的优化效果。

### 2. CSS 提取：让样式成为独立资源

入门配置使用 `style-loader`，生产项目常改为独立 CSS，便于并行加载和缓存：

```powershell
npm install --save-dev mini-css-extract-plugin
```

在配置顶部引入：

```js
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
```

然后在原配置中替换 CSS 规则的 `use`，并扩展 `plugins`：

```js
// CSS 规则中的 use
use: [
  isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
  'css-loader',
],
```

```js
plugins: [
  new HtmlWebpackPlugin({ template: './src/index.html' }),
  ...(isProduction
    ? [new MiniCssExtractPlugin({ filename: '[name].[contenthash:8].css' })]
    : []),
],
```

这些片段分别放到第三节配置函数的对应位置，`isProduction` 沿用已有变量。不要在同一条 CSS 转换链中同时使用 `style-loader` 和提取 loader。

HTML 插件会引用初始 CSS 产物。**提取不等于压缩**：`production` 默认的 JS 压缩不会自动覆盖这套方案的 CSS 压缩，需要时可另外使用 `css-minimizer-webpack-plugin`。

### 3. 内容哈希：配合 HTTP 缓存

内容哈希解决的是“代码更新后资源 URL 如何变化”。可配合部署策略：

- 带哈希的静态资源：长期缓存，例如 `Cache-Control: public, max-age=31536000, immutable`。
- HTML：使用可及时更新的缓存策略，让浏览器能拿到新的资源引用。
- 发布：先保证新静态资源可访问，再更新 HTML；不要立即删除仍可能被旧页面请求的懒加载资源。

`[contenthash]` 不会自动设置 HTTP 响应头。若用户打开旧页面后，新发布删除了其依赖的旧 chunk，就可能出现 `ChunkLoadError`。

### 4. 构建速度与页面速度不是一回事

| 目标 | 常用手段 |
|---|---|
| 开发 / 构建更快 | 缩小 loader 匹配范围、合理选择 source map、启用持久化缓存 |
| 首屏加载更快 | 路由或功能懒加载、减少首屏依赖、压缩与合理拆包 |
| 重复访问更快 | 内容哈希、HTTP 缓存、稳定的公共依赖拆分 |
| 找出体积问题 | 构建统计信息、`webpack-bundle-analyzer` |

webpack 5 的持久化缓存可通过配置启用：

```js
cache: {
  type: 'filesystem',
  buildDependencies: {
    config: [__filename],
  },
},
```

它复用构建结果，不是浏览器 HTTP 缓存。优化前先确认瓶颈，不要为了“配置看起来高级”添加大量插件或并行处理。

## 九、开发体验：source map 与 HMR

**source map（源码映射）**让开发者从打包后的错误位置定位回源码。映射精度、生成速度、文件体积存在取舍，应按开发或生产调试需求选择。

生产环境可以不发布 source map，或者只上传到错误监控平台；公开映射文件可能使源码更容易被还原。`hidden-source-map` 只是避免在 JS 中附加映射引用，不等于映射文件如果公开托管就无法访问。

**HMR（Hot Module Replacement，模块热替换）**是在不整页刷新的情况下更新模块：

```text
文件变更 → 增量编译 → 通知浏览器 → 获取更新 → 应用模块替换
```

- 整页刷新通常会重建页面状态。
- HMR 可以保留部分状态，但是否保留取决于模块和框架的更新逻辑。
- `style-loader` 提供样式热更新支持；普通 JS 并不是只写 `hot: true` 就一定能安全局部更新，还需要接收更新的处理逻辑或框架集成。更新无法被接受时可能回退为刷新。

## 十、常见误区与排查顺序

| 现象 / 说法 | 正确认识或优先检查项 |
|---|---|
| “webpack 就是把所有文件合成一个 JS” | 可输出多种资源，代码分割正是它的重要能力 |
| “webpack 替我把所有新语法变成旧语法” | 打包、语法转换、运行时 API 兼容是不同职责 |
| `Module not found` | 检查路径、大小写、包是否安装，以及解析配置 |
| `Module parse failed` | 检查该文件类型是否配置了匹配的 loader / 模块类型 |
| 开发服务器运行但 `dist` 没变 | 默认内存输出，这是开发服务器的正常行为 |
| 生产环境没有样式 | 检查 CSS 处理链、HTML 引用、`sideEffects` 声明 |
| 懒加载出现 `ChunkLoadError` | 看 Network 中 chunk URL、状态码、响应内容；核对 `publicPath` 与旧资源保留策略 |
| `splitChunks` 配置后没有 vendor 文件 | 可能没有依赖满足提取条件，不一定是配置失效 |

## 十一、面试时如何串起来讲

### 1. webpack 的构建流程

> webpack 从入口开始解析模块，按照规则转换内容并收集依赖，递归构建模块图；再根据入口、动态导入和优化规则组织 chunk，生成代码与运行时，最后输出资源。loader 主要参与模块内容转换，plugin 可以通过钩子参与整个构建生命周期。

### 2. loader 和 plugin 有什么区别

> loader 关注模块内容的转换，例如 Sass 转 CSS；plugin 关注构建过程的扩展，例如生成 HTML 或处理最终产物。它们也能协作，例如 CSS 提取同时用到插件和配套 loader。

### 3. Tree Shaking 和代码分割有何区别

> Tree Shaking 关注“哪些代码可以不交付”，代码分割关注“要交付的代码分成哪些包、何时加载”。前者减少无用代码，后者优化资源组织与加载时机，二者可以同时使用。

### 4. webpack 和 Vite 怎么比较

> webpack 开发时通常先构建模块和产物，再由开发服务器提供。Vite 的典型开发模式更多利用浏览器原生 ESM 按需提供模块，也会做转换和依赖处理，不是完全没有构建工作。Vite 的生产构建仍使用打包器，具体底层实现应按版本确认。工具选择还要看插件生态、迁移成本和实际瓶颈，不能只凭“一个快、一个慢”下结论。

## 十二、小练习：检查是否真正理解

1. 运行开发服务器，再做生产构建：为什么前者不一定写入 `dist`？
2. 把 `style-loader` 移除，只留下 `css-loader`：为什么不能再期待样式自动应用到页面？
3. 加入编辑器懒加载：打开 Network，确认首次加载与点击按钮时分别请求了哪些 JS。
4. 给工具模块添加一个未使用的纯函数：比较开发与生产产物，观察它是否被移除。
5. 故意设置错误的资源基址：结合请求 URL 解释 `publicPath` 与 `output.path` 的区别。

能把这些现象讲清楚，比背下几十个配置项更有价值。

## 参考资料与继续阅读

以下官方资料用于核对核心机制；示例以本文明确说明的 loader 方案为准。在线文档会持续更新，涉及实验能力时应检查版本要求。

- [webpack 官方概念](https://webpack.js.org/concepts/)：入口、输出、loader、plugin 等基本定义。
- [Getting Started](https://webpack.js.org/guides/getting-started/)：从零建立项目。
- [Loaders](https://webpack.js.org/concepts/loaders/)：职责与执行顺序。
- [Asset Modules](https://webpack.js.org/guides/asset-modules/)：webpack 5 的资源处理。
- [Code Splitting](https://webpack.js.org/guides/code-splitting/)：动态导入与公共依赖拆分。
- [Tree Shaking](https://webpack.js.org/guides/tree-shaking/)：未使用导出、副作用与 CSS 保留。
- [Caching](https://webpack.js.org/guides/caching/)：内容哈希与运行时提取。
- [Hot Module Replacement](https://webpack.js.org/concepts/hot-module-replacement/)：热更新机制。
- [Build Performance](https://webpack.js.org/guides/build-performance/)：构建性能优化。
- [Experiments](https://webpack.js.org/configuration/experiments/)：原生 CSS 等实验选项的版本边界。
- [从硕士论文到 webpack：作者访谈](https://github.com/readme/podcast/masters-thesis-to-webpack)：诞生背景与代码分割动机。

原笔记中的延伸资料继续保留，阅读时注意旧版配置与 webpack 5 的差异：

- [webpack 学习教程](https://rhyszhao.github.io/webpack-learn/base/example.html#webpack-%E6%98%AF%E4%BB%80%E4%B9%88)
- [webpack 面试题整理](https://juejin.cn/post/6844904094281236487#heading-0)
- [webpack 打包产物分析](https://juejin.cn/post/7053998924071174175)
