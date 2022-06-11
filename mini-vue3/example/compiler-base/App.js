import { ref } from "../../lib/mini-vue3.esm.js"

export const App = {
  name: "App",
  template: `<div>hi,{{message}}</div>`,
  setup () {
    let message = (window.message = ref("mini-vue3"))
    return {
      message
    }
  },
}