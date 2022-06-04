import { h, renderSlots } from "../../lib/mini-vue3.esm.js"

export const Foo = {
  setup () {
    return {}
  },
  render () {
    const foo = h("p", {}, "foo")

    // Foo .vnode .children
    console.log(this.$slots)
    // children -> function -> () -> vnode

    // 具名插槽
    // 1. 获取到要渲染的元素 父组件：{ key }
    // 2. 要获取到渲染的位置 子组件内部：name

    // 默认插槽
    // 1. 父组件 key 为 default
    // 2. 子组件 name 为 default

    // 作用域插槽
    // 1. 子组件通过对象 { key: value } 把数据传出去
    // 2. 父组件通过函数参数对象获取到数据。

    // 三种插槽
    // 父组件 包含插槽函数的对象
    // 子组件 renderSlots()
    const age = 18
    return h("div", {}, [
      // renderSlots() 返回 vnode 或 div 包含着的 vnode 数组
      renderSlots(this.$slots, "header", {
        age,
      }),
      foo,
      renderSlots(this.$slots, "footer"),
    ])
  },
}