import { h } from "../../lib/mini-vue3.esm.js"
import { Foo } from "./Foo.js"

export const App = {
  name: "App",
  render () {
    // emit
    return h("div", {}, [
      h("div", {}, "App"),
      h(Foo, {
        // 支持 emit 传参
        // add -> onAdd
        onAdd (a, b) {
          console.log("onAdd", a, b)
        },
        // 支持 add-foo 的事件命名
        // add-foo -> onAddFoo
        onAddFoo () {
          console.log("onAddFoo")
        },
      }),
    ])
  },

  setup () {
    return {}
  },
}