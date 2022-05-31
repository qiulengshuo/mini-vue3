import { isReactive, isReadonly, isProxy, reactive } from '../reactive'

describe('reactive', () => {
  it('happy path', () => {
    // 验证 proxy 的存在
    const original = { foo: 1 }
    const observed = reactive(original)
    expect(original).not.toBe(observed)
    expect(isReactive(observed)).toBe(true)
    // reactive 不是只读
    expect(isReadonly(original)).toBe(false)
    // 基于 proxy
    expect(isProxy(observed)).toBe(true)
  })
  test('nested reactives', () => {
    // 嵌套的响应式对象
    const original = {
      nested: {
        foo: 1,
      },
      array: [{ bar: 2 }],
    }
    const observed = reactive(original)
    expect(isReactive(observed.nested)).toBe(true)
    expect(isReactive(observed.array)).toBe(true)
    expect(isReactive(observed.array[0])).toBe(true)
  })
})
