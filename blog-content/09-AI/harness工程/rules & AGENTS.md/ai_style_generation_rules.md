# AI 生成样式与设计稿还原规则

## 规则产出背景

这份规则来自实际开发中的样式还原问题复盘：AI 在根据设计稿生成 UI 时，往往倾向于用 `position: absolute`、固定宽高和像素级坐标去做静态视觉还原，短期看起来接近设计稿，但容易忽略移动端视口变化、真实宿主差异和响应式布局约束。

另一个高频问题是，AI 生成样式时通常更关注“还原设计稿截图”，较少主动处理真实用户体验约束，例如后端返回文本可多可少、标题和按钮文案可能变长、卡片内容可能缺失、权益或标签数量变化、中英文和基金代码混排导致宽度不可预测等。结果是页面在示例文案下正常，但在真实数据里出现文本溢出、内容裁剪、横向滚动、按钮被挤压或卡片高度异常。

因此，本规则要求 AI 在写样式时不能只把设计稿当成静态图片还原，而必须同时考虑动态内容、响应式容器、文本策略、交互热区和真实数据边界。

## 适用范围

本规则适用于所有 AI 参与生成、修改或还原 UI 样式的场景，包括但不限于：

- 使用 `caijing-d2c` / Figma / 截图生成页面或组件代码。
- 手写或改写 H5、React、ReactLynx、TTML、小程序页面样式。
- 修复视觉还原、文本溢出、区块高度、横向滚动、弹窗高度、卡片排版等体验问题。

本规则不是 D2C 专属规则。只要 AI 在写样式或 UI 结构，就必须执行。

## 核心原则

1. **D2C 只提供视觉初稿，不等于可上线实现。**
   - D2C 输出只能作为结构、尺寸、资源、层级的参考。
   - 不允许把 D2C 产物直接覆盖业务组件后就结束。
   - 业务字段、真实数据长度、交互副作用、埋点、容器能力仍以仓库现有实现和后端契约为准。

2. **静态设计稿不能替代动态内容约束。**
   - 还原设计稿时必须同时考虑真实后端文本、空态、长文本、短文本、图片缺失、按钮文案变化、权益/标签数量变化。
   - 任何固定高度、绝对定位、单行截断、强制不换行都必须说明其业务理由。

3. **优先文档流和弹性布局，谨慎使用绝对定位和固定宽高。**
   - 卡片、弹窗、摘要、列表项、标题区等承载动态内容的区域，默认使用自然高度、`max-height`、`min-height`、`flex`、`grid`、`gap`、`padding` 表达布局。
   - 禁止用 `height` + `position:absolute` 强行撑出静态视觉，除非该区域内容完全固定且已有兜底。
   - 需要保持设计最大高度时，优先使用 `max-height + overflow`，不要用固定 `height` 伪装上限。

## 文本处理强制规则

每个展示后端文本或用户文本的节点必须明确文本策略：

- 单行省略：必须同时具备可收缩容器、明确可用宽度或 flex 剩余空间、`overflow: hidden`、`white-space: nowrap`、`text-overflow: ellipsis`。
- 多行省略：必须明确最大行数、行高、最大高度或 line-clamp 方案；不要只写 `overflow: hidden`。
- 可换行正文：必须允许换行，并处理长英文、代码、URL、产品名等连续字符串，可按平台使用 `word-break` / `overflow-wrap` / Lynx 对应能力。
- 禁止无意识使用 `white-space: nowrap`。一旦使用，必须确认不会导致父容器横向溢出。
- Flex 子项内做省略时，父/子链路必须检查 `min-width: 0` 或等效收缩能力。
- 不要按“字符数”判断能否展示。中文、英文、数字、ETF/基金代码、不同字体和字重的真实宽度不同，必须按渲染宽度或容器约束判断。

## 宽高与间距规则

- 固定 `width` / `height` 只能用于图标、头像、固定尺寸按钮、固定比例图片等视觉尺寸稳定元素。
- 动态内容容器不得只写固定 `height`。如需限制，应使用：
  - `min-height` 表达最低视觉规格；
  - `max-height` 表达设计上限；
  - 内容区使用 `padding` 和文档流自适应；
  - 超出区域明确滚动、省略或折叠策略。
- 点击热区和视觉尺寸要分开判断：
  - 图标视觉尺寸可以小于点击热区；
  - 点击热区不能为了给文本让路而小到不可点；
  - 点击热区占用布局空间时，必须重新计算文本可用宽度。
- 横向列表、卡片组、表格、排行项必须计算总宽度：容器宽度 = 子项宽度 + gap + padding + 边框；不能让最后一个子项或按钮被裁切。

## 响应式与运行环境规则

H5/PIA 页面：

- 移动端基础布局优先，不要只按 Figma 默认画板写死。
- 避免让固定宽元素超过视口；必要时用 `max-width: 100%`、`width: 100%`、`flex: 1`、`min-width: 0`、媒体查询或容器查询。

ReactLynx / Lynx 页面：

- 需要省略、换行或测量宽度时，不能套用 Web DOM 直觉，必须用 Lynx DevTool / Elements / `getBoxModel` / 真机截图确认。
- 注意 `px-to-viewport` 或 Lynx 逻辑坐标转换：源码 `px` 与真机 DevTool 读数不是同一数值，不要直接用截图像素反推源码。
- 样式验证优先在真实宿主或真机上完成；模拟器结果只能作为辅助。

## 设计稿还原后的强制检查清单

AI 生成或修改样式后，必须自查以下项目：

1. **真实数据检查**
   - 用最短文本、设计稿文本、后端真实文本、超长文本各检查一次。
   - 检查空字段或缺图时是否隐藏、降级或保留占位，不能随意注入默认业务值。

2. **文本溢出检查**
   - 每个标题、摘要、按钮、标签、产品名、金额描述都有明确省略/换行策略。
   - 检查中英文混排、数字、代码、URL、基金/ETF 名称等非等宽字符。

3. **宽高自适应检查**
   - 动态内容区域是否参与文档流。
   - 是否存在不必要的固定高度或绝对定位。
   - 若存在最大高度，是否使用 `max-height` 而不是固定 `height`。

4. **多端/多视口检查**
   - H5 至少检查常见移动宽度。
   - Lynx 至少使用 DevTool 读取目标节点真实 box model，必要时真机复验。

5. **回归约束**
   - 对修复过的样式问题，应补静态检查、单测、截图验收或 DevTool 读取记录之一。
   - 检查应表达业务约束，例如“摘要区域自适应但最大高度不变”“产品名继续 flex 自适应且按钮热区为 18px”，不要只检查某个临时实现细节。

## 禁止事项

- 禁止为了贴图省事，把动态内容区域全部改成绝对定位。
- 禁止只按 Figma 中一条示例文案写死高度和宽度。
- 禁止未验证真实数据长度就提交卡片、弹窗、列表项、标题区样式。
- 禁止把文本溢出问题简单归因于“后端文案太长”，前端必须明确展示策略。
- 禁止用隐藏溢出掩盖布局错误；`overflow: hidden` 必须配套说明是省略、裁剪还是容器上限。

## 推荐输出格式

当 AI 完成样式生成或设计稿还原时，最终说明必须包含：

- 设计稿/D2C 参考内容只作为视觉参考的说明。
- 动态内容适配策略：哪些区域自适应、哪些区域固定、哪些区域有最大高度。
- 文本策略：哪些单行省略、哪些多行省略、哪些允许换行。
- 验证证据：运行命令、DevTool 节点读数、截图路径或无法验证的阻塞原因。

## 参考资料

### 与本规则直接对应的问题

- **动态后端文本导致区块高度/内容裁剪问题**：对应“AI/D2C 按静态设计稿或单条示例文案写死高度、绝对定位、固定容器”的风险。规则中要求动态内容区域默认走文档流、自适应高度，只有设计要求上限时才使用 `max-height`。
- **文本溢出卡片区块问题**：对应“AI/D2C 未明确文本换行/省略策略，或 flex 子项缺少收缩约束”的风险。规则中要求每个后端文本节点必须明确单行省略、多行省略或换行策略，并验证中英文、数字、基金/ETF 名称等真实内容。

### AI 生成 UI / D2C 局限与动态内容

- [Mobile responsiveness for AI-built UIs: a layout audit](https://fixmymess.ai/blog/mobile-responsiveness-ai-built-ui-audit)：指出 AI 原型常用固定宽度、绝对定位和像素级间距拼出静态效果，且会假设单一字体、单一内容长度、单一视口。
- [Mobile UI Quality-Control Checklist for AI-Generated Code](https://codeongrass.com/blog/mobile-ui-quality-control-checklist-ai-generated-code/)：直接提到 AI 会生成在参考环境看似正确、但在小屏或真实文本下溢出/被裁剪的字体、行高和容器宽度；建议对最长预期文本做 typography/text truncation audit。
- [How AI Reads Layout and Intent to Turn Designs into UI Code](https://koder.ai/blog/how-ai-interprets-layout-hierarchy-intent-design-to-ui-code)：说明 D2C/AI 能推断布局和层级，但真实组件名、tokens、状态、断点、数据规则和交互必须由人明确补充。
- [Building Custom UI Components With AI](https://aiskill.market/blog/building-custom-ui-components-ai)：强调 AI 生成组件需要“Define → Constrain → Test”流程，否则组件容易在隔离预览中正确、放到真实上下文后崩坏。

### Figma/D2C 到代码的固定高度与响应式局限

- [Figma Help: Adjust text dimensions and resizing](https://help.figma.com/hc/en-us/articles/27378154668951-Adjust-text-dimensions-and-resizing)：Figma 官方说明文本层有 Auto width、Auto height、Fixed size；Fixed size 在内容增加时可能垂直溢出。这支撑“动态文本区域不能盲目固定高度”的规则。
- [figma-to-code Skill: fixed heights for text blocks warning](https://lobehub.com/skills/majiayu000-spellbook-figma-to-code)：该 Figma-to-code skill 明确警告 Figma MCP 输出固定文本高度会导致换行、裁剪和布局问题，建议不要用固定高度承接动态文本。
- [What are the Limitations of the Figma to Replit Plugin? Analysis 2025](https://figscreen.com/what-are-the-limitations-of-the-figma-to-replit-plugin/)：列举 Figma 到代码工具在 fluid layouts、variable content lengths、mobile optimization 上的局限。
- [Why Your Mobile Responsive CSS Breaks After a Figma to HTML Conversion](https://www.pixelperfecthtml.com/why-mobile-responsive-css-breaks-after-figma-to-html-conversion/)：总结 Figma Auto Layout 和 Constraints 被翻译成固定像素时，会导致真实页面在不同屏幕或内容下布局崩坏。

### 文本省略、换行与 flex 收缩

- [MDN: text-overflow](https://developer.mozilla.org/en-US/docs/Web/CSS/text-overflow)：`text-overflow` 的权威定义，需配合 overflow 和不换行/受限宽度才会出现省略。
- [The Complete CSS Ellipsis Interactive Tutorial](https://interactivecss.com/css-ellipsis-interactive-tutorial/)：系统讲解单行省略三要素、flex 中 `min-width: 0`、grid 中 `minmax(0, 1fr)`。
- [Why Flex Items Refuse to Shrink](https://lougd.com/posts/why-flex-items-refuse-to-shrink)：解释 flex item 默认自动最小宽度会阻止收缩，`flex: 1` 与 `min-width: 0` 解决的是不同问题。
- [Text truncation and overflow](https://subux.pro/guides/article/text-truncation-and-overflow)：从 UX 角度说明正文应优先换行，短标签/表格/卡片标题等空间受限场景才使用省略，并要求用真实内容和本地化文本测试。
- [CSS text-overflow: ellipsis Not Working?](https://www.tutorialpedia.org/blog/css-text-overflow-ellipsis-not-working/)：总结省略不生效的常见原因，包括缺少宽度、inline 元素、flex/grid 子项未允许收缩。
