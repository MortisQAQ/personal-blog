## 1. javascript原型链
在javascript中，万物皆对象，而每一个对象都有一个原型对象（prototype）。
参考文档：https://segmentfault.com/a/1190000042725370
参考文档（MDN）：https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain

原型链继承存在的问题：
问题1：原型中包含的引用类型属性将被所有实例共享；
问题2：子类在实例化的时候不能给父类构造函数传参；

## 2. 对象是如何创建的
## 2.1 首先，什么是构造函数？
 在面向对象编程中，constructor概念用于创造对象的实例。（https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Classes/constructor）
 在js中，之前提到js是一种基于原型的语言。
 Object.prototype.constructor（https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/constructor）
 ## 2.2 我们怎样创建一个对象？
- 字面量方式
- 构造函数方式
举例：
```js
// 字面量方式
const obj1 = {
  name: 'obj1',
  age: 18,
}
// 构造函数方式
function Obj2(name, age) {
  this.name = name
  this.age = age
}
const obj2 = new Obj2('obj2', 18)
```
这两种方式都会在堆内存中创建一个新的对象，并将对象的引用赋值给变量。

> 构造函数就是常被 `new` 调用的那个函数。任何函数都可以作为构造函数。通过同一个构造函数创建出来的对象，会共享同一个原型，从而共享原型上的方法。

## 3. 什么是原型？为什么需要它？

在 JavaScript 中，每个对象从被创建开始，就与另一个对象产生了关联，并从这个对象上「继承」属性。这个被关联的对象，就是它的**原型（prototype）**。

一句话理清三层意义：
- **原型存在的意义** → 组成原型链；
- **原型链存在的意义** → 实现继承，让一个对象能访问另一个对象的属性和方法；
- **继承存在的意义** → 属性/方法共享，带来代码复用和可扩展性。

## 4. `prototype`、`__proto__`、`constructor` 三者的关系

这是理解原型的关键，很容易混淆，一定要分清：

### 4.1 `prototype`：只有函数才有
只有**函数**才拥有 `prototype` 属性，它指向一个对象。这个对象会成为「用 `new` 该函数创建出来的所有实例」的原型。

```js
function Person(name) {
  this.name = name
}
console.log(Person.prototype) // { constructor: Person }
```

### 4.2 `__proto__`：（几乎）所有对象都有
每个对象（包括函数、数组等引用类型）都有 `__proto__` 属性，它指向**创建该对象的构造函数的 `prototype`**。

```js
const person = new Person('Tom')
console.log(person.__proto__ === Person.prototype) // true
```

> ⚠️ `__proto__` 是非标准的历史遗留写法（虽然 ES6 已把它标准化，但仍不推荐直接使用）。规范中用内部槽 `[[Prototype]]` 表示对象的原型，推荐用 `Object.getPrototypeOf(obj)` 读取、`Object.setPrototypeOf(obj, proto)` 设置：
> ```js
> Object.getPrototypeOf(person) === person.__proto__ // true
> ```

**核心等式**：`实例.__proto__ === 构造函数.prototype`

### 4.3 `constructor`：从原型指回构造函数
每个原型对象（即 `构造函数.prototype`）默认都有一个 `constructor` 属性，指回它对应的构造函数。

```js
Person.prototype.constructor === Person // true
```

三者关系图（文字版）：
```
   Person (构造函数)
     │  prototype
     ▼
  Person.prototype ──constructor──► Person
     ▲
     │  __proto__
   person (实例)
```

## 5. 原型链的查找机制

当访问一个对象的属性时，引擎按如下顺序查找：

1. 先在对象**自身**查找；
2. 找不到，就去它的原型 `__proto__` 上找；
3. 还找不到，就沿着原型的原型继续向上找；
4. 直到 `Object.prototype`，如果仍然没有，就返回 `undefined`。

这条由 `__proto__` 一层层串起来的链，就叫**原型链**。

```js
function Person(name) {
  this.name = name
}
Person.prototype.sayName = function () {
  console.log(this.name)
}

const p = new Person('Tom')
p.sayName() // 'Tom'  自身没有 sayName，沿原型链在 Person.prototype 上找到
p.toString() // 自身、Person.prototype 都没有，最终在 Object.prototype 上找到
```

### 5.1 原型链的终点是 `null`
```js
p.__proto__ === Person.prototype             // true
Person.prototype.__proto__ === Object.prototype // true
Object.prototype.__proto__ === null          // true —— 原型链的终点
```
所以完整链条是：`p → Person.prototype → Object.prototype → null`。`Object.prototype.__proto__` 之所以是 `null`，是因为它是终点，否则会无限循环。

> 补充：原始类型（如字符串）也能「访问方法」，如 `"hello".toUpperCase()`，这是因为 JS 会临时把它包装成 `String` 对象，沿 `String.prototype` 查找方法，用完即销毁。

## 6. `new` 操作符做了什么

`new` 操作符执行时做了 4 件事：

1. 创建一个全新的空对象；
2. 把这个新对象的 `__proto__` 指向构造函数的 `prototype`；
3. 把构造函数内部的 `this` 绑定到新对象，并执行构造函数；
4. 如果构造函数返回了一个对象类型，就返回该对象；否则返回步骤 1 创建的新对象。

手写模拟：
```js
function newOperator(func, ...args) {
  if (typeof func !== 'function') {
    throw new TypeError('第一个参数必须是函数')
  }
  // 1&2. 创建新对象，并让其 __proto__ 指向 func.prototype
  const obj = Object.create(func.prototype)
  // 3. 绑定 this 并执行构造函数
  const result = func.apply(obj, args)
  // 4. 构造函数返回对象则用它，否则返回新建对象
  return result instanceof Object ? result : obj
}
```

## 7. `instanceof` 的原理

`instanceof` 用于判断「构造函数的 `prototype` 是否出现在对象的原型链上」，本质是一种原型链关系检测。

手写模拟：
```js
function myInstanceof(obj, Constructor) {
  let proto = Object.getPrototypeOf(obj) // 取对象的原型
  const target = Constructor.prototype   // 取构造函数的原型
  while (true) {
    if (proto === null) return false     // 到达原型链终点仍未匹配
    if (proto === target) return true    // 命中
    proto = Object.getPrototypeOf(proto) // 继续向上找
  }
}
```

## 8. 常见的继承方式

理解了原型链，就能理解 JS 里各种「继承」的本质。下面按演进顺序列出，逐步补足缺点。

### 8.1 原型链继承
让子类的 `prototype` 指向父类的一个实例。
```js
function Parent() {
  this.name = 'parent'
  this.colors = ['red', 'blue'] // 引用类型
}
Parent.prototype.say = function () {
  console.log('hi from parent')
}
function Child() {}
Child.prototype = new Parent()          // 核心
Child.prototype.constructor = Child     // 修复 constructor 指向

const c1 = new Child()
const c2 = new Child()
c1.colors.push('green')
console.log(c2.colors) // ['red','blue','green'] —— 被污染！
```
- 优点：实现简单，能复用父类原型上的方法。
- 缺点：① 父类的**引用类型属性被所有子实例共享**（一个改，全都变）；② 创建子实例时**无法给父构造函数传参**。

### 8.2 构造函数继承（借用构造函数）
在子构造函数里用 `call` / `apply` 调用父构造函数。
```js
function Parent(name) {
  this.name = name
  this.colors = ['red', 'blue']
}
function Child(name) {
  Parent.call(this, name) // 借用父构造函数，this 指向子实例
}
const c1 = new Child('Alice')
const c2 = new Child('Bob')
c1.colors.push('green')
console.log(c2.colors) // ['red','blue'] —— 各自独立
```
- 优点：属性各实例独立，不再共享；可以向父类传参。
- 缺点：**无法继承父类原型上的方法**（如 `Parent.prototype.say`）；方法若写在构造函数里，每个实例都会创建一份，浪费内存。

### 8.3 组合继承（最常用的经典方案）
「构造函数继承属性 + 原型链继承方法」，取二者之长。
```js
function Parent(name) {
  this.name = name
  this.colors = ['red', 'blue']
}
Parent.prototype.say = function () {
  console.log('hi, I am ' + this.name)
}
function Child(name, age) {
  Parent.call(this, name) // 第 2 次调用 Parent（继承属性，可传参、不共享）
  this.age = age
}
Child.prototype = new Parent()      // 第 1 次调用 Parent（继承方法）
Child.prototype.constructor = Child // 修复 constructor
```
- 优点：属性独立、可传参、方法可复用，解决了前两种的主要问题。
- 缺点：**父构造函数被调用了两次**（`new Parent()` 一次、`Parent.call` 一次），且 `Child.prototype` 上会残留一份多余的父类实例属性。

### 8.4 原型式继承
基于一个已有对象创建新对象（`Object.create` 的原理）。
```js
function createObj(proto) {
  function F() {}
  F.prototype = proto
  return new F()
}
// 等价于 ES5 的 Object.create(proto)
```
- 适合「不必创建构造函数、只想让一个对象继承另一个对象」的场景。
- 缺点：同原型链继承，引用类型属性仍会共享。

### 8.5 寄生式继承
在原型式继承的基础上，再增强这个对象（加方法），返回。
```js
function createEnhanced(proto) {
  const obj = Object.create(proto)
  obj.sayHi = function () { console.log('hi') } // 增强
  return obj
}
```
- 缺点：方法仍无法复用（每次都新建一份）。

### 8.6 寄生组合式继承（推荐，ES5 最优解）
组合继承的问题是「父构造函数调用两次」。寄生组合式用 `Object.create(Parent.prototype)` 生成一个「干净的中介原型」来替代 `new Parent()`，避免多余调用。这是《JavaScript 高级程序设计》推荐的最理想 ES5 继承方式。
```js
function Parent(name) {
  this.name = name
  this.colors = ['red', 'blue']
}
Parent.prototype.say = function () {
  console.log(this.name)
}
function Child(name, age) {
  Parent.call(this, name) // 只调用一次父构造函数
  this.age = age
}
// 关键：用干净的空对象做中介，其原型指向 Parent.prototype
Child.prototype = Object.create(Parent.prototype)
Child.prototype.constructor = Child // 修复 constructor

const child = new Child('Tom', 10)
child.say() // 'Tom'
```
- 优点：只调用一次父构造函数、原型链干净、属性不共享、方法可复用。综合最优。

### 8.7 ES6 `class extends`（语法糖）
ES6 的 `class` 只是原型继承的**语法糖**，底层仍是原型链，并没有引入新的继承模型。
```js
class Parent {
  constructor(name) {
    this.name = name
  }
  say() {
    console.log(this.name)
  }
}
class Child extends Parent {
  constructor(name, age) {
    super(name) // 相当于 Parent.call(this, name)
    this.age = age
  }
}
const child = new Child('Tom', 10)
child.say() // 'Tom'
```
- `extends` 建立原型链，`super()` 调用父类构造函数。写法清晰、贴近传统 OOP，实际项目中优先使用。理解其等价的原型写法有助于排查问题。

## 9. 小结

- 只有**函数**有 `prototype`；（几乎）所有**对象**都有 `__proto__`（`[[Prototype]]`）。
- 核心等式：`实例.__proto__ === 构造函数.prototype`；`构造函数.prototype.constructor === 构造函数`。
- 属性查找沿原型链逐级向上，终点是 `Object.prototype.__proto__ === null`。
- `new` 的本质：建对象 → 连原型 → 绑 this 执行 → 返回对象。
- 继承演进：原型链继承（共享/不能传参）→ 构造函数继承（不能复用方法）→ 组合继承（父类调两次）→ **寄生组合式继承（ES5 最优）**→ **`class extends`（ES6 语法糖，推荐）**。
