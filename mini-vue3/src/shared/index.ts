export * from './toDisplayString'

// 语义化：浅拷贝继承对象属性
export const extend = Object.assign

export const EMPTY_OBJ = {}

export const isString = (value) => typeof value === 'string'

export const isObject = function (val) {
  return val !== null && typeof val === 'object'
}

export const hasChanged = function (value, newValue) {
  return !Object.is(value, newValue)
}

export const hasOwn = (val, key) =>
  Object.prototype.hasOwnProperty.call(val, key)

export const camelize = (str: string) => {
  return str.replace(/-(\w)/g, (_, c: string) => {
    return c ? c.toUpperCase() : ''
  })
}
const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export const toHandlerKey = (str: string) => {
  return str ? 'on' + capitalize(str) : ''
}
