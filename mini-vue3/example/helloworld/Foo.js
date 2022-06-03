import { h } from "../../lib/mini-vue3.esm.js"

export const Foo = {
  setup (props) {
    // props.count
    // shallowReadonly
    console.log(props)

    props.count++
    console.log(props)
  },
  render () {
    return h("div", {}, "Foo: " + this.count)
  }
}