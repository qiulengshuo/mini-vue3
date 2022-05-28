// 包含参数函数的 effect 实例
let activeEffect
// Effect 类
class ReactiveEffect {
  private _fn: any
  constructor(fn) {
    this._fn = fn
  }
  run() {
    activeEffect = this
    this._fn()
  }
}
// 向外暴露的 effect 函数
export function effect(fn) {
  const _effect = new ReactiveEffect(fn)
  _effect.run()
}

// 收集依赖器
// target : depsMap( key : set(fn) )
let targetMap = new Map()
export function track(target, key) {
  // 收集 target 对应的 属性的map
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }

  // 收集属性的 effect 实例集合
  let dep = depsMap.get(key)
  if (!dep) {
    dep = new Set()
    depsMap.set(key, dep)
  }
  dep.add(activeEffect)
}

// 触发器
export function trigger(target, key) {
  const depsMap = targetMap.get(target)
  const dep = depsMap.get(key)
  // 循环触发 effect 参数函数
  for (const effect of dep) {
    effect.run()
  }
}
