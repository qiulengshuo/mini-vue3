#	reactive

基于 Proxy ，在 get 利用 track 函数收集依赖，在 set 利用 trigger 函数派发更新。

![](https://raw.githubusercontent.com/qiulengshuo/images/master/20220528204400.png)

#	effect

1. 首次调用，执行参数里面的函数触发 Proxy 里的 track 收集依赖。

2. 产生一个 effect 实例包含该 函数，方便更新调用。

   ![](https://raw.githubusercontent.com/qiulengshuo/images/master/20220528204424.png)

#	track

用来添加 target -> key -> fn 的依赖。

![](https://raw.githubusercontent.com/qiulengshuo/images/master/20220528204500.png)

#	trigger

用来派发更新 target 中 key 对应的依赖。

![](https://raw.githubusercontent.com/qiulengshuo/images/master/20220528204512.png)