## fiber
关联：[hooks](./Hooks.md)
### fiber概念
和虚拟DOM相关，fiber也是一个javascript对象：它代表了一个react的工作单元，包含与组件相关的工作信息。
如：
{
  type: 'h1',  // 组件类型
  key: null,   // React key
  props: { ... }, // 输入的props
  state: { ... }, // 组件的state (如果是class组件或带有state的function组件)
  child: Fiber | null,  // 第一个子元素的Fiber
  sibling: Fiber | null,  // 下一个兄弟元素的Fiber
  return: Fiber | null,  // 父元素的Fiber
  // ...其他属性
}