import { ref, isRef, unRef, proxyRefs } from '../ref'
import { effect } from '../effect'
import { reactive } from '../reactive'

describe('ref', () => {
  it('happy path', () => {
    const a = ref(1)
    expect(a.value).toBe(1)
  })

  it('should be reactive', () => {
    const a = ref(1)
    let dummy
    let calls = 0
    effect(() => {
      calls++
      dummy = a.value
    })
    expect(calls).toBe(1)
    expect(dummy).toBe(1)
    a.value = 2
    expect(calls).toBe(2)
    expect(dummy).toBe(2)
    // same value should not trigger
    a.value = 2
    expect(calls).toBe(2)
    expect(dummy).toBe(2)
  })

  it('should make nested properties reactive', () => {
    const a = ref({
      count: 1,
    })
    let dummy
    effect(() => {
      dummy = a.value.count
    })
    expect(dummy).toBe(1)
    a.value.count = 2
    expect(dummy).toBe(2)
  })

  it('isRef', () => {
    // 判断是不是 ref
    const a = ref(1)
    expect(isRef(a)).toBe(true)
    // reactive 不是 ref
    const obj = reactive({ age: 11 })
    expect(isRef(obj)).toBe(false)
    // 不经过处理的类型不算 ref
    expect(isRef(1)).toBe(false)
  })

  it('unRef', () => {
    // unRef 返回 .value 的值
    const a = ref(2)
    expect(unRef(a)).toBe(2)
    // 如果不是 ref ，返回值本身
    expect(unRef(1)).toBe(1)
  })

  it('proxyRefs', () => {
    const user = {
      age: ref(10),
      name: 'xiaohong',
    }
    // 相当于加了 proxy，只不过里面如果有 ref，用 unRef 省去 .value。
    // get
    const proxyUser = proxyRefs(user)
    expect(proxyUser.age).toBe(10)
    expect(user.age.value).toBe(10)
    expect(proxyUser.name).toBe('xiaohong')

    // set
    // 当 set 值类型，不仅要改里面的 ref，还要改 proxyUser 的返回值。
    proxyUser.age = 20
    expect(proxyUser.age).toBe(20)
    expect(user.age.value).toBe(20)

    // 当 set ref，直接改成别的 ref 即可。
    proxyUser.age = ref(20)
    expect(proxyUser.age).toBe(20)
    expect(user.age.value).toBe(20)
  })
})
