import { reactive } from '../reactive'
import { effect } from '../effect'

describe('effect', () => {
  it('happy path', () => {
    const user = reactive({ age: 10 })
    let nextAge

    // 验证 effect 的存在并且执行 effect 参数里的函数
    effect(() => {
      nextAge = user.age + 1
    })
    expect(nextAge).toBe(11)

    // 依赖更新，自动触发 effect 参数里的函数
    user.age++
    expect(nextAge).toBe(12)
  })
})
