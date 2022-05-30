import { readonly, isReadonly } from '../reactive'

describe('readonly', () => {
  it('should make nested object readonly', () => {
    const original = { foo: 1, bar: { baz: 2 } }
    const wrapped = readonly(original)
    // 只读对象，不能修改。
    expect(wrapped).not.toBe(original)
    expect(isReadonly(wrapped)).toBe(true)
    expect(isReadonly(original)).toBe(false)
    expect(wrapped.foo).toBe(1)
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
