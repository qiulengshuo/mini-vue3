#	reactive

基于 Proxy ，在 get 利用 track 函数收集依赖，在 set 利用 trigger 函数派发更新。

![](https://raw.githubusercontent.com/qiulengshuo/images/master/20220528204400.png)

#	effect

1. 首次调用，执行参数里面的函数触发 Proxy 里的 track 收集依赖。

2. 产生一个 effect 实例包含该 函数，方便更新调用。

   ![](https://raw.githubusercontent.com/qiulengshuo/images/master/20220528204424.png)

##	实现 effect 的返回值 runner 功能

本质上就是返回 effect 实例上的 run 方法。

> 注意：这里要绑定 this，也就是 effect 实例，这样才能获取到 run。

![](https://raw.githubusercontent.com/qiulengshuo/images/master/20220529171359.png)

##	实现 effect 的第二个可选参数对象中的 scheduler 功能

更新的时候，不会去执行 effect 中的 fn，而是去执行 scheduler 方法。

![](https://raw.githubusercontent.com/qiulengshuo/images/master/20220529171757.png)

##	实现 effect 的 stop 函数

执行 stop 函数，就是去清空 runner 对应的 effect。

> 注意：这里可以用 active 变量做优化，避免频繁进入判断逻辑。

![](https://raw.githubusercontent.com/qiulengshuo/images/master/20220529172558.png)

![](https://raw.githubusercontent.com/qiulengshuo/images/master/20220529172127.png)

##	实现 effect 的第二个可选参数对象中的 onStop 功能

用户传入 onStop 函数，实际上就是当执行 stop 函数的时候，里面就会去执行 onStop 函数。

#	track

用来添加 target -> key -> fn 的依赖。

![](https://raw.githubusercontent.com/qiulengshuo/images/master/20220528204500.png)

#	trigger

用来派发更新 target 中 key 对应的依赖。

![](https://raw.githubusercontent.com/qiulengshuo/images/master/20220528204512.png)