import { isTracking, triggerEffects, trackEffects } from '../reactivity/effect'
import { reactive } from '../reactivity/reactive'
import { hasChanged, isObject } from '../shared/index'

class RefImpl {
  public dep
  private _rawValue: any
  private _value: any
  constructor(value) {
    // 保留原始值  方便后面比较新旧值
    // 主要是对对象的处理，如果.value改为旧对象
    // 而.value的对象又被proxy了，proxy对象和旧对象不一样，会被误认为两个对象。
    this._rawValue = value
    // 对 对象 进行 reactive 响应式，收集更新依赖。
    // 不然属性改了，却没有更新依赖。
    this._value = convert(value)
    this.dep = new Set()
  }
  get value() {
    // 收集依赖 effect。
    trackRefValue(this)
    return this._value
  }
  set value(newValue) {
    // 更新才去触发依赖。
    if (hasChanged(this._rawValue, newValue)) {
      this._value = convert(newValue)
      this._rawValue = newValue
      triggerEffects(this.dep)
    }
  }
}

export function ref(value) {
  return new RefImpl(value)
}

function trackRefValue(ref) {
  if (isTracking()) {
    trackEffects(ref.dep)
  }
}

function convert(value) {
  return isObject(value) ? reactive(value) : value
}
