## 🌈mini-vue3

实现微型的 vue3 模型，用于深入学习 vue3。

## 🔥 实现功能

代码命名会保持和源码中的一致，方便通过命名去源码中查找逻辑。

### 0️⃣ runtime-core

- [x] 支持组件类型
- [x] 支持 element 类型
- [x] 初始化 props
- [x] setup 可获取 props 和 { emit }
- [x] 支持 component emit
- [x] 支持 proxy
- [x] 可以在 render 函数中获取 setup 返回的对象
- [x] nextTick 的实现
- [x] 支持 getCurrentInstance
- [x] 支持 provide/inject
- [x] 支持最基础的 slots
- [x] 支持 Text 类型节点
- [x] 支持在render函数中运用 this.$el api


### 1️⃣ reactivity

目标是用自己的 reactivity 支持现有的 demo 运行。

- [x] reactive 的实现
- [x] ref 的实现
- [x] readonly 的实现
- [x] computed 的实现
- [x] track 依赖收集
- [x] trigger 触发依赖
- [x] 支持 isReactive
- [x] 支持嵌套 reactive
- [x] 支持 effect.scheduler
- [x] 支持 effect.stop
- [x] 支持 isReadonly
- [x] 支持 isProxy
- [x] 支持 shallowReadonly
- [x] 支持 proxyRefs

### 2️⃣ compiler-core
- [x] 支持解析 插值
- [x] 支持解析 element
- [x] 支持解析 text

### 3️⃣ runtime-dom
- [x] 支持 custom renderer

### 4️⃣ example

通过 server 的方式打开 mini-vue3/example/\* 下的 index.html 即可

>  推荐使用 [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
