import { extend } from '../shared'

// 包含参数函数的 effect 实例
let activeEffect
// Effect 类
class ReactiveEffect {
  private _fn: any
  onStop?: () => void
  active = true
  deps: any = []
  constructor(fn, public scheduler?) {
    this._fn = fn
  }
  run() {
    activeEffect = this
    return this._fn()
  }
  // 清空 effect 并且 执行用户传入的 onStop。
  stop() {
    // 利用 active 做优化，如果清空过就不需要进入判断逻辑。
    if(this.active) {
      cleanupEffect(this)
      if(this.onStop) {
        this.onStop()
      }
      this.active = false
    }
  }
}

// 清空 effect 
function cleanupEffect(effect) {
  effect.deps.forEach((dep) => {
    dep.delete(effect)
  })
}

// 向外暴露的 effect 函数
export function effect(fn, options: any = {}) {
  // 传入 scheduler ，合并options
  const _effect = new ReactiveEffect(fn, options.scheduler)
  extend(_effect, options)

  _effect.run()
  const runner: any = _effect.run.bind(_effect)
  runner.effect = _effect
  return runner
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

  // 如果执行单纯的 get 操作，并不需要去操作 effect 相关逻辑
  if (!activeEffect) return
  dep.add(activeEffect)
  activeEffect.deps.push(dep)
}

// 触发器
export function trigger(target, key) {
  const depsMap = targetMap.get(target)
  const dep = depsMap.get(key)
  // 循环触发 effect 参数函数
  for (const effect of dep) {
    // 优先执行 scheduler
    if (effect.scheduler) {
      effect.scheduler()
    } else {
      effect.run()
    }
  }
}

export function stop(runner) {
  // 实际上就是调用了 effect 实例的 stop 方法。
  runner.effect.stop()
}
