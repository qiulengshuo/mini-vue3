#	reactive

基于 Proxy ，在 get 利用 track 函数收集依赖，在 set 利用 trigger 函数派发更新。

![](https://raw.githubusercontent.com/qiulengshuo/images/master/20220528204400.png)

##	Readonly

只读的 Proxy 对象，不能被修改，当 set 的时候，会发出警告 console.warn。

![](https://raw.githubusercontent.com/qiulengshuo/images/master/20220530214103.png)

##	isReactive

判断是不是 Reactive 转化的 Proxy 对象。

![](https://raw.githubusercontent.com/qiulengshuo/images/master/20220530214211.png)

![image-20220530214323230](C:\Users\HP\AppData\Roaming\Typora\typora-user-images\image-20220530214323230.png)

##	isReadonly

判断是不是 Readonly 转化的 Proxy 对象。

![](https://raw.githubusercontent.com/qiulengshuo/images/master/20220530214508.png)

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

##	优化 stop 函数调用后的 依赖收集

只有当调用 effect.run 并且没有被 stop 的 effect（active 为 true）才能被收集。

> 平时单纯去 get 一个对象的属性（ 比如打印对象的属性 obj.prop ），并不需要做依赖收集。

![](https://raw.githubusercontent.com/qiulengshuo/images/master/20220530215457.png)

![](https://raw.githubusercontent.com/qiulengshuo/images/master/20220530215641.png)

![image-20220530215537995](C:\Users\HP\AppData\Roaming\Typora\typora-user-images\image-20220530215537995.png)

#	trigger

用来派发更新 target 中 key 对应的依赖。

![](https://raw.githubusercontent.com/qiulengshuo/images/master/20220528204512.png)