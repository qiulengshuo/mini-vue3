import { createVNode, Fragment } from '../vnode'

export function renderSlots(slots, name, props) {
  const slot = slots[name]
  if (slot && typeof slot === 'function') {
    // 只有插槽函数才能调用
    return createVNode(Fragment, {}, slot(props))
  }
}
