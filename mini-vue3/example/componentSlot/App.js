import { h } from "../../lib/mini-vue3.esm.js"
import { Foo } from "./Foo.js"
import { createTextVNode } from '../../lib/mini-vue3.esm.js'

export const App = {
  name: "App",
  render () {
    const app = h("div", {}, "App")
    // 3.object key
    const foo = h(
      Foo,
      {},
      {
        header: ({ age }) => [
          h("p", {}, "header" + age),
          createTextVNode("你好呀")
        ],
        footer: () => h("p", {}, "footer"),
      }
    )
    // 1.数组
    // const foo = h(Foo, {}, [h("p", {}, "123")]);
    // 2.vnode
    // const foo = h(Foo, {}, h("p", {}, "123"));
    return h("div", {}, [app, foo])
  },

  setup () {
    return {}
  },
}