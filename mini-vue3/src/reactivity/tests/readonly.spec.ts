import { readonly, isReadonly, isProxy } from '../reactive'

describe('readonly', () => {
  it('should make nested object readonly', () => {
    const original = { foo: 1, bar: { baz: 2 } }
    const wrapped = readonly(original)
    // 只读对象，不能修改。
    expect(wrapped).not.toBe(original)
    expect(wrapped.foo).toBe(1)
    expect(isReadonly(wrapped)).toBe(true)
    // 只读对象具有嵌套特性。
    expect(isReadonly(wrapped.bar)).toBe(true)
    expect(isReadonly(original.bar)).toBe(false)
    expect(isReadonly(original)).toBe(false)
    // 基于 Proxy
    expect(isProxy(wrapped)).toBe(true)
    
  })

  it('should call console warn when set', () => {
    // set 发出警告。
    console.warn = jest.fn()
    const user = readonly({
      age: 10,
    })
    user.age = 11
    expect(console.warn).toBeCalled()
  })
})
