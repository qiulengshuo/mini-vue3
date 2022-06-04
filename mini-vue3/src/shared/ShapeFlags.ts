export const enum ShapeFlags {
  ELEMENT = 1, // 0001 代表 vnode type 为元素。
  STATEFUL_COMPONENT = 1 << 1, // 0010 代表 vnode type 为 组件。
  TEXT_CHILDREN = 1 << 2, // 0100 代表 children 是文本。
  ARRAY_CHILDREN = 1 << 3, // 1000 代表 children 是数组。
  SLOT_CHILDREN = 1 << 4, // 10000 代表 children 是插槽对象。
}

// 添加用 |
// 查找用 &
