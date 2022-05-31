import { isReadonly, shallowReadonly } from '../reactive'

describe('shallowReadonly', () => {
  test('should not make non-reactive properties reactive', () => {
    // 对于嵌套的内部对象 不应该去 readonly，而是一个普通的对象。
    const props = shallowReadonly({ n: { foo: 1 } })
    expect(isReadonly(props)).toBe(true)
    expect(isReadonly(props.n)).toBe(false)
  })

  it('should call console.warn when set', () => {
    console.warn = jest.fn()
    const user = shallowReadonly({
      age: 10,
    })
    // shallowReadonly 的表层去 set 会和 readonly 一样，发出警告。
    user.age = 11
    expect(console.warn).toHaveBeenCalled()
  })
})
