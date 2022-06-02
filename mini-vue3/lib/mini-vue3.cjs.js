'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
    };
    return component;
}
function setupComponent(instance) {
    // TODO
    // initProps()
    // initSlots()
    // 调用setup
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    // 得到组件配置对象
    const component = instance.type;
    const { setup } = component;
    if (setup) {
        const setupResult = setup();
        // 处理 setup 结果
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // function Object
    // TODO function
    // 如果 setup 返回的结果是 对象
    if (typeof setupResult === 'object') {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    // 挂载 render 到组件实例上来
    instance.render = Component.render;
}

// 语义化：浅拷贝继承对象属性
const isObject = function (val) {
    return val !== null && typeof val === "object";
};

function render(vnode, container) {
    patch(vnode, container);
}
function patch(vnode, container) {
    // 判断 vnode 是不是一个 element
    if (typeof vnode.type === 'string') {
        processElement(vnode, container);
    }
    else if (isObject(vnode.type)) {
        // 判断 当前 vnode 类型是组件。
        processComponent(vnode, container);
    }
}
function processComponent(vnode, container) {
    // 一开始 初始化 组件vnode
    mountComponent(vnode, container);
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    const el = document.createElement(vnode.type);
    // children
    const { children } = vnode;
    if (typeof children === 'string') {
        el.textContent = children;
    }
    else if (Array.isArray(children)) {
        mountChildren(vnode, el);
    }
    // props
    const { props } = vnode;
    for (const key in props) {
        const val = props[key];
        el.setAttribute(key, val);
    }
    container.append(el);
}
function mountChildren(vnode, container) {
    console.log(vnode);
    vnode.children.forEach((v) => {
        patch(v, container);
    });
}
function mountComponent(vnode, container) {
    // 创建组件实例
    const instance = createComponentInstance(vnode);
    // 配置组件实例 props slots setup()
    setupComponent(instance);
    setupRenderEffect(instance, container);
}
function setupRenderEffect(instance, container) {
    // 调用组件内部的 render 函数(用户传入的 render 函数)
    const subTree = instance.render();
    // vnode -> DOM
    patch(subTree, container);
}

// 创建vnode
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
    };
    return vnode;
}

function createApp(rootComponent) {
    return {
        // 根组件 初始化
        mount(rootContainer) {
            // 创建 vnode
            const vnode = createVNode(rootComponent);
            // render 拆箱
            render(vnode, rootContainer);
        }
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.h = h;
