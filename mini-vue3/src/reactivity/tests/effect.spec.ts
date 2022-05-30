import { reactive } from '../reactive'
import { effect, stop } from '../effect'

describe('effect', () => {
  it('happy path', () => {
    const user = reactive({ age: 10 })
    let nextAge

    // 验证 effect 的存在并且执行 effect 参数里的函数
    effect(() => {
      nextAge = user.age + 1
    })
    expect(nextAge).toBe(11)

    // 依赖更新，自动触发 effect 参数里的函数
    user.age++
    expect(nextAge).toBe(12)
  })

  it('should return runner when call effect', () => {
    // 1. effect(fn) -> function runner () {} (包含了 fn 的执行逻辑) -> runner() 返回 fn 的返回值
    let foo = 10
    const runner = effect(() => {
      foo++
      return 'foo effect'
    })
    // 验证 effect 能调用
    expect(foo).toBe(11)

    // 验证有返回 runner 并且返回值为 fn 调用的返回值。
    const res = runner()
    expect(res).toBe('foo effect')
    expect(foo).toBe(12)
  })

  it("scheduler", () => {
    let dummy;
    let run: any;
    // jest mock 的函数
    const scheduler = jest.fn(() => {
      run = runner;
    });
    const obj = reactive({ foo: 1 });
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      { scheduler }
    );
    // 1. 首次调用 effect ，并没有去调用 scheduler
    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);
    // 2. 响应式对象发生变化，scheduler 执行一次。
    obj.foo++;
    expect(scheduler).toHaveBeenCalledTimes(1);
    // 3. 但是 fn 并没有执行
    expect(dummy).toBe(1);
    // 4. 手动执行 runner，也就是 effect.run 。
    run();
    // 5. 才去执行 fn。
    expect(dummy).toBe(2);
  });

  it("stop", () => {
    let dummy;
    const obj = reactive({ prop: 1 });
    const runner = effect(() => {
      dummy = obj.prop;
    });
    obj.prop = 2;
    expect(dummy).toBe(2);
    // 执行 stop 函数，停止对 effect fn 派发更新
    stop(runner);
    // obj.prop = 3;
    obj.prop++;
    console.log(dummy)
    expect(dummy).toBe(2);

    // 手动触发 runner，也就是 effect.run 。
    runner();
    expect(dummy).toBe(3);
  });

  it("onStop", () => {
    const obj = reactive({
      foo: 1,
    });
    const onStop = jest.fn();
    let dummy;
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      {
        onStop,
      }
    );

    stop(runner);
    expect(onStop).toBeCalledTimes(1);
  });
})
