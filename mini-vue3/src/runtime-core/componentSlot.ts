import { ShapeFlags } from '../shared/ShapeFlags';
// {
//   header: ({ age }) => h("p", {}, "header" + age),
//   footer: () => h("p", {}, "footer"),
// }

// { header: (props) => [h("p", {}, "header" + props)] }
export function initSlots (instance, children) {
  const { vnode } = instance
  // 第三个参数必须是插槽对象
  if(vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
    normalizeObjectSlots(children, instance.slots)
  }
}

function normalizeObjectSlots(children: any, slots: any) {
  for (const key in children) {
    const value = children[key]
    // 封装成返回数组的插槽函数
    slots[key] = (props) => normalizeSlotValue(value(props))
  }
}

function normalizeSlotValue(value) {
  return Array.isArray(value) ? value : [value]
}