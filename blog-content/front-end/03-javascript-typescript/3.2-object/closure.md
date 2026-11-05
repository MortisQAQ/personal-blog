# 面试官：说说你对闭包的理解？闭包使用场景


[MDN 闭包](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Closures)
### 前缀 [词法环境](https://zhuanlan.zhihu.com/p/644004151)
## 一、是什么
 
一个函数和对其周围状态（lexical environment，词法环境，一个运行时数据结构，用来实现作用域）的引用捆绑在一起（或者说函数被引用包围），这样的组合就是闭包（closure）

也就是说，闭包让你可以在一个内层函数中访问到其外层函数的作用域
每次渲染都会创建一个新的函数执行上下文
组件内部定义的函数会形成闭包
React 的 Hooks 机制依赖闭包来保存状态与变量
在 `JavaScript `中，每当创建一个函数，闭包就会在函数创建的同时被创建出来，作为函数内部与外部连接起来的一座桥梁
也因此，可以用闭包来实现私有方法和私有变量。
下面给出一个简单的例子

```js
function init() {
    var name = "Mozilla"; // name 是一个被 init 创建的局部变量
    function displayName() { // displayName() 是内部函数，一个闭包
        alert(name); // 使用了父函数中声明的变量
    }
    displayName();
}
init();
```

`displayName()` 没有自己的局部变量。然而，由于闭包的特性，它可以访问到外部函数的变量



## 二、使用场景

任何闭包的使用场景都离不开这两点：

- 创建私有变量
- 延长变量的生命周期

> 一般函数的词法环境在函数返回后就被销毁，但是闭包会保存对创建时所在词法环境的引用，即便创建时所在的执行上下文被销毁，但创建时所在词法环境依然存在，以达到延长变量的生命周期的目的


下面举个例子：

在页面上添加一些可以调整字号的按钮

```js
function makeSizer(size) {
  return function() {
    document.body.style.fontSize = size + 'px';
  };
}

var size12 = makeSizer(12);
var size14 = makeSizer(14);
var size16 = makeSizer(16);
//12,14,16在makeSizer函数执行结束后本应被销毁，但因为闭包的存在，它们的词法环境依然存在，所以可以正常使用
document.getElementById('size-12').onclick = size12;
document.getElementById('size-14').onclick = size14;
document.getElementById('size-16').onclick = size16;
```



### 柯里化函数

柯里化的目的在于避免频繁调用具有相同参数函数的同时，又能够轻松的重用

```js
// 假设我们有一个求长方形面积的函数
function getArea(width, height) {
    return width * height
}
// 如果我们碰到的长方形的宽老是10
const area1 = getArea(10, 20)
const area2 = getArea(10, 30)
const area3 = getArea(10, 40)

// 我们可以使用闭包柯里化这个计算面积的函数
function getArea(width) {
    return height => {
        return width * height
    }
}

const getTenWidthArea = getArea(10)
// 之后碰到宽度为10的长方形就可以这样计算面积
const area1 = getTenWidthArea(20)

// 而且如果遇到宽度偶尔变化也可以轻松复用
const getTwentyWidthArea = getArea(20)
```



### 使用闭包模拟私有方法

在`JavaScript`中，没有支持声明私有变量，但我们可以使用闭包来模拟私有方法
也就是说，闭包可以创建私有变量，而这些变量只能通过闭包暴露的公共方法来访问

下面举个例子：

```js
var Counter = (function() {
  var privateCounter = 0;
  function changeBy(val) {
    privateCounter += val;
  }
  return {
    increment: function() {
      changeBy(1);
    },
    decrement: function() {
      changeBy(-1);
    },
    value: function() {
      return privateCounter;
    }
  }
})();

var Counter1 = makeCounter();
var Counter2 = makeCounter();
console.log(Counter1.value()); /* logs 0 */
Counter1.increment();
Counter1.increment();
console.log(Counter1.value()); /* logs 2 */
Counter1.decrement();
console.log(Counter1.value()); /* logs 1 */
console.log(Counter2.value()); /* logs 0 */
```

上述通过使用闭包来定义公共函数，并令其可以访问私有函数和变量，这种方式也叫模块方式

两个计数器 `Counter1` 和 `Counter2` 是维护它们各自的独立性的，每次调用其中一个计数器时，通过改变这个变量的值，会改变这个闭包的词法环境，不会影响另一个闭包中的变量



### 其他

例如计数器、延迟调用、回调等闭包的应用，其核心思想还是创建私有变量和延长变量的生命周期



## 三、注意事项

如果不是某些特定任务需要使用闭包，在其它函数中创建函数是不明智的，因为闭包在处理速度和内存消耗方面对脚本性能具有负面影响

例如，在创建新的对象或者类时，方法通常应该关联于对象的原型，而不是定义到对象的构造器中。

原因在于每个对象的创建，方法都会被重新赋值

```js
function MyObject(name, message) {
  this.name = name.toString();
  this.message = message.toString();
  this.getName = function() {
    return this.name;
  };

  this.getMessage = function() {
    return this.message;
  };
}
```

上面的代码中，我们并没有利用到闭包的好处，因此可以避免使用闭包。修改成如下：

```js
function MyObject(name, message) {
  this.name = name.toString();
  this.message = message.toString();
}
MyObject.prototype.getName = function() {
  return this.name;
};
MyObject.prototype.getMessage = function() {
  return this.message;
};
```

## 四、为什么 JavaScript 会发展出闭包这种能力？

前面讲的都是"闭包是什么、怎么用"。这一节回答两个更根本的"为什么"：**为什么闭包会存在**，以及**为什么当年到处都是 `(function(){ ... })()` 这种立刻执行函数（IIFE）**。

### 4.1 闭包不是被"发明"的语法，而是两条设计的必然结果

理解 JS 的设计出身，才能理解闭包为什么一定存在。JS 是 Brendan Eich 在很短时间内做出来的：

- 语法外壳借了 Java/C 的样式，所以看起来像一门"正经的面向对象语言"；
- 内核其实是函数式的，更像 Scheme：**函数是一等公民（first-class function）**、采用**词法作用域（lexical scope）**；
- 对象继承则另辟蹊径，用了 Self 语言的原型继承。

其中和闭包直接相关的两条是：

1. **词法作用域**：函数能访问的变量，由它在代码里"写在哪儿"决定，而不是由"谁调用它"决定。
2. **函数是一等公民**：函数本身是对象，可以赋值、当参数传、当返回值返回，可以"离开出生地"。

单独有第 1 条不算问题，单独有第 2 条也不算问题。但两条同时成立时，语言就**必须**回答一个问题：

> 一个函数被返回、被传递出去以后，它还能不能访问自己定义时所在作用域里的变量？

如果答案是"不能"，那把函数传出去几乎是废的——回调、柯里化、状态保存全都做不了。所以答案只能是"能"，而这个"能"的实现方式，就叫**闭包**。

换句话说，闭包并不是额外加的语法糖，而是"词法作用域 + 一等函数"这两个设计同时存在时，必然要解决的变量捕获问题。这也是为什么闭包不需要任何关键字，函数一创建，它就存在了。

**那当初为什么非要有一等函数？** 不是为了让语言看起来高级。Brendan Eich 后来在 Lex Fridman 的播客里回忆：浏览器是**单线程**的，不能阻塞用户界面，所以必须用回调（callback）把代码"留到稍后再执行"；而当时的 Java 还没有一等函数 / lambda，他只能自己把函数做成可以传递的值。他还特意提到，自己刻意没有走 Scheme 里更复杂的 `call/cc`（续延）那条路，只做了"函数能当参数传下去、之后再回调回来"这一层。

也就是说：**一等函数是为了解决浏览器单线程下的异步回调问题才引入的，闭包是它顺带带来的结果。** 有了这条动因，"闭包为什么必然存在"就有了最实在的解释。

> 顺带一个历史坑：早期 JS 的捕获是"引用捕获"，同一次调用里的所有内层函数共享同一个变量环境。这就是著名的 `for (var i ...)` 里每个回调都打印同一个 `i` 的根源。ES6 用 `let` 给每次循环迭代生成独立环境，才从语言层面修掉它。

### 4.2 早期 JS 缺了两样东西，只能拿函数来补

闭包本身是自然产物，但当年那种"万物皆 IIFE"的写法，是被逼出来的。ES6（2015）之前，JS 缺两个关键能力：

| 缺少的能力 | 当时的处境 | 当时的土办法 |
| --- | --- | --- |
| 块级作用域 | 只有 `var`，只有函数能造出新作用域；`if`/`for` 的 `{}` 不算 | 用函数造作用域 |
| 模块系统 | 没有 `import`/`export`，多个 `<script>` 共享同一个全局对象 | 用闭包造私有命名空间 |

两条补丁合起来，就是 **IIFE + 模块模式**：

```js
(function() {
  var name = 'Mozilla';      // 只活在这个函数作用域里，外部拿不到
  function privateFn() {}
  window.myLib = { foo: 1 }; // 只把想公开的东西挂出去
})();
```

一层匿名函数包住一段代码并立刻执行，就得到了一个"立刻生效的私有作用域"。

> 名字的小历史：这种写法最早叫"自执行匿名函数（self-executing anonymous function）"，后来 Ben Alman 提出 **IIFE（Immediately Invoked Function Expression）** 这个更准确的叫法并被广泛接受。旧名字之所以站不住脚，一是 IIFE 不一定是匿名的，二是 ES5 严格模式禁用了 `arguments.callee`，"自执行"这个描述就没有实现依据了。维基百科给它的定义很精准：**IIFE 是一种用"函数作用域"制造出词法作用域的习惯写法**，在 JavaScript 里它流行于 CommonJS 和 ES Module 出现之前，用来支撑模块化编程。

### 4.3 IIFE 具体解决了什么

- **避免全局污染**：多个脚本共享 `window`，用 IIFE 把变量关在函数里，不往全局挂。
- **模拟模块与命名空间**：闭包里的变量外部不可见，只暴露一个接口对象，这就是"模块方式"（和第二节模拟私有方法的写法同源）。
- **给每次循环创建独立环境**：`for (var i ...)` 的闭包共享问题，靠外层再包一层 IIFE 把当前 `i` 存下来。
- **参数注入的实用技巧**：把 `window`、`undefined`、jQuery 等当参数传进去，一是缩短标识符利于压缩，二是在非严格模式下防住 `undefined` 被改写——这类做法现在已经没必要了。

```js
// 经典写法：把当前 i 通过参数"冻结"进新作用域
for (var i = 0; i < 3; i++) {
  (function(j) {
    setTimeout(function() { console.log(j); }, 0); // 0 1 2
  })(i);
}
```

### 4.4 ES6 之后：这些能力被"正规化"了

ES6 之后，很多"用函数打补丁"的需求，语言直接给了原生能力：

- `let` / `const` 补上**块级作用域** → 不用再拿函数模拟 `{}`，for 循环问题也自动消失；
- ES Module 补上**模块系统** → 不用再拿 IIFE 模拟命名空间；
- `class` 加 `#` 私有字段补上**语言级私有** → 不用再拿闭包模拟私有。

但要注意：**闭包本身没有被取代**。状态保存、柯里化、事件回调、React Hooks 保存状态依然全靠它。

IIFE 也没有完全消失，只是用途变窄了，今天还能用在这些地方：

- 需要**立刻执行**、又不想污染外层作用域的初始化代码；
- 需要一段**私有作用域**，只对外暴露一个返回值或一个接口对象；
- 顶层 `await` 的包装（`(async () => { ... })()`）；
- 维护大量依赖 IIFE 的老代码。

反过来说，**什么时候不该用**：已经在用 ES Module 时，以及更直白的代码就够用时，就没必要再套一层 IIFE——它解决的是历史缺口，不是通用写法。

## 五、闭包私有 vs 面向对象私有：效果像，但思维坐标系不同

结论先说：两者都在回答"怎么把内部状态藏起来、只留一个受控的出口"，所以**达到的效果相似**；但在"私有"这件事从哪来、由谁定义上，走的是两套完全不同的坐标系。

### 5.1 同一个计数器，两种写法

闭包版（依赖词法作用域的不可达）：

```js
function makeCounter() {
  let count = 0;                 // 外部拿不到
  return {
    inc() { count++; },          // 特权方法：能访问私有，又被暴露
    value() { return count; }
  };
}
const c = makeCounter();
c.count;  // undefined
```

面向对象版（依赖语言的访问控制）：

```js
class Counter {
  #count = 0;                    // 语言级私有字段
  inc() { this.#count++; }
  value() { return this.#count; }
}
const c = new Counter();
c.#count; // SyntaxError：语法层面就不可达
```

### 5.2 差异对照

| 维度 | 闭包私有 | 面向对象私有（`private` / `#`） |
| --- | --- | --- |
| 私有的来源 | 词法作用域**物理不可达**（外面引用不到那份环境记录） | 语言/编译器**声明的访问控制** |
| 归属单位 | 一次函数调用产生的**环境** | **类的定义/实例** |
| 谁能访问 | 所有在定义处**词法嵌套**的代码都能访问 | 只有类内部代码能访问 |
| 边界由什么决定 | 代码的**嵌套结构** | `public` / `private` **修饰符** |
| 对外暴露方式 | 主动返回的闭包函数（特权方法） | `public` 成员间接暴露 |
| 存储位置 | 每个闭包环境一份 | 每个实例一份 |

### 5.3 思维上的根本差异

- **面向对象是"先声明边界"**：先定义类型，用修饰符划出可见性范围，实例是这个边界内数据的载体。私有性由**声明**决定，是写在契约里的约定。
- **闭包是"结构决定可达"**：先有函数嵌套，代码能不能碰某个变量，取决于它在不在那层词法作用域里。私有不是被声明出来的，而是"**没人能从外面引用它**"这个结构的副产品。

由此带来几个容易被忽略的结果：

1. 闭包私有挡不住**同一词法作用域内的其他代码**（它们本来就在范围内）；而 `#` 字段是真正对外语法不可达。
2. 闭包私有的单位是**调用**而非实例。用构造函数 + 闭包实现私有方法时，每个实例都会拿到一份函数副本，这和"方法挂在原型上共享"是矛盾的——这也是那类写法内存代价较高的原因（第三节已经提到）。
3. `#` 也不是没有代价：私有字段**无法被 Proxy 拦截**，也**拿不到反射能力**——`Object.keys()`、`Object.defineProperty()` 这类手段对它无效。也就是说，"更强的私有"换来的是"更弱的可操作性"。

MDN 的措辞很能说明问题：**在 `class` 出现之前，JavaScript 没有原生声明私有方法的方式，只能用闭包去"模拟（emulate）"**。所以严格讲，闭包私有是"缺少语言支持时的等价替代"，`#` 才是这门语言后来长出来的原生私有。

一句话总结：**效果像，是因为两者都在做信息隐藏；本质不同，是因为 JS 用的是"作用域与可达性"这套坐标系，面向对象用的是"类型与访问修饰符"这套坐标系。** 理解了这一点，也就理解了 JS 后来为什么要补 `let`/`const`、`class`、`#` 私有字段和 ES Module——不是换了一套哲学，而是把当年"用函数作用域打补丁"的能力，正式提升为语言特性。

## 参考来源

- [MDN：闭包（Closures）](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Closures) —— 词法作用域、用闭包模拟私有方法、IIFE 与私有计数器
- [MDN 术语表：IIFE](https://developer.mozilla.org/en-US/docs/Glossary/IIFE)
- [Wikipedia：Immediately invoked function expression](https://en.wikipedia.org/wiki/Immediately_invoked_function_expression) —— IIFE 的命名史，以及"用函数作用域制造词法作用域"的定义
- [Wikipedia：JavaScript](https://en.wikipedia.org/wiki/JavaScript) —— 一等函数与词法闭包
- [Brendan Eich, Lex Fridman Podcast #160](https://www.youtube.com/watch?v=krB0enBeSiE) —— 为何引入一等函数（单线程下的回调需求，刻意避开 Scheme 的 `call/cc`）
- [JavaScript Isn't Scheme](https://journal.stuffwithstuff.com/2013/07/18/javascript-isnt-scheme/) —— 讨论 JS 的作用域并非纯 Scheme 式
- [W3Schools：JavaScript IIFE](https://www.w3schools.com/JS/js_function_iife.asp) —— ES6 之后 IIFE 仍然适用的场景