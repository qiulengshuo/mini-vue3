const publicPropertiesMap = {
    $el: (i) => i.vnode.el
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        // 对于 setup 函数返回的对象
        const { setupState } = instance;
        if (key in setupState) {
            return setupState[key];
        }
        // 对于 $el 的获取
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
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
    // 组件实例的代理对象，方便 render 函数内部通过 this.key 去获取值。
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
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

function render(vnode, container) {
    patch(vnode, container);
}
function patch(vnode, container) {
    // 判断 vnode 是不是一个 element
    const { shapeFlag } = vnode;
    if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
        processElement(vnode, container);
    }
    else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
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
    const el = vnode.el = document.createElement(vnode.type);
    // children
    const { children, shapeFlag } = vnode;
    if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        el.textContent = children;
    }
    else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
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
    vnode.children.forEach((v) => {
        patch(v, container);
    });
}
function mountComponent(initialVnode, container) {
    // 创建组件实例
    const instance = createComponentInstance(initialVnode);
    // 配置组件实例 props slots setup()
    setupComponent(instance);
    setupRenderEffect(initialVnode, instance, container);
}
function setupRenderEffect(initialVnode, instance, container) {
    const { proxy } = instance;
    // 调用组件内部的 render 函数(用户传入的 render 函数)
    // 把 render 函数的 this 修改为代理对象
    const subTree = instance.render.call(proxy);
    // vnode -> DOM
    patch(subTree, container);
    initialVnode.el = subTree.el;
}

// 创建vnode
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        shapeFlag: getShapeFlag(type),
        el: null,
    };
    if (typeof children === 'string') {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === 'string'
        ? 1 /* ShapeFlags.ELEMENT */
        : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
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

export { createApp, h };
