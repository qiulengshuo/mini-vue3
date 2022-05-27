#	Vue

集合了 @vue/compiler-dom(编译时) 和 @vue/runtime-dom(基于响应式的运行时) 的输出。

##	@vue/compiler-dom

基于 @vue/compiler-core ，把 template 模板编译成 render 函数。

##	@vue/compiler-sfc

基于 @vue/compiler-dom 和 @vue/compiler-core ，把 单文件组件.vue 编译成 JavaScript 文件。

##	@vue/runtime-core

把 组件 渲染成真实 DOM 元素。

1. 初始化。(遇到 组件 调用 render 函数拆箱；遇到 元素 递归创建 DOM。) 
2. 更新。(响应式set、diff。)

  

