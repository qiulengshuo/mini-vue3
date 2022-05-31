// 语义化：浅拷贝继承对象属性
export const extend = Object.assign

export const isObject = function (val) {
  return val !== null && typeof val === "object"
}

export const hasChanged = function (value, newValue) {
  return !Object.is(value, newValue)
}