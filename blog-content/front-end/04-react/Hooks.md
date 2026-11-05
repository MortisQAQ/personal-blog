参考视频：<https://www.bilibili.com/video/BV1s6oNYgEin/?spm_id_from=333.1391.0.0&vd_source=7d9c555f22ae63576d8b3953e2062ec3>
[hooks介绍](https://juejin.cn/post/7492238013192454170)
[hooks使用规则与原理](https://juejin.cn/post/7020811068955951135)

## 背景知识：1.函数组件

## 2.命令式UI和声明式UI

```js
let count = 0;
document.getElementById('btn').addEventListener('click', () => {
  count++;
  document.getElementById('display').innerText = count;
});
```

```js
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

react当中，基本不需要你自己手动获取元素操作DOM，因为react内部已经帮你封装好了，你只需要关注业务逻辑即可

### 3. How？

jsx->vdom->dom
所以，重新执行函数组件修改jsx，react会根据jsx的变化，自动更新dom

## 一、hooks是什么

`Hook` 是 React 16.8 的新增特性。它可以让你在不编写 `class` 的情况下使用 `state` 以及其他的 `React` 特性（hook的出现代表着react全面拥抱函数式编程）
至于为什么引入`hook`，官方给出的动机是解决长时间使用和维护`react`过程中常遇到的问题，例如：

在以前，函数组件也被称为无状态的组件，只负责渲染的一些工作

因此，现在的函数组件也可以是有状态的组件，内部也可以维护自身的状态以及做一些逻辑方面的处理

## 二、有哪些

上面讲到，`Hooks`让我们的函数组件拥有了类组件的特性，例如组件内的状态、生命周期

最常见的`hooks`有如下：useState、useEffect、useContext、useReducer、useCallback、useMemo、useRef、useLayoutEffect...

### useState

## 首先：什么是状态？

### 所以，useState做了什么？

```js
import React, { useState } from 'react';

function Example() {
  // 声明一个叫 "count" 的 state 变量
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>You clicked {count} times</p >
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
```

在函数组件中通过`useState`实现函数内部维护`state`，参数为`state`默认的值，返回值是一个数组，第一个值为当前的`state`，第二个值为更新`state`的函数

该函数组件等价于的类组件如下：

```js
class Example extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      count: 0
    };
  }

  render() {
    return (
      <div>
        <p>You clicked {this.state.count} times</p >
        <button onClick={() => this.setState({ count: this.state.count + 1 })}>
          Click me
        </button>
      </div>
    );
  }
}
```

从上述两种代码分析，可以看出两者区别：

#### 与useState类似但有区别：useReducer、useRef

### useEffect

#### 1.什么是副作用？

##### 2.useEffect的作用？

简单来讲，useEffect模拟了类组件的生命周期方法。

| 类组件生命周期方法               | 函数组件（useEffect）实现                               | 说明             |
| ----------------------- | ----------------------------------------------- | -------------- |
| `componentDidMount`     | `useEffect(() => { ... }, [])`                  | 依赖数组为空，只在挂载时执行 |
| `componentDidUpdate`    | `useEffect(() => { ... }, [dep1, dep2])`        | 依赖项变化时执行       |
| `componentWillUnmount`  | `useEffect(() => { return () => { ... } }, [])` | 返回的函数在卸载时执行    |
| `shouldComponentUpdate` | 通过`React.memo`或条件渲染实现                           | 用于优化组件渲染       |

`useEffect`可以让我们在函数组件中进行一些带有副作用的操作

同样给出一个计时器示例：

```js
class Example extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      count: 0
    };
  }

  componentDidMount() {
    document.title = `You clicked ${this.state.count} times`;
  }
  componentDidUpdate() {
    document.title = `You clicked ${this.state.count} times`;
  }

  render() {
    return (
      <div>
        <p>You clicked {this.state.count} times</p >
        <button onClick={() => this.setState({ count: this.state.count + 1 })}>
          Click me
        </button>
      </div>
    );
  }
}
```

从上面可以看见，组件在加载和更新阶段都执行同样操作
而如果使用`useEffect`后，则能够将相同的逻辑抽离出来，这是类组件不具备的方法
对应的`useEffect`示例如下：

```jsx
import React, { useState, useEffect } from 'react';
function Example() {
  const [count, setCount] = useState(0);
 
  useEffect(() => {    document.title = `You clicked ${count} times`;  });
  return (
    <div>
      <p>You clicked {count} times</p >
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
```

`useEffect`第一个参数接受一个回调函数，默认情况下，`useEffect`会在第一次渲染和更新之后都会执行，相当于在`componentDidMount`和`componentDidUpdate`两个生命周期函数中执行回调

如果某些特定值在两次重渲染之间没有发生变化，你可以跳过对 effect 的调用，这时候只需要传入第二个参数，如下：

```js
useEffect(() => {
  document.title = `You clicked ${count} times`;
}, [count]); // 仅在 count 更改时更新
```

上述传入第二个参数后，如果 `count` 的值是 `5`，而且我们的组件重渲染的时候 `count` 还是等于 `5`，React 将对前一次渲染的 `[5]` 和后一次渲染的 `[5]` 进行比较，如果是相等则跳过`effects`执行

回调函数中可以返回一个清除函数，这是`effect`可选的清除机制，相当于类组件中`componentwillUnmount`生命周期函数，可做一些清除副作用的操作，如下：

```jsx
useEffect(() => {
    function handleStatusChange(status) {
        setIsOnline(status.isOnline);
    }

    ChatAPI.subscribeToFriendStatus(props.friend.id, handleStatusChange);
    return () => {
        ChatAPI.unsubscribeFromFriendStatus(props.friend.id, handleStatusChange);
    };
});
```

所以， `useEffect`相当于`componentDidMount`，`componentDidUpdate` 和 `componentWillUnmount` 这三个生命周期函数的组合

#### 3.为什么返回的清除函数能当 `componentWillUnmount` 用？

这并不是 React 特意让返回值去"充当"卸载钩子，而是 `useEffect` 内部机制自然产生的结果，关键在于三点：

**（1）每个 effect 都是一对** **`create`** **/** **`destroy`**

React 在 fiber 上为每个 Hook 保存一个 effect 对象，里面记着两样东西：

在 commit 阶段，React 对 effect 的处理遵循一条固定规则：

| 时机          | 动作                                                                       |
| ----------- | ------------------------------------------------------------------------ |
| 挂载（mount）   | 执行 `create()`，把返回值存进 `effect.destroy`                                    |
| 更新（update）  | **先执行上一次的** **`destroy()`，再执行新的** **`create()`**，新返回值覆盖 `effect.destroy` |
| 卸载（unmount） | 执行最后一次的 `destroy()`                                                      |

关键就在"更新"这一行：**React 只要准备重新执行某个 effect，就会先调用上一次返回的清除函数来清场**。组件卸载时执行的，其实就是这最后一次清场——所以你写在这里的清理逻辑，天然就落在 `componentWillUnmount` 的时机上。

**（2）它比** **`componentWillUnmount`** **语义更宽**

`componentWillUnmount` 只在组件销毁时执行一次，而 `useEffect` 返回的清除函数在**每次依赖变化、effect 重新执行之前**都会执行，卸载时再执行最后一次。只有依赖数组为空 `[]` 时（`create` 只跑一次），清除函数才只跑一次，此时才和 `componentDidMount` + `componentWillUnmount` 严格等价：

```jsx
useEffect(() => {
  ChatAPI.subscribe(props.friend.id);
  return () => ChatAPI.unsubscribe(props.friend.id); // 只在卸载时执行一次
}, []); // 空依赖 → create 只执行一次
```

**（3）闭包让清除函数记住"那一轮"的数据**

每次渲染都会重新执行 `useEffect`，生成一个新的 `create`，以及一个**捕获了本次 props / state** 的 `destroy`。所以：

这正好解决了类组件里 `componentWillUnmount` 只能读到 `this.props` 最新值、可能退订错对象的问题——每一份副作用都和产生它的那一次渲染的数据绑定在一起。

**补充：执行时机差异**

因此，如果清理逻辑需要同步完成（例如在 DOM 变更前撤销测量或布局相关操作），应改用 `useLayoutEffect`，它的清除函数会在 DOM 变更后、浏览器绘制前同步执行。

###

## 三、解决什么

通过对上面的初步认识，可以看到`hooks`能够更容易解决状态相关的重用的问题：

编写`hooks`为函数式编程，每个功能都包裹在函数中，整体风格更清爽，更优雅

`hooks`的出现，使函数组件的功能得到了扩充，拥有了类组件相似的功能，在我们日常使用中，使用`hooks`能够解决大多数问题，并且还拥有代码复用机制，因此优先考虑`hooks`

## 四、Hooks 的规则与原理

### 1. Hooks 和 Fiber 是什么关系？

**Hooks 是开发者使用的 API，Fiber 是 React 内部保存组件信息、组织渲染工作的数据结构。** 可以把 Fiber 理解为组件的“档案”：函数组件每次渲染都会重新执行，但状态保存在对应的 Fiber 上，不会因为函数执行结束而丢失。

对于 `useState`、`useEffect`、`useRef` 等 Hook，React 会在函数组件的 Fiber 上维护对应的 Hook 节点，并通过 `memoizedState` 字段连接一条**普通单链表，不是环形链表**：

```text
组件的 Fiber
  └─ memoizedState → Hook 1 → Hook 2 → Hook 3 → null
                     useState  useEffect  useRef
```

Hook 节点大致保存以下信息（省略部分内部字段）：

```js
const hook = {
  memoizedState: /* 当前状态、effect 信息或 ref 对象等 */,
  queue: /* useState / useReducer 等的更新队列 */,
  next: /* 下一个 Hook 节点 */,
};
```

注意：上面是结构示意，不是可直接运行的代码。Hook 链表和某些更新队列、effect 队列不是同一条链表；后两者在内部可能使用环形链表。

### 2. 为什么 Hooks 必须保持调用顺序？

React 不是根据变量名来寻找状态，而是根据 **Hook 的调用顺序**匹配节点。首次渲染建立链表，后续渲染按相同顺序读取对应的节点：

```jsx
function Profile() {
  const [name, setName] = useState('小明'); // 第一个 Hook
  const [age, setAge] = useState(18);      // 第二个 Hook
  const inputRef = useRef(null);          // 第三个 Hook
  // ……
}
```

如果把第二个 Hook 放进 `if` 中，某次渲染跳过它，第三次调用就会对应到原来的第二个节点，造成类型或状态错位；React 通常会报告 Hook 顺序或数量变化的错误。

因此，常规 Hooks 的规则是：

**只在顶层调用**：不能放在条件、循环、嵌套函数中，也不能放在可能提前执行的 `return` 之后。

**只在函数组件或自定义 Hook 中调用**：不能在普通工具函数、事件处理函数或类组件中调用。React 渲染函数组件时，才会建立“当前正在处理哪个 Fiber、哪个 Hook”的上下文。

条件逻辑应写在 effect 回调内部，而不是用条件控制是否调用 `useEffect`：

```jsx
useEffect(() => {
  if (!enabled) return;
  // 在这里执行启用时需要的副作用
}, [enabled]);
```

补充：React 的 `use` API 是例外，允许在条件和循环中调用，但仍须在组件或 Hook 中使用，且不能放在 `try/catch` 中；不要把这个例外套用到 `useState`、`useEffect` 等常规 Hooks 上。

### 3. 状态更新和副作用如何依托 Fiber 工作？

**状态更新**：调用 `useState` 的 setter 时，React 把更新加入队列并调度渲染；组件再次执行时，React 处理队列，返回这一轮的状态。setter 不会直接修改当前函数里已经拿到的变量。

**渲染阶段**：React 在工作中的 Fiber（`workInProgress`）上计算下一版 UI 和 Hook 状态，当前已提交的版本由 `current` 保存。这种双缓存机制使未完成的渲染不必立刻替换已显示的界面。

**副作用处理**：`useEffect` 在渲染时记录 effect 信息，提交后在 passive effect 处理阶段执行回调，并保存它返回的清除函数。依赖变化后先执行旧清除函数，再执行新回调；卸载时执行最后保存的清除函数。未提交的渲染不会执行 effect 回调。

清除函数还利用了 JavaScript 的**闭包**：它记住的是创建它的那次渲染中的值。例如依赖为 `[friendId]`，从 `1` 变成 `2` 时，旧清除函数退订 `1`，新回调订阅 `2`；如果依赖是 `[]`，则不会因 `friendId` 变化而重新订阅。

因此，空依赖 effect 可以用来表达“挂载时建立、卸载时清理”，但与类生命周期并非严格等价：开发环境的 Strict Mode 可能额外执行一次“建立 → 清理 → 建立”来检查清理逻辑；`useEffect` 的执行也不保证一定在浏览器绘制之后。

**总结：Fiber 保存和组织 Hook 数据，调用顺序保证数据对应正确，更新队列负责状态更新，提交后的 effect 处理负责副作用的建立与清理。**

参考：

## 参考文献
