const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
// 创建vnode
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        key: props && props.key,
        shapeFlag: getShapeFlag(type),
        el: null,
        component: null,
    };
    if (typeof children === 'string') {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (typeof children === 'object') {
            vnode.shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === 'string'
        ? 1 /* ShapeFlags.ELEMENT */
        : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot && typeof slot === 'function') {
        // 只有插槽函数才能调用
        return createVNode(Fragment, {}, slot(props));
    }
}

// 语义化：浅拷贝继承对象属性
const extend = Object.assign;
const EMPTY_OBJ = {};
const isObject = function (val) {
    return val !== null && typeof val === 'object';
};
const hasChanged = function (value, newValue) {
    return !Object.is(value, newValue);
};
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : '';
    });
};
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
const toHandlerKey = (str) => {
    return str ? 'on' + capitalize(str) : '';
};

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
    $props: (i) => i.props,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        // 对于 setup 函数返回的对象
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        // 对于 $el 的获取
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

let shouldTrack = false;
// 包含参数函数的 effect 实例
let activeEffect;
// Effect 类
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.scheduler = scheduler;
        this.active = true;
        this.deps = [];
        this._fn = fn;
    }
    run() {
        // 已经stop过，如果想执行runner，直接this._fn
        if (!this.active) {
            return this._fn();
        }
        // 没有stop过，需要收集，shouldTrack = true。
        shouldTrack = true;
        activeEffect = this;
        const res = this._fn();
        shouldTrack = false;
        return res;
    }
    // 清空 effect 并且 执行用户传入的 onStop。
    stop() {
        // 利用 active 做优化，如果清空过就不需要进入判断逻辑。
        if (this.active) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
// 清空 effect
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
// 向外暴露的 effect 函数
function effect(fn, options = {}) {
    // 传入 scheduler ，合并options
    const _effect = new ReactiveEffect(fn, options.scheduler);
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}
// 收集依赖器
// target : depsMap( key : set(fn) )
let targetMap = new Map();
function track(target, key) {
    if (!isTracking())
        return;
    // 收集 target 对应的 属性的map
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    // 收集属性的 effect 实例集合
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffects(dep);
}
function trackEffects(dep) {
    // 如果执行单纯的 get 操作，并不需要去操作 effect 相关逻辑，同时防止二次收集dep。
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
}
// 触发器
function trigger(target, key) {
    const depsMap = targetMap.get(target);
    const dep = depsMap.get(key);
    triggerEffects(dep);
}
function triggerEffects(dep) {
    // 循环触发 effect 参数函数
    for (const effect of dep) {
        // 优先执行 scheduler
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}
function isTracking() {
    return activeEffect !== undefined && shouldTrack;
}

const get = createGetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
const set = createSetter();
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        if ("__v_isReactive" /* ReactiveFlags.IS_REACTIVE */ === key) {
            return !isReadonly;
        }
        else if ("__v_isReadonly" /* ReactiveFlags.IS_READONLY */ === key) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (shallow) {
            return res;
        }
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        if (!isReadonly) {
            // 收集依赖
            track(target, key);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        // 派发更新
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`key ${Object(key)}, 只读不能被修改`, target);
        return true;
    },
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet
});

function reactive(raw) {
    return createReactiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createReactiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandlers);
}
function createReactiveObject(target, baseHandlers) {
    if (!isObject(target)) {
        console.warn(`target ${target} 必须是一个对象`);
        return target;
    }
    return new Proxy(target, baseHandlers);
}

function emit(instance, event, ...args) {
    const { props } = instance;
    // 转化传过来的回调key，变成实际回调的name，然后执行。
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

// {
//   header: ({ age }) => h("p", {}, "header" + age),
//   footer: () => h("p", {}, "footer"),
// }
// { header: (props) => [h("p", {}, "header" + props)] }
function initSlots(instance, children) {
    const { vnode } = instance;
    // 第三个参数必须是插槽对象
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        // 封装成返回数组的插槽函数
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        // 保留原始值  方便后面比较新旧值
        // 主要是对对象的处理，如果.value改为旧对象
        // 而.value的对象又被proxy了，proxy对象和旧对象不一样，会被误认为两个对象。
        this._rawValue = value;
        // 对 对象 进行 reactive 响应式，收集更新依赖。
        // 不然属性改了，却没有更新依赖。
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        // 收集依赖 effect。
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        // 更新才去触发依赖。
        if (hasChanged(this._rawValue, newValue)) {
            this._value = convert(newValue);
            this._rawValue = newValue;
            triggerEffects(this.dep);
        }
    }
}
function ref(value) {
    return new RefImpl(value);
}
function isRef(ref) {
    return !!ref.__v_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return target[key].value = value;
            }
            else {
                return Reflect.set(target, key, value);
            }
        },
    });
}
function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep);
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}

function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        next: null,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        subTree: {},
        isMounted: false,
        emit: () => { },
    };
    // 柯里化先传 component 实例
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    // 调用setup
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    // 得到组件配置对象
    const component = instance.type;
    // 组件实例的代理对象，方便 render 函数内部通过 this.key 去获取值
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = component;
    if (setup) {
        // 设置 currentInstance 的值
        setCurrentInstance(instance);
        // { emit }
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        // setup 函数调用完就置为 null，防止在其他地方被调用
        setCurrentInstance(null);
        // 处理 setup 结果
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // function Object
    // TODO function
    // 如果 setup 返回的结果是 对象
    if (typeof setupResult === 'object') {
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    // 挂载 render 到组件实例上来
    instance.render = Component.render;
}
let currentInstance = null;
function setCurrentInstance(instance) {
    currentInstance = instance;
}
function getCurrentInstance() {
    return currentInstance;
}

function provide(key, value) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        // 只能在 setup 函数使用
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent.provides;
        // 如果当前 provides 和 parentProvides 相等，说明该层还没有 provide 过。
        // 创建一个对象，继承原型链。
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        // 设置值。
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        // 从当前组件的父组件的 provides 开始找。
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            // 可能默认值是 函数 或 值。
            if (typeof defaultValue === 'function') {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            // 根组件 初始化
            mount(rootContainer) {
                // 创建 vnode
                const vnode = createVNode(rootComponent);
                // render 拆箱
                render(vnode, rootContainer);
            },
        };
    };
}

function shouldUpdateComponent(prevVNode, nextVNode) {
    const { props: prevProps } = prevVNode;
    const { props: nextProps } = nextVNode;
    for (const key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = options;
    function render(vnode, container) {
        patch(null, vnode, container, null, null);
    }
    // n1 老vnode
    // n2 新vnode
    function patch(n1, n2, container, parentComponent, anchor) {
        // 判断 vnode 是不是一个 element
        const { type, shapeFlag } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    // 判断 当前 vnode 类型是组件。
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    function processFragment(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            // 一开始 初始化 组件vnode
            mountComponent(n2, container, parentComponent, anchor);
        }
        else {
            // 更新 component
            updateComponent(n1, n2);
        }
    }
    function updateComponent(n1, n2) {
        const instance = (n2.component = n1.component);
        // 通过 props 判断需不需要更新
        if (shouldUpdateComponent(n1, n2)) {
            // 设置新 vnode
            // 执行更新逻辑
            instance.next = n2;
            instance.update();
        }
        else {
            // 如果不需要更新，直接更换 vnode
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        console.log('patchElement');
        console.log('n1', n1);
        console.log('n2', n2);
        // 获取旧新 vnode 的 props
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        // 更新的 vnode 走 patchElement 逻辑，并没有 el。
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentComponent, anchor);
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const prevShapeFlag = n1.shapeFlag;
        const c1 = n1.children;
        const { shapeFlag } = n2;
        const c2 = n2.children;
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            if (prevShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                unmountChildren(n1.children);
            }
            if (c1 !== c2) {
                hostSetElementText(container, c2);
            }
        }
        else {
            if (prevShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                hostSetElementText(container, '');
                mountChildren(n2.children, container, parentComponent, anchor);
            }
            else {
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        const l2 = c2.length;
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = l2 - 1;
        function isSomeVNodeType(n1, n2) {
            return n1.type === n2.type && n1.key === n2.key;
        }
        // 新旧 vnode 从左侧开始对比，直到停到不同 node 的下标。
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            i++;
        }
        // 新旧 vnode 从右侧开始对比，直到停到不同 node 的下标。
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        // 新的比老的多，多的 node 都在一端。
        if (i > e1) {
            if (i <= e2) {
                // 多的 node 在右端也就是末尾，锚点为 null，即在末端插入即可。
                // 多的 node 在左端也就是开头，锚点为 e2 + 1，即在相同开头 node 的前面插入。
                const nextPos = e2 + 1;
                const anchor = nextPos < l2 ? c2[nextPos].el : null;
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
            // 老的比新的多，多的 node 都在一端。
        }
        else if (i > e2) {
            // 直接循环删除即可。
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
            // 不同的 node 在中间。
        }
        else {
            let s1 = i;
            let s2 = i;
            const toBePatched = e2 - s2 + 1;
            let patched = 0;
            // newVnode: key -> Index 的映射，空间换时间，查找 O(1)。
            const keyToNewIndexMap = new Map();
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            // newVnode: index -> oldVnode: index
            // 从新索引到旧索引的映射，查找旧索引中的最长递增子序列。
            // 该子序列中的元素相对位置保持不变，只去移动其他旧元素。
            const newIndexToOldIndexMap = new Array(toBePatched);
            let moved = false;
            // 优化点：
            // 如果在删除逻辑查找 newIndex 的时候，index 是不断增大的,
            // 那么不需要去移动(查找最长递增子序列...)。
            let maxNewIndexSoFar = 0;
            for (let i = 0; i < toBePatched; i++)
                newIndexToOldIndexMap[i] = 0;
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                // 已经 patch 数量大于等于将去 patch 的数量。
                // 直接删除。
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                // 遍历老 vnode，找到对应新 vnode 中的 index。
                let newIndex;
                if (prevChild.key != null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    for (let j = s2; j <= e2; j++) {
                        if (isSomeVNodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex === undefined) {
                    hostRemove(prevChild.el);
                }
                else {
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    // 存储 newIndex -> oldIndex
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
            // 计算老 vnode index 的最长递增子序列，
            // 得到新 vnode index 下标。
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            let j = increasingNewIndexSequence.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                if (newIndexToOldIndexMap[i] === 0) {
                    // 值为 0，说明在旧 vnode 没有这个节点
                    // 直接创建
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                else if (moved) {
                    // 一旦最长递增子序列遍历完了
                    // 或者最长递增子序列对应下标和实际遍历下标不一样
                    // 执行移动逻辑
                    // 否则j--继续遍历
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
            }
        }
    }
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
            hostRemove(el);
        }
    }
    function patchProps(el, oldProps, newProps) {
        // 旧新 props 对象不同，才去更新。
        if (oldProps !== newProps) {
            // 先在 newProps 对象里面遍历
            // 1. 两值不同，更新即可。
            // 2. 新 prop null 或 undefined，删除属性。
            // 3. 新增属性。
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                if (prevProp !== nextProp) {
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }
            // 再去 oldProps 对象里面遍历
            // 1. 只需要删除 newProps 对象里面没有的。
            if (oldProps !== EMPTY_OBJ) {
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function mountElement(vnode, container, parentComponent, anchor) {
        // const el = (vnode.el = document.createElement(vnode.type))
        const el = (vnode.el = hostCreateElement(vnode.type));
        // children
        const { children, shapeFlag } = vnode;
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChildren(vnode.children, el, parentComponent, anchor);
        }
        // props
        const { props } = vnode;
        for (const key in props) {
            const val = props[key];
            // const isOn = (key: string) => /^on[A-Z]/.test(key)
            // if (isOn(key)) {
            //   const event = key.slice(2).toLowerCase()
            //   el.addEventListener(event, val)
            // } else {
            //   el.setAttribute(key, val)
            // }
            hostPatchProp(el, key, null, val);
        }
        // container.append(el)
        hostInsert(el, container, anchor);
    }
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach((v) => {
            patch(null, v, container, parentComponent, anchor);
        });
    }
    function mountComponent(initialVnode, container, parentComponent, anchor) {
        // 创建组件实例
        const instance = (initialVnode.component = createComponentInstance(initialVnode, parentComponent));
        // 配置组件实例 props slots setup()
        setupComponent(instance);
        setupRenderEffect(initialVnode, instance, container, anchor);
    }
    function setupRenderEffect(initialVnode, instance, container, anchor) {
        instance.update = effect(() => {
            if (!instance.isMounted) {
                console.log('init');
                const { proxy } = instance;
                // 调用组件内部的 render 函数(用户传入的 render 函数)
                // 把 render 函数的 this 修改为代理对象
                const subTree = (instance.subTree = instance.render.call(proxy));
                // vnode -> DOM
                patch(null, subTree, container, instance, anchor);
                initialVnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                console.log('update');
                // 更新 vnode 和 props
                const { next, vnode } = instance;
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                const { proxy } = instance;
                // 调用组件内部的 render 函数(用户传入的 render 函数)
                // 把 render 函数的 this 修改为代理对象
                const subTree = instance.render.call(proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = subTree;
                // vnode -> DOM
                patch(prevSubTree, subTree, container, instance, anchor);
            }
        });
    }
    return {
        createApp: createAppAPI(render),
    };
}
function updateComponentPreRender(instance, nextVNode) {
    instance.vnode = nextVNode;
    instance.next = null;
    instance.props = nextVNode.props;
}
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevVal, nextVal) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, nextVal);
    }
    else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(child, parent, anchor) {
    // parent.append(el)
    // 把 child 插入到父元素里面对应的锚点前面。
    // null 的时候默认添加在后面。
    parent.insertBefore(child, anchor || null);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

export { createApp, createRenderer, createTextVNode, getCurrentInstance, h, inject, provide, proxyRefs, ref, renderSlots };
