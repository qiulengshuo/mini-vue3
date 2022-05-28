import { reactive } from '../reactive'

describe('reactive', () => {
  it('happy path', () => {
    // 验证 proxy 的存在
    const original = { foo: 1 }
    const observed = reactive(original)
    expect(original).not.toBe(observed)
  })
})
