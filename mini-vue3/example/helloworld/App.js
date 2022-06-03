import { h } from "../../lib/mini-vue3.esm.js"
import { Foo } from "./Foo.js"

window.self = null
export const App = {
  name: "App",
  render () {
    window.self = this
    return h("div", {
      id: "root",
      class: ["red", "hard"],
      onClick () {
        console.log("click")
      },
      onMousedown () {
        console.log("mousedown")
      }
    },
      // [h("p", { class: "red" }, "hi"), h("p", { class: "blue" }, "mini-vue3")]
      // "hello " + this.msg
      [h("div", {}, "hi " + this.msg), h(Foo, { count: 1 })]
    )
  },
  setup () {
    return {
      msg: "mini-vue3"
    }
  }
}