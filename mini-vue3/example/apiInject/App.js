// 组件 provide 和 inject 功能
import { h, provide, inject } from "../../lib/mini-vue3.esm.js"

const Provider = {
  name: "Provider",
  setup () {
    // 提供 foo 和 bar
    provide("foo", "fooVal")
    provide("bar", "barVal")
  },
  render () {
    return h("div", {}, [h("p", {}, "Provider"), h(ProviderTwo)])
  },
}

const ProviderTwo = {
  name: "ProviderTwo",
  setup () {
    // 提供 foo
    provide("foo", "fooTwo")
    // 使用父组件 Provider 提供的 foo
    const foo = inject("foo")

    return {
      foo,
    }
  },
  render () {
    return h("div", {}, [
      h("p", {}, `ProviderTwo foo:${this.foo}`),
      h(Consumer),
    ])
  },
}

const Consumer = {
  name: "Consumer",
  setup () {
    // 使用祖先组件 Provider 的 foo，和父组件 ProviderTwo 的 bar。
    const foo = inject("foo")
    const bar = inject("bar")
    // 如果上层组件没有注入，那么该组件可以设置默认值，可以是单值，也可以是函数的返回值。
    // const baz = inject("baz", "bazDefault");
    const baz = inject("baz", () => "bazDefault")

    return {
      foo,
      bar,
      baz,
    }
  },

  render () {
    return h("div", {}, `Consumer: - ${this.foo} - ${this.bar}-${this.baz}`)
  },
}

export default {
  name: "App",
  setup () { },
  render () {
    return h("div", {}, [h("p", {}, "apiInject"), h(Provider)])
  },
}