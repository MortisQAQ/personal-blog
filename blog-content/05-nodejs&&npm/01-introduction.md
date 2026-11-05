## introduction
### 1. nodejs是什么？
- 就好像c语言运行需要编译器（gcc），java需要jvm，javascript一样需要运行时环境。
- 这个环境可以由浏览器提供，也可以是nodejs。
- nodejs可以在服务端运行javascript代码，因为它集成了v8引擎。

### 2. 架构
![Nodejs架构图](https://picx.zhimg.com/v2-6b52c363de57fc7e48c113d1bbc562f1_r.jpg)
底层：
- v8引擎：chromium浏览器的javascript引擎，用于执行javascript代码。
- libuv：异步事件循环，用于处理异步事件。
- 其他
### 3.工作机制
我们通常说NodeJS是单线程的，在单线程的情况下NodeJs通过事件循环来处理异步事件。
总的来讲，NodeJS的事件循环与一般JS类似，但更加细致，参考：https://juejin.cn/post/7209698674905382973
## 4.历史来源
### 4.1 commonJS
javascript一开始只是一个简单的脚本语言，只考虑在浏览器里运行，代码靠一堆`<script>` 标签按顺序塞进 同一个全局作用域 ，没有模块概念，没有依赖管理。文件一多就靠命名约定和 IIFE 硬撑。具体见[模块化的演进](../front-end/03-javascript-typescript/模块化/1-模块化的演进.md)。
但后续，大家想要在服务端运行javascript代码。

#### 为什么需要一份「公共规范」

- 想让 javascript 跑在服务端，就得有读文件、发网络请求、处理二进制数据的能力，而这些浏览器都没提供。
- 早期确实有人做服务端 javascript（Rhino、Narwhal、Helma 等），但**各家用各自的加载方式和各自的 API**，同一段代码换个运行时就跑不起来。
- 所以社区真正缺的不是「某个运行时的模块方案」，而是一份**大家都认同的公共 API 契约**。

#### 时间线

- 2009 年 1 月，Mozilla 工程师 Kevin Dangoor 发表《What Server Side JavaScript needs》，并发起 **ServerJS** 项目组，目标是给浏览器之外的 javascript 定一套标准。
- 2009 年 8 月，项目改名为 **CommonJS**。因为它的目标不只是服务端，而是「浏览器之外的所有 javascript 运行环境」，`Common` 强调的是通用性。
- 2009 年，Ryan Dahl 启动 **Node.js**，其模块实现参照了 CommonJS 的 `Modules/1.0` 规范（也就是我们熟悉的 `require` / `module.exports`）。
- 2010—2011 年，浏览器端出现 AMD / RequireJS 等异步方案，因为 CommonJS 的同步加载不适合网络环境。

#### 两个容易记错的点

- **CommonJS 不等于「模块规范」**。它是一整套「浏览器外 javascript 该有什么 API」的清单，包括 `Modules/1.0`（模块）、`fs`、`stream`、`buffer`、`io` 等。我们平时说的 `require` / `module.exports` 只是其中的模块部分。
- **它不是 ECMAScript 的官方标准**。CommonJS 不属于 TC39 的工作范畴，只是有部分 TC39 成员参与了制定。正因为它只是「民间约定」，后来才需要 ES Modules 从语言层面官方收编。

#### 留下的伏笔：为什么 `require` 是同步的
- 服务端读模块就是读本地磁盘文件，同步阻塞几毫秒可以接受，换来的是写法极简。
- 但浏览器里「读模块」意味着发网络请求，同步会卡死主线程，所以浏览器侧只能另起异步方案（AMD / CMD），最终走向 ES Modules。
- 这条「同步 vs 异步」的分叉，是理解后面各种模块规范演进的主要线索。