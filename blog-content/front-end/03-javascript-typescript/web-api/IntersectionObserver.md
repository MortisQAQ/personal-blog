# IntersectionObserver（交叉观察器）

参考文档：
- MDN 接口：https://developer.mozilla.org/zh-CN/docs/Web/API/IntersectionObserver
- MDN API 概述：https://developer.mozilla.org/zh-CN/docs/Web/API/Intersection_Observer_API
- MDN Entry：https://developer.mozilla.org/zh-CN/docs/Web/API/IntersectionObserverEntry

## 一、是什么

`IntersectionObserver`（交叉观察器）是浏览器原生提供的一个 Web API，它可以**异步**地观察一个**目标元素（target）**与其**祖先元素或顶级文档视口（root）**的交叉（intersection）状态变化，并在交叉比例跨越设定的**阈值（threshold）**时执行回调。

一句话概括：它能告诉你「某个元素进入 / 离开了视口（或某个滚动容器）」，而且这件事是浏览器在主线程之外帮你算好的。

## 二、为什么需要它：告别 scroll + getBoundingClientRect

在没有它之前，判断「元素是否出现在视口里」的传统做法是监听 `scroll` 事件，然后在回调里调用 `getBoundingClientRect()` 手动计算位置：

```js
window.addEventListener('scroll', () => {
  const rect = img.getBoundingClientRect();
  if (rect.top < window.innerHeight) {
    img.src = img.dataset.src;
  }
});
```

这种写法有几个致命问题：

- **性能瓶颈**：`scroll` 事件运行在主线程上，滚动 1 像素就可能触发一次，60fps 滚动下一秒可达数十次；而 `getBoundingClientRect()` 会强制浏览器**同步重排（reflow / layout）**才能返回几何信息。高频触发 + 强制重排 = 滚动卡顿、掉帧。
- **逻辑复杂**：需要自己处理节流 / 防抖、各种边界情况，滚动过快时还容易漏判。
- **可扩展性差**：多个元素、多个滚动容器的观察逻辑很容易耦合在一起。

`IntersectionObserver` 从根本上换了个思路：**不再主动轮询，而是把「目标 + 阈值」交给浏览器，由浏览器在渲染流程之外异步、批量地通知你。** 优势：

- **异步、非阻塞**：回调不在滚动的关键渲染路径上执行，不阻塞主线程。
- **底层原生优化**：位置判断在浏览器内部（C++）完成，而非在 JS 层反复计算。
- **一对多**：一个 observer 实例可同时观察任意多个元素，无需给每个元素单独绑定。

## 三、基本用法

三步走：创建回调 → 创建 observer → 开始观察。

```js
// 1. 回调函数：交叉状态变化时被调用
const callback = (entries, observer) => {
  entries.forEach((entry) => {
    // 每个 entry 描述一个被观察目标的交叉信息
    if (entry.isIntersecting) {
      console.log('目标进入视口', entry.target);
    } else {
      console.log('目标离开视口', entry.target);
    }
  });
};

// 2. 配置项（可选）
const options = {
  root: null,        // null 表示以浏览器视口为根
  rootMargin: '0px', // 根的外边距
  threshold: 0.5,    // 目标可见 50% 时触发
};

// 3. 创建实例并开始观察
const observer = new IntersectionObserver(callback, options);
const target = document.querySelector('#target');
observer.observe(target);
```

> ⚠️ 注意：`observe()` 之后，回调会**先触发一次初始状态**（哪怕元素当前不在视口内），用于告诉你元素当前的交叉情况。所以不要假设「回调触发 = 元素一定可见」，要用 `entry.isIntersecting` 判断。

## 四、构造函数与配置项

### `new IntersectionObserver(callback, options)`

**`callback`**：`(entries, observer) => void`
- `entries`：一个 `IntersectionObserverEntry` 数组，每一项对应一个发生了交叉变化的目标。**注意：即使只观察一个元素，entries 也是数组**，通常写 `entries.forEach(...)` 或用解构 `([entry]) => {}`。
- `observer`：触发该回调的 observer 实例本身，方便在回调内调用 `unobserve` 等方法。

**`options`**（可选对象）：

| 配置项 | 说明 | 默认值 |
|---|---|---|
| `root` | 用作交叉判定「参照系」的元素，必须是目标的祖先元素。`null` 表示使用顶级文档视口。 | `null`（视口） |
| `rootMargin` | 在计算交叉前，给根的边界框四周增加 / 缩小的偏移量，语法类似 CSS `margin`（上 右 下 左），单位只能是 `px` 或 `%`。正值扩大根范围（提前触发），负值缩小根范围（延后触发）。 | `"0px 0px 0px 0px"` |
| `threshold` | 阈值，取值 0~1，可以是单个数字或数组。表示目标可见比例达到多少时触发回调。 | `0` |

关于 `threshold` 的直觉：

- `0`：目标只要有**任意一个像素**进入 / 离开根边界就触发。
- `0.5`：目标可见面积达到 50% 时触发。
- `1.0`：目标**完全**可见时才触发。
- `[0, 0.25, 0.5, 0.75, 1]`：每跨越一个刻度就触发一次，适合做「可见进度」类的渐进效果 / 埋点。

关于 `rootMargin` 的直觉（实战常用）：

- `rootMargin: '0px 0px 300px 0px'`：把根的**底部**向外扩展 300px，元素还没真正进视口、距离底部 300px 时就提前触发 —— 常用于**图片懒加载提前加载**、**无限滚动提前拉数据**。
- `rootMargin: '0px 0px -100px 0px'`：把根底部**向内收缩** 100px，元素要进得更深才触发 —— 常用于**曝光埋点**要求「露出更多才算看到」。

## 五、实例属性与方法

### 只读属性

- `observer.root`：交叉判定的根元素（或 `null`）。
- `observer.rootMargin`：根的外边距字符串。注意读取到的值可能被浏览器规范化成 `"0px 0px 300px 0px"` 这种四值形式，未必和你传入的完全一致。
- `observer.thresholds`：**升序排列**后的阈值数组（即使你只传了一个数字，这里也是数组）。

### 方法

- `observer.observe(target)`：开始观察某个目标元素。
- `observer.unobserve(target)`：停止观察**某个**目标（其他目标继续观察）。
- `observer.disconnect()`：停止观察**所有**目标，彻底断开。
- `observer.takeRecords()`：同步返回所有目标当前的 `IntersectionObserverEntry` 数组，且不会触发回调。使用场景较少（一般在断开前需要「结算」一次未处理的记录时用）。

## 六、IntersectionObserverEntry：回调里拿到的每一项

回调里 `entries` 数组的每个元素都是一个 `IntersectionObserverEntry`，描述某一时刻某个目标的交叉快照：

| 属性 | 说明 |
|---|---|
| `isIntersecting` | **布尔值**，目标当前是否与根相交。最常用，用来判断「进入 / 离开」。 |
| `intersectionRatio` | 交叉比例（0~1），即 `intersectionRect` 面积占目标面积的比例。做「可见度」判断时用。 |
| `target` | 被观察的目标 DOM 元素（哪个元素触发的）。 |
| `boundingClientRect` | 目标元素的边界矩形信息（类似 `getBoundingClientRect()` 的结果）。 |
| `intersectionRect` | 目标与根的**交叉区域**矩形。 |
| `rootBounds` | 根元素的边界矩形（含 `rootMargin` 计算后的结果）；根为视口时可能受同源等限制。 |
| `time` | 从「时间原点」到交叉发生的时间戳（`DOMHighResTimeStamp`）。 |

## 七、典型应用场景

### 1. 图片懒加载

图片先用 `data-src` 占位，进入视口（或即将进入）时再赋值真正的 `src`，加载完就 `unobserve` 释放。

```html
<img data-src="/real-1.jpg" class="lazy" alt="" />
<img data-src="/real-2.jpg" class="lazy" alt="" />
```

```js
const imgs = document.querySelectorAll('img.lazy');

const observer = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      img.src = img.dataset.src;
      obs.unobserve(img); // 加载后取消观察，避免浪费
    });
  },
  { rootMargin: '0px 0px 200px 0px' } // 提前 200px 加载，滚动更顺滑
);

imgs.forEach((img) => observer.observe(img));
```

### 2. 无限滚动（哨兵 Sentinel 模式）

在列表底部放一个「哨兵」空元素，它一露头就去加载下一页，比监听 scroll 简洁得多。

```js
const sentinel = document.querySelector('#bottom-sentinel');

const observer = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) {
    loadNextPage(); // 拉取下一页数据
  }
});

observer.observe(sentinel);
```

### 3. 曝光埋点 / 广告可见性上报

要求「元素露出一定比例」才算一次有效曝光，并且**只上报一次**。

```js
const observer = new IntersectionObserver(
  (entries, obs) => {
    entries.forEach((entry) => {
      if (entry.intersectionRatio >= 0.5) {
        reportExposure(entry.target.dataset.id); // 上报曝光
        obs.unobserve(entry.target); // 只报一次
      }
    });
  },
  { threshold: 0.5 } // 露出 50% 才算看到
);

document.querySelectorAll('.track-item').forEach((el) => observer.observe(el));
```

### 4. 滚动进场动画（元素可见才播放）

```js
const observer = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) {
    entry.target.classList.add('in-view');
  }
});
observer.observe(document.querySelector('.fade-in'));
```

配合 CSS：

```css
.fade-in {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.5s ease-out;
}
.fade-in.in-view {
  opacity: 1;
  transform: translateY(0);
}
```

## 八、在 React 中使用

核心是「挂载时创建、卸载时清理」，用 `useEffect` 管理生命周期。

```jsx
import { useEffect, useRef, useState } from 'react';

function LazySection({ children }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.unobserve(el); // 只需一次
        }
      },
      { threshold: 0.1 }
    );

    io.observe(el);
    return () => io.disconnect(); // 卸载时断开，防止内存泄漏
  }, []);

  return <div ref={ref}>{seen ? children : <Placeholder />}</div>;
}
```

手写时最容易踩的三个坑：
1. **忘记清理**：`useEffect` 里一定要 `return () => io.disconnect()`，否则组件卸载后 observer 仍存活，造成泄漏。
2. **过期闭包**：回调在挂载时创建，会「冻结」当时的 props / state。若回调需要读取最新值，注意依赖数组或用 ref 保存最新值。
3. **重复样板**：多个懒加载 / 曝光场景重复写 `ref + observe + disconnect`，可以封装成自定义 hook（或直接用成熟库 `react-intersection-observer` 的 `useInView`）复用。

## 九、常见坑与最佳实践

- **回调要快**：回调在主线程执行，不要做重计算。若确实耗时，用 `requestIdleCallback` / `requestAnimationFrame` 延后处理。
- **一次性任务记得取消观察**：懒加载、曝光这类「只需触发一次」的场景，处理完立刻 `unobserve(target)`，否则元素反复进出视口会重复触发。
- **entries 永远是数组**：即便只观察一个元素也要遍历或解构，别直接当单个对象用。
- **root 必须是 target 的祖先**：若在自定义滚动容器里观察，`root` 要设成该容器，且目标是它的后代，否则观察不生效。
- **初始回调**：`observe()` 后会立即回调一次当前状态，逻辑判断都以 `isIntersecting` / `intersectionRatio` 为准，不要假设「回调即可见」。
- **一个实例观察多个元素**：相同配置（root / rootMargin / threshold）的元素尽量共用一个 observer 实例，比每个元素一个实例更高效。
- **阈值与 rootMargin 组合调参**（实战速查）：
  - 想「进入一点就触发」→ `threshold: 0.01`
  - 想「完全进入才触发」→ `threshold: 1`
  - 想「提前触发」→ `rootMargin: '0px 0px 300px 0px'`

## 十、与另外两个 Observer 的区别

`IntersectionObserver` 只是三大观察者之一，按「观察什么」区分：

| API | 观察对象 | 典型用途 |
|---|---|---|
| `IntersectionObserver` | 元素的**可见性 / 交叉状态** | 懒加载、无限滚动、曝光埋点、进场动画 |
| `MutationObserver` | DOM **结构 / 属性的变化** | 监听节点增删、属性变更 |
| `ResizeObserver` | 元素**尺寸的变化** | 响应式布局、监听容器 resize |

## 十一、总结

`IntersectionObserver` 用「浏览器主动通知」替代了「JS 高频轮询」，是判断元素可见性的现代标准方案：

1. 三步走：写 `callback` → `new IntersectionObserver(callback, options)` → `observe(target)`。
2. 三个配置：`root`（参照系）、`rootMargin`（提前 / 延后触发）、`threshold`（可见比例）。
3. 回调里认准 `entry.isIntersecting` 和 `entry.intersectionRatio`。
4. 一次性任务用完即 `unobserve`，组件卸载 `disconnect`，避免泄漏。
