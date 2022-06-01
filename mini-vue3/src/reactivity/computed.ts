import { ReactiveEffect } from './effect'
class ComputedRefImpl {
  private _effect: any
  private dirty = true
  private _value: any
  constructor(getter) {
    this._effect = new ReactiveEffect(getter, () => {
      if (!this.dirty) {
        this.dirty = true
      }
    })
  }
  get value() {
    if (this.dirty) {
      this.dirty = false
      this._value = this._effect.run()
    }
    return this._value
  }
}
export function computed(getter) {
  return new ComputedRefImpl(getter)
}
