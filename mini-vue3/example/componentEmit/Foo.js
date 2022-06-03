import { h } from "../../lib/mini-vue3.esm.js"

export const Foo = {
  setup (props, { emit }) {
    const emitAdd = () => {
      console.log("emit add")
      // 触发拥有整个 Foo 组件对象的 instance 组件实例上的事件。
      emit("add", 1, 2)
      emit("add-foo")
    }

    return {
      emitAdd,
    }
  },
  render () {
    // 点击按钮触发 emitAdd
    const btn = h(
      "button",
      {
        onClick: this.emitAdd,
      },
      "emitAdd"
    )
    
    const foo = h("p", {}, "foo")

    return h("div", {}, [foo, btn])
  },
}