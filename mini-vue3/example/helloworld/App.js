import { h } from "../../lib/mini-vue3.esm.js"

window.self = null
export const App = {
  render () {
    window.self = this
    return h("div", {
      id: "root",
      class: ["red", "hard"]
    },
      // [h("p", { class: "red" }, "hi"), h("p", { class: "blue" }, "mini-vue3")]
      "hello " + this.msg
    )
  },
  setup () {
    return {
      msg: "mini-vue3"
    }
  }
}