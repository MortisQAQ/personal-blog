## 1. javascript的模块化
- [模块概念](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Modules)
- [模块发展历程](https://segmentfault.com/a/1190000017466120)
- 什么是模块?将一个复杂的程序依据一定的规则(规范)封装成几个块(文件)。并进行组合在一起，块的内部数据与实现是私有的, 只是向外部暴露一些接口(方法)与外部其它模块通信
- 也就是说：每个文件都有一个作用域（模块作用域）
## 2. require和import
-[require和import的区别](https://zhuanlan.zhihu.com/p/121770261)
- 静态 import 在 HTML/JS 解析早期就被模块解析器识别，浏览器可并行下载模块图并尽早构建模块依赖图，从而更早完成解析与可能的渲染准备。 
- 动态 import() / require 只有在运行到那行代码时才发起网络请求；在 SPA 中首次切换到懒组件会出现短暂加载（除非已预取）。 require（Node/打包器语境）通常是同步执行（阻塞当前执行流）。