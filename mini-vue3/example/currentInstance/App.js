import { h, getCurrentInstance } from "../../lib/mini-vue3.esm.js"
import { Foo } from "./Foo.js"

export const App = {
  name: "App",
  render () {
    return h("div", {}, [h("p", {}, "currentInstance demo"), h(Foo)])
  },

  setup () {
    // getCurrentInstance 一定是在 setup 函数内调用，用来获取 当前组件实例。
    const instance = getCurrentInstance()
    console.log("App:", instance)
  },
}