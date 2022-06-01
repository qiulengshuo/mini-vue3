import { computed } from '../computed'
import { reactive } from '../reactive'

describe('computed', () => {
  it('happy path', () => {
    const user = reactive({
      age: 1,
    })

    // 返回一个类似于 ref 的实现对象
    const age = computed(() => {
      return user.age
    })

    expect(age.value).toBe(1)
  })

  it('should compute lazily', () => {
    const value = reactive({
      foo: 1,
    })
    const getter = jest.fn(() => {
      return value.foo
    })
    const cValue = computed(getter)

    // lazy
    // 如果计算属性的值 cValue，没有被 get，则 fn 不需要调用。
    expect(getter).not.toHaveBeenCalled()

    expect(cValue.value).toBe(1)
    expect(getter).toHaveBeenCalledTimes(1)

    // 用变量实现缓存
    cValue.value // get
    expect(getter).toHaveBeenCalledTimes(1)

    // 即使依赖值改变，也不执行 fn
    value.foo = 2
    expect(getter).toHaveBeenCalledTimes(1)

    // 除非手动 get，才调用 fn
    expect(cValue.value).toBe(2)
    expect(getter).toHaveBeenCalledTimes(2)

    // 用变量实现缓存
    cValue.value
    expect(getter).toHaveBeenCalledTimes(2)
  })
})
