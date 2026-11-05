//参考：https://jinxi1334640772.github.io/tools/questions/handwrite
//1. 解析字符串
function parseQueryWithURL(url) {
  const u = new URL(url);
  // url：https://developer.mozilla.org/zh-CN/docs/Web/API/URL
  const params = Object.create(null);
  // Object.create(null) 和 {} 区别：
  // 1. Object.create(null) 没有原型链，不会继承任何方法（如toString）
  for (const [key, value] of u.searchParams) {
    if (params.hasOwnProperty(key)) {
      // 已存在则转为数组或追加
      if (!Array.isArray(params[key])) params[key] = [params[key]];
      params[key].push(value);
    } else {
      params[key] = value;
    }
  }
  return params;
}
// 示例
parseQueryWithURL('https://example.com/page?x=1&y=2&x=3');
// => { x: ['1','3'], y: '2' }
// 如果使用split实现，需要处理重复键的情况
function parseQueryWithSplit(url) {
  const params = Object.create(null);
  const query = url.split('?')[1];
  //上一行有潜在的安全问题：没有对输入url做检查
  if (!query) return params;
  for (const pair of query.split('&')) {
    const [key, value] = pair.split('=');
    if (params.hasOwnProperty(key)) {
      // 已存在则转为数组或追加
      if (!Array.isArray(params[key])) params[key] = [params[key]];
      params[key].push(value);
    } else {
      params[key] = value;
    }
  }
  return params;
}
//2. 手写new
function myNew(Fun, ...args) {
// 1. 创建一个新对象
let obj = {};

// 2. 将新对象的原型指针指向构造函数的原型属性
obj.__proto__ = Fun.prototype;

// 3. 改变 this 指向，并且执行构造函数内部的代码（传参）
let res = Fun.apply(obj, args);

// 4. 判断函数执行结果的类型
return res instanceof Object ? res : obj;
}
