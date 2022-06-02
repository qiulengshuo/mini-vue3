import { h } from "../../lib/mini-vue3.esm.js"

export const App = {
  render () {
    return h("div", {
      id: "root",
      class: ["red", "hard"]
    },
      [h("p", { class: "red" }, "hi"), h("p", { class: "blue" }, "mini-vue3")])
  },
  setup () {
    return {
      msg: "mini-vue"
    }
  }
}