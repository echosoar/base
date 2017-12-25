(function () {
'use strict';

/** Virtual DOM Node */
var options = {

	/** If `true`, `prop` changes trigger synchronous component updates.
  *	@name syncComponentUpdates
  *	@type Boolean
  *	@default true
  */
	//syncComponentUpdates: true,

	/** Processes all created VNodes.
  *	@param {VNode} vnode	A newly-created VNode to normalize/process
  */
	//vnode(vnode) { }

	/** Hook invoked after a component is mounted. */
	// afterMount(component) { }

	/** Hook invoked after the DOM is updated with a component's latest render. */
	// afterUpdate(component) { }

	/** Hook invoked immediately before a component is unmounted. */
	// beforeUnmount(component) { }
};

function extend(obj, props) {
  for (var i in props) {
    obj[i] = props[i];
  }return obj;
}

/**
 * Call a function asynchronously, as soon as possible. Makes
 * use of HTML Promise to schedule the callback if available,
 * otherwise falling back to `setTimeout` (mainly for IE<11).
 *
 * @param {Function} callback
 */
var defer = typeof Promise == 'function' ? Promise.resolve().then.bind(Promise.resolve()) : setTimeout;

/**
 * Clones the given VNode, optionally adding attributes/props and replacing its children.
 * @param {VNode} vnode		The virutal DOM element to clone
 * @param {Object} props	Attributes/props to add when cloning
 * @param {VNode} rest		Any additional arguments will be used as replacement children.
 */
var IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|ows|mnc|ntw|ine[ch]|zoo|^ord/i;

/** Managed queue of dirty components to be re-rendered */

var items = [];

function enqueueRender(component) {
	if (!component._dirty && (component._dirty = true) && items.push(component) == 1) {
		(options.debounceRendering || defer)(rerender);
	}
}

function rerender() {
	var p,
	    list = items;
	items = [];
	while (p = list.pop()) {
		if (p._dirty) { renderComponent(p); }
	}
}

/**
 * Check if two nodes are equivalent.
 *
 * @param {Node} node			DOM Node to compare
 * @param {VNode} vnode			Virtual DOM node to compare
 * @param {boolean} [hyrdating=false]	If true, ignores component constructors when comparing.
 * @private
 */
function isSameNodeType(node, vnode, hydrating) {
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    return node.splitText !== undefined;
  }
  if (typeof vnode.nodeName === 'string') {
    return !node._componentConstructor && isNamedNode(node, vnode.nodeName);
  }
  return hydrating || node._componentConstructor === vnode.nodeName;
}

/**
 * Check if an Element has a given nodeName, case-insensitively.
 *
 * @param {Element} node	A DOM Element to inspect the name of.
 * @param {String} nodeName	Unnormalized name to compare against.
 */
function isNamedNode(node, nodeName) {
  return node.normalizedNodeName === nodeName || node.nodeName.toLowerCase() === nodeName.toLowerCase();
}

/**
 * Reconstruct Component-style `props` from a VNode.
 * Ensures default/fallback values from `defaultProps`:
 * Own-properties of `defaultProps` not present in `vnode.attributes` are added.
 *
 * @param {VNode} vnode
 * @returns {Object} props
 */
function getNodeProps(vnode) {
  var props = extend({}, vnode.attributes);
  props.children = vnode.children;

  var defaultProps = vnode.nodeName.defaultProps;
  if (defaultProps !== undefined) {
    for (var i in defaultProps) {
      if (props[i] === undefined) {
        props[i] = defaultProps[i];
      }
    }
  }

  return props;
}

/** Create an element with the given nodeName.
 *	@param {String} nodeName
 *	@param {Boolean} [isSvg=false]	If `true`, creates an element within the SVG namespace.
 *	@returns {Element} node
 */
function createNode(nodeName, isSvg) {
	var node = isSvg ? document.createElementNS('http://www.w3.org/2000/svg', nodeName) : document.createElement(nodeName);
	node.normalizedNodeName = nodeName;
	return node;
}

/** Remove a child node from its parent if attached.
 *	@param {Element} node		The node to remove
 */
function removeNode(node) {
	var parentNode = node.parentNode;
	if (parentNode) { parentNode.removeChild(node); }
}

/** Set a named attribute on the given Node, with special behavior for some names and event handlers.
 *	If `value` is `null`, the attribute/handler will be removed.
 *	@param {Element} node	An element to mutate
 *	@param {string} name	The name/key to set, such as an event or attribute name
 *	@param {any} old	The last value that was set for this name/node pair
 *	@param {any} value	An attribute value, such as a function to be used as an event handler
 *	@param {Boolean} isSvg	Are we currently diffing inside an svg?
 *	@private
 */
function setAccessor(node, name, old, value, isSvg) {
	if (name === 'className') { name = 'class'; }

	if (name === 'key') {
		// ignore
	} else if (name === 'ref') {
		if (old) { old(null); }
		if (value) { value(node); }
	} else if (name === 'class' && !isSvg) {
		node.className = value || '';
	} else if (name === 'style') {
		if (!value || typeof value === 'string' || typeof old === 'string') {
			node.style.cssText = value || '';
		}
		if (value && typeof value === 'object') {
			if (typeof old !== 'string') {
				for (var i in old) {
					if (!(i in value)) { node.style[i] = ''; }
				}
			}
			for (var i in value) {
				node.style[i] = typeof value[i] === 'number' && IS_NON_DIMENSIONAL.test(i) === false ? value[i] + 'px' : value[i];
			}
		}
	} else if (name === 'dangerouslySetInnerHTML') {
		if (value) { node.innerHTML = value.__html || ''; }
	} else if (name[0] == 'o' && name[1] == 'n') {
		var useCapture = name !== (name = name.replace(/Capture$/, ''));
		name = name.toLowerCase().substring(2);
		if (value) {
			if (!old) { node.addEventListener(name, eventProxy, useCapture); }
		} else {
			node.removeEventListener(name, eventProxy, useCapture);
		}
		(node._listeners || (node._listeners = {}))[name] = value;
	} else if (name !== 'list' && name !== 'type' && !isSvg && name in node) {
		setProperty(node, name, value == null ? '' : value);
		if (value == null || value === false) { node.removeAttribute(name); }
	} else {
		var ns = isSvg && name !== (name = name.replace(/^xlink\:?/, ''));
		if (value == null || value === false) {
			if (ns) { node.removeAttributeNS('http://www.w3.org/1999/xlink', name.toLowerCase()); }else { node.removeAttribute(name); }
		} else if (typeof value !== 'function') {
			if (ns) { node.setAttributeNS('http://www.w3.org/1999/xlink', name.toLowerCase(), value); }else { node.setAttribute(name, value); }
		}
	}
}

/** Attempt to set a DOM property to the given value.
 *	IE & FF throw for certain property-value combinations.
 */
function setProperty(node, name, value) {
	try {
		node[name] = value;
	} catch (e) {}
}

/** Proxy an event to hooked event handlers
 *	@private
 */
function eventProxy(e) {
	return this._listeners[e.type](options.event && options.event(e) || e);
}

/** Queue of components that have been mounted and are awaiting componentDidMount */
var mounts = [];

/** Diff recursion count, used to track the end of the diff cycle. */
var diffLevel = 0;

/** Global flag indicating if the diff is currently within an SVG */
var isSvgMode = false;

/** Global flag indicating if the diff is performing hydration */
var hydrating = false;

/** Invoke queued componentDidMount lifecycle methods */
function flushMounts() {
	var c;
	while (c = mounts.pop()) {
		if (options.afterMount) { options.afterMount(c); }
		if (c.componentDidMount) { c.componentDidMount(); }
	}
}

/** Apply differences in a given vnode (and it's deep children) to a real DOM Node.
 *	@param {Element} [dom=null]		A DOM node to mutate into the shape of the `vnode`
 *	@param {VNode} vnode			A VNode (with descendants forming a tree) representing the desired DOM structure
 *	@returns {Element} dom			The created/mutated element
 *	@private
 */
function diff(dom, vnode, context, mountAll, parent, componentRoot) {
	// diffLevel having been 0 here indicates initial entry into the diff (not a subdiff)
	if (!diffLevel++) {
		// when first starting the diff, check if we're diffing an SVG or within an SVG
		isSvgMode = parent != null && parent.ownerSVGElement !== undefined;

		// hydration is indicated by the existing element to be diffed not having a prop cache
		hydrating = dom != null && !('__preactattr_' in dom);
	}

	var ret = idiff(dom, vnode, context, mountAll, componentRoot);

	// append the element if its a new parent
	if (parent && ret.parentNode !== parent) { parent.appendChild(ret); }

	// diffLevel being reduced to 0 means we're exiting the diff
	if (! --diffLevel) {
		hydrating = false;
		// invoke queued componentDidMount lifecycle methods
		if (!componentRoot) { flushMounts(); }
	}

	return ret;
}

/** Internals of `diff()`, separated to allow bypassing diffLevel / mount flushing. */
function idiff(dom, vnode, context, mountAll, componentRoot) {
	var out = dom,
	    prevSvgMode = isSvgMode;

	// empty values (null, undefined, booleans) render as empty Text nodes
	if (vnode == null || typeof vnode === 'boolean') { vnode = ''; }

	// Fast case: Strings & Numbers create/update Text nodes.
	if (typeof vnode === 'string' || typeof vnode === 'number') {

		// update if it's already a Text node:
		if (dom && dom.splitText !== undefined && dom.parentNode && (!dom._component || componentRoot)) {
			/* istanbul ignore if */ /* Browser quirk that can't be covered: https://github.com/developit/preact/commit/fd4f21f5c45dfd75151bd27b4c217d8003aa5eb9 */
			if (dom.nodeValue != vnode) {
				dom.nodeValue = vnode;
			}
		} else {
			// it wasn't a Text node: replace it with one and recycle the old Element
			out = document.createTextNode(vnode);
			if (dom) {
				if (dom.parentNode) { dom.parentNode.replaceChild(out, dom); }
				recollectNodeTree(dom, true);
			}
		}

		out['__preactattr_'] = true;

		return out;
	}

	// If the VNode represents a Component, perform a component diff:
	var vnodeName = vnode.nodeName;
	if (typeof vnodeName === 'function') {
		return buildComponentFromVNode(dom, vnode, context, mountAll);
	}

	// Tracks entering and exiting SVG namespace when descending through the tree.
	isSvgMode = vnodeName === 'svg' ? true : vnodeName === 'foreignObject' ? false : isSvgMode;

	// If there's no existing element or it's the wrong type, create a new one:
	vnodeName = String(vnodeName);
	if (!dom || !isNamedNode(dom, vnodeName)) {
		out = createNode(vnodeName, isSvgMode);

		if (dom) {
			// move children into the replacement node
			while (dom.firstChild) {
				out.appendChild(dom.firstChild);
			} // if the previous Element was mounted into the DOM, replace it inline
			if (dom.parentNode) { dom.parentNode.replaceChild(out, dom); }

			// recycle the old element (skips non-Element node types)
			recollectNodeTree(dom, true);
		}
	}

	var fc = out.firstChild,
	    props = out['__preactattr_'],
	    vchildren = vnode.children;

	if (props == null) {
		props = out['__preactattr_'] = {};
		for (var a = out.attributes, i = a.length; i--;) {
			props[a[i].name] = a[i].value;
		}
	}

	// Optimization: fast-path for elements containing a single TextNode:
	if (!hydrating && vchildren && vchildren.length === 1 && typeof vchildren[0] === 'string' && fc != null && fc.splitText !== undefined && fc.nextSibling == null) {
		if (fc.nodeValue != vchildren[0]) {
			fc.nodeValue = vchildren[0];
		}
	}
	// otherwise, if there are existing or new children, diff them:
	else if (vchildren && vchildren.length || fc != null) {
			innerDiffNode(out, vchildren, context, mountAll, hydrating || props.dangerouslySetInnerHTML != null);
		}

	// Apply attributes/props from VNode to the DOM Element:
	diffAttributes(out, vnode.attributes, props);

	// restore previous SVG mode: (in case we're exiting an SVG namespace)
	isSvgMode = prevSvgMode;

	return out;
}

/** Apply child and attribute changes between a VNode and a DOM Node to the DOM.
 *	@param {Element} dom			Element whose children should be compared & mutated
 *	@param {Array} vchildren		Array of VNodes to compare to `dom.childNodes`
 *	@param {Object} context			Implicitly descendant context object (from most recent `getChildContext()`)
 *	@param {Boolean} mountAll
 *	@param {Boolean} isHydrating	If `true`, consumes externally created elements similar to hydration
 */
function innerDiffNode(dom, vchildren, context, mountAll, isHydrating) {
	var originalChildren = dom.childNodes,
	    children = [],
	    keyed = {},
	    keyedLen = 0,
	    min = 0,
	    len = originalChildren.length,
	    childrenLen = 0,
	    vlen = vchildren ? vchildren.length : 0,
	    j,
	    c,
	    f,
	    vchild,
	    child;

	// Build up a map of keyed children and an Array of unkeyed children:
	if (len !== 0) {
		for (var i = 0; i < len; i++) {
			var _child = originalChildren[i],
			    props = _child['__preactattr_'],
			    key = vlen && props ? _child._component ? _child._component.__key : props.key : null;
			if (key != null) {
				keyedLen++;
				keyed[key] = _child;
			} else if (props || (_child.splitText !== undefined ? isHydrating ? _child.nodeValue.trim() : true : isHydrating)) {
				children[childrenLen++] = _child;
			}
		}
	}

	if (vlen !== 0) {
		for (var i = 0; i < vlen; i++) {
			vchild = vchildren[i];
			child = null;

			// attempt to find a node based on key matching
			var key = vchild.key;
			if (key != null) {
				if (keyedLen && keyed[key] !== undefined) {
					child = keyed[key];
					keyed[key] = undefined;
					keyedLen--;
				}
			}
			// attempt to pluck a node of the same type from the existing children
			else if (!child && min < childrenLen) {
					for (j = min; j < childrenLen; j++) {
						if (children[j] !== undefined && isSameNodeType(c = children[j], vchild, isHydrating)) {
							child = c;
							children[j] = undefined;
							if (j === childrenLen - 1) { childrenLen--; }
							if (j === min) { min++; }
							break;
						}
					}
				}

			// morph the matched/found/created DOM child to match vchild (deep)
			child = idiff(child, vchild, context, mountAll);

			f = originalChildren[i];
			if (child && child !== dom && child !== f) {
				if (f == null) {
					dom.appendChild(child);
				} else if (child === f.nextSibling) {
					removeNode(f);
				} else {
					dom.insertBefore(child, f);
				}
			}
		}
	}

	// remove unused keyed children:
	if (keyedLen) {
		for (var i in keyed) {
			if (keyed[i] !== undefined) { recollectNodeTree(keyed[i], false); }
		}
	}

	// remove orphaned unkeyed children:
	while (min <= childrenLen) {
		if ((child = children[childrenLen--]) !== undefined) { recollectNodeTree(child, false); }
	}
}

/** Recursively recycle (or just unmount) a node and its descendants.
 *	@param {Node} node						DOM node to start unmount/removal from
 *	@param {Boolean} [unmountOnly=false]	If `true`, only triggers unmount lifecycle, skips removal
 */
function recollectNodeTree(node, unmountOnly) {
	var component = node._component;
	if (component) {
		// if node is owned by a Component, unmount that component (ends up recursing back here)
		unmountComponent(component);
	} else {
		// If the node's VNode had a ref function, invoke it with null here.
		// (this is part of the React spec, and smart for unsetting references)
		if (node['__preactattr_'] != null && node['__preactattr_'].ref) { node['__preactattr_'].ref(null); }

		if (unmountOnly === false || node['__preactattr_'] == null) {
			removeNode(node);
		}

		removeChildren(node);
	}
}

/** Recollect/unmount all children.
 *	- we use .lastChild here because it causes less reflow than .firstChild
 *	- it's also cheaper than accessing the .childNodes Live NodeList
 */
function removeChildren(node) {
	node = node.lastChild;
	while (node) {
		var next = node.previousSibling;
		recollectNodeTree(node, true);
		node = next;
	}
}

/** Apply differences in attributes from a VNode to the given DOM Element.
 *	@param {Element} dom		Element with attributes to diff `attrs` against
 *	@param {Object} attrs		The desired end-state key-value attribute pairs
 *	@param {Object} old			Current/previous attributes (from previous VNode or element's prop cache)
 */
function diffAttributes(dom, attrs, old) {
	var name;

	// remove attributes no longer present on the vnode by setting them to undefined
	for (name in old) {
		if (!(attrs && attrs[name] != null) && old[name] != null) {
			setAccessor(dom, name, old[name], old[name] = undefined, isSvgMode);
		}
	}

	// add new & update changed attributes
	for (name in attrs) {
		if (name !== 'children' && name !== 'innerHTML' && (!(name in old) || attrs[name] !== (name === 'value' || name === 'checked' ? dom[name] : old[name]))) {
			setAccessor(dom, name, old[name], old[name] = attrs[name], isSvgMode);
		}
	}
}

/** Retains a pool of Components for re-use, keyed on component name.
 *	Note: since component names are not unique or even necessarily available, these are primarily a form of sharding.
 *	@private
 */
var components = {};

/** Reclaim a component for later re-use by the recycler. */
function collectComponent(component) {
	var name = component.constructor.name;
	(components[name] || (components[name] = [])).push(component);
}

/** Create a component. Normalizes differences between PFC's and classful Components. */
function createComponent(Ctor, props, context) {
	var list = components[Ctor.name],
	    inst;

	if (Ctor.prototype && Ctor.prototype.render) {
		inst = new Ctor(props, context);
		Component.call(inst, props, context);
	} else {
		inst = new Component(props, context);
		inst.constructor = Ctor;
		inst.render = doRender;
	}

	if (list) {
		for (var i = list.length; i--;) {
			if (list[i].constructor === Ctor) {
				inst.nextBase = list[i].nextBase;
				list.splice(i, 1);
				break;
			}
		}
	}
	return inst;
}

/** The `.render()` method for a PFC backing instance. */
function doRender(props, state, context) {
	return this.constructor(props, context);
}

/** Set a component's `props` (generally derived from JSX attributes).
 *	@param {Object} props
 *	@param {Object} [opts]
 *	@param {boolean} [opts.renderSync=false]	If `true` and {@link options.syncComponentUpdates} is `true`, triggers synchronous rendering.
 *	@param {boolean} [opts.render=true]			If `false`, no render will be triggered.
 */
function setComponentProps(component, props, opts, context, mountAll) {
	if (component._disable) { return; }
	component._disable = true;

	if (component.__ref = props.ref) { delete props.ref; }
	if (component.__key = props.key) { delete props.key; }

	if (!component.base || mountAll) {
		if (component.componentWillMount) { component.componentWillMount(); }
	} else if (component.componentWillReceiveProps) {
		component.componentWillReceiveProps(props, context);
	}

	if (context && context !== component.context) {
		if (!component.prevContext) { component.prevContext = component.context; }
		component.context = context;
	}

	if (!component.prevProps) { component.prevProps = component.props; }
	component.props = props;

	component._disable = false;

	if (opts !== 0) {
		if (opts === 1 || options.syncComponentUpdates !== false || !component.base) {
			renderComponent(component, 1, mountAll);
		} else {
			enqueueRender(component);
		}
	}

	if (component.__ref) { component.__ref(component); }
}

/** Render a Component, triggering necessary lifecycle events and taking High-Order Components into account.
 *	@param {Component} component
 *	@param {Object} [opts]
 *	@param {boolean} [opts.build=false]		If `true`, component will build and store a DOM node if not already associated with one.
 *	@private
 */
function renderComponent(component, opts, mountAll, isChild) {
	if (component._disable) { return; }

	var props = component.props,
	    state = component.state,
	    context = component.context,
	    previousProps = component.prevProps || props,
	    previousState = component.prevState || state,
	    previousContext = component.prevContext || context,
	    isUpdate = component.base,
	    nextBase = component.nextBase,
	    initialBase = isUpdate || nextBase,
	    initialChildComponent = component._component,
	    skip = false,
	    rendered,
	    inst,
	    cbase;

	// if updating
	if (isUpdate) {
		component.props = previousProps;
		component.state = previousState;
		component.context = previousContext;
		if (opts !== 2 && component.shouldComponentUpdate && component.shouldComponentUpdate(props, state, context) === false) {
			skip = true;
		} else if (component.componentWillUpdate) {
			component.componentWillUpdate(props, state, context);
		}
		component.props = props;
		component.state = state;
		component.context = context;
	}

	component.prevProps = component.prevState = component.prevContext = component.nextBase = null;
	component._dirty = false;

	if (!skip) {
		rendered = component.render(props, state, context);

		// context to pass to the child, can be updated via (grand-)parent component
		if (component.getChildContext) {
			context = extend(extend({}, context), component.getChildContext());
		}

		var childComponent = rendered && rendered.nodeName,
		    toUnmount,
		    base;

		if (typeof childComponent === 'function') {
			// set up high order component link

			var childProps = getNodeProps(rendered);
			inst = initialChildComponent;

			if (inst && inst.constructor === childComponent && childProps.key == inst.__key) {
				setComponentProps(inst, childProps, 1, context, false);
			} else {
				toUnmount = inst;

				component._component = inst = createComponent(childComponent, childProps, context);
				inst.nextBase = inst.nextBase || nextBase;
				inst._parentComponent = component;
				setComponentProps(inst, childProps, 0, context, false);
				renderComponent(inst, 1, mountAll, true);
			}

			base = inst.base;
		} else {
			cbase = initialBase;

			// destroy high order component link
			toUnmount = initialChildComponent;
			if (toUnmount) {
				cbase = component._component = null;
			}

			if (initialBase || opts === 1) {
				if (cbase) { cbase._component = null; }
				base = diff(cbase, rendered, context, mountAll || !isUpdate, initialBase && initialBase.parentNode, true);
			}
		}

		if (initialBase && base !== initialBase && inst !== initialChildComponent) {
			var baseParent = initialBase.parentNode;
			if (baseParent && base !== baseParent) {
				baseParent.replaceChild(base, initialBase);

				if (!toUnmount) {
					initialBase._component = null;
					recollectNodeTree(initialBase, false);
				}
			}
		}

		if (toUnmount) {
			unmountComponent(toUnmount);
		}

		component.base = base;
		if (base && !isChild) {
			var componentRef = component,
			    t = component;
			while (t = t._parentComponent) {
				(componentRef = t).base = base;
			}
			base._component = componentRef;
			base._componentConstructor = componentRef.constructor;
		}
	}

	if (!isUpdate || mountAll) {
		mounts.unshift(component);
	} else if (!skip) {
		// Ensure that pending componentDidMount() hooks of child components
		// are called before the componentDidUpdate() hook in the parent.
		// Note: disabled as it causes duplicate hooks, see https://github.com/developit/preact/issues/750
		// flushMounts();

		if (component.componentDidUpdate) {
			component.componentDidUpdate(previousProps, previousState, previousContext);
		}
		if (options.afterUpdate) { options.afterUpdate(component); }
	}

	if (component._renderCallbacks != null) {
		while (component._renderCallbacks.length) {
			component._renderCallbacks.pop().call(component);
		}
	}

	if (!diffLevel && !isChild) { flushMounts(); }
}

/** Apply the Component referenced by a VNode to the DOM.
 *	@param {Element} dom	The DOM node to mutate
 *	@param {VNode} vnode	A Component-referencing VNode
 *	@returns {Element} dom	The created/mutated element
 *	@private
 */
function buildComponentFromVNode(dom, vnode, context, mountAll) {
	var c = dom && dom._component,
	    originalComponent = c,
	    oldDom = dom,
	    isDirectOwner = c && dom._componentConstructor === vnode.nodeName,
	    isOwner = isDirectOwner,
	    props = getNodeProps(vnode);
	while (c && !isOwner && (c = c._parentComponent)) {
		isOwner = c.constructor === vnode.nodeName;
	}

	if (c && isOwner && (!mountAll || c._component)) {
		setComponentProps(c, props, 3, context, mountAll);
		dom = c.base;
	} else {
		if (originalComponent && !isDirectOwner) {
			unmountComponent(originalComponent);
			dom = oldDom = null;
		}

		c = createComponent(vnode.nodeName, props, context);
		if (dom && !c.nextBase) {
			c.nextBase = dom;
			// passing dom/oldDom as nextBase will recycle it if unused, so bypass recycling on L229:
			oldDom = null;
		}
		setComponentProps(c, props, 1, context, mountAll);
		dom = c.base;

		if (oldDom && dom !== oldDom) {
			oldDom._component = null;
			recollectNodeTree(oldDom, false);
		}
	}

	return dom;
}

/** Remove a component from the DOM and recycle it.
 *	@param {Component} component	The Component instance to unmount
 *	@private
 */
function unmountComponent(component) {
	if (options.beforeUnmount) { options.beforeUnmount(component); }

	var base = component.base;

	component._disable = true;

	if (component.componentWillUnmount) { component.componentWillUnmount(); }

	component.base = null;

	// recursively tear down & recollect high-order component children:
	var inner = component._component;
	if (inner) {
		unmountComponent(inner);
	} else if (base) {
		if (base['__preactattr_'] && base['__preactattr_'].ref) { base['__preactattr_'].ref(null); }

		component.nextBase = base;

		removeNode(base);
		collectComponent(component);

		removeChildren(base);
	}

	if (component.__ref) { component.__ref(null); }
}

/** Base Component class.
 *	Provides `setState()` and `forceUpdate()`, which trigger rendering.
 *	@public
 *
 *	@example
 *	class MyFoo extends Component {
 *		render(props, state) {
 *			return <div />;
 *		}
 *	}
 */
function Component(props, context) {
	this._dirty = true;

	/** @public
  *	@type {object}
  */
	this.context = context;

	/** @public
  *	@type {object}
  */
	this.props = props;

	/** @public
  *	@type {object}
  */
	this.state = this.state || {};
}

extend(Component.prototype, {

	/** Returns a `boolean` indicating if the component should re-render when receiving the given `props` and `state`.
  *	@param {object} nextProps
  *	@param {object} nextState
  *	@param {object} nextContext
  *	@returns {Boolean} should the component re-render
  *	@name shouldComponentUpdate
  *	@function
  */

	/** Update component state by copying properties from `state` to `this.state`.
  *	@param {object} state		A hash of state properties to update with new values
  *	@param {function} callback	A function to be called once component state is updated
  */
	setState: function setState(state, callback) {
		var s = this.state;
		if (!this.prevState) { this.prevState = extend({}, s); }
		extend(s, typeof state === 'function' ? state(s, this.props) : state);
		if (callback) { (this._renderCallbacks = this._renderCallbacks || []).push(callback); }
		enqueueRender(this);
	},


	/** Immediately perform a synchronous re-render of the component.
  *	@param {function} callback		A function to be called after component is re-rendered.
  *	@private
  */
	forceUpdate: function forceUpdate(callback) {
		if (callback) { (this._renderCallbacks = this._renderCallbacks || []).push(callback); }
		renderComponent(this, 2);
	},


	/** Accepts `props` and `state`, and returns a new Virtual DOM tree to build.
  *	Virtual DOM is generally constructed via [JSX](http://jasonformat.com/wtf-is-jsx).
  *	@param {object} props		Props (eg: JSX attributes) received from parent element/component
  *	@param {object} state		The component's current state
  *	@param {object} context		Context object (if a parent component has provided context)
  *	@returns VNode
  */
	render: function render() {}
});

/** Render JSX into a `parent` Element.
 *	@param {VNode} vnode		A (JSX) VNode to render
 *	@param {Element} parent		DOM element to render into
 *	@param {Element} [merge]	Attempt to re-use an existing DOM tree rooted at `merge`
 *	@public
 *
 *	@example
 *	// render a div into <body>:
 *	render(<div id="hello">hello!</div>, document.body);
 *
 *	@example
 *	// render a "Thing" component into #foo:
 *	const Thing = ({ name }) => <span>{ name }</span>;
 *	render(<Thing name="one" />, document.querySelector('#foo'));
 */
function render(vnode, parent, merge) {
  return diff(merge, vnode, {}, false, parent, false);
}


//# sourceMappingURL=preact.esm.js.map

'use strict';
var Router = (function (Component$$1) {
  function Router () {
    Component$$1.apply(this, arguments);
  }

  if ( Component$$1 ) Router.__proto__ = Component$$1;
  Router.prototype = Object.create( Component$$1 && Component$$1.prototype );
  Router.prototype.constructor = Router;

  Router.prototype.render = function render$$1 () {
    return preact.h( 'div', null,
      this.props.children && this.props.children.map(function (child) {
          console.log(child.attributes, window.iamgy);
          if (!window.iamgy) { return child; }
          if (window.iamgy.path && child.attributes.path != null && window.iamgy.path != child.attributes.path) { return null; }
          if (window.iamgy.page && child.attributes.page != null && window.iamgy.page != child.attributes.page) { return null; }
          return child;
        })
    );
  };

  return Router;
}(Component));

'use strict';
var Base = (function (Component$$1) {
  function Base () {
    Component$$1.apply(this, arguments);
  }

  if ( Component$$1 ) Base.__proto__ = Component$$1;
  Base.prototype = Object.create( Component$$1 && Component$$1.prototype );
  Base.prototype.constructor = Base;

  Base.prototype.render = function render$$1 () {
    return preact.h( 'div', { class: "main" },
      preact.h( 'div', null, this.props.children )
    )
  };

  return Base;
}(Component));

var TAGS = {
	'' : ['<em>','</em>'],
	_ : ['<strong>','</strong>'],
	'\n' : ['<br />'],
	' ' : ['<br />'],
	'-': ['<hr />']
};

/** Outdent a string based on the first indented line's leading whitespace
 *	@private
 */
function outdent(str) {
	return str.replace(RegExp('^'+(str.match(/^(\t| )+/) || '')[0], 'gm'), '');
}

/** Encode special attribute characters to HTML entities in a String.
 *	@private
 */
function encodeAttr(str) {
	return (str+'').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Parse Markdown into an HTML String. */
function parse(md) {
	var tokenizer = /((?:^|\n+)(?:\n---+|\* \*(?: \*)+)\n)|(?:^```(\w*)\n([\s\S]*?)\n```$)|((?:(?:^|\n+)(?:\t|  {2,}).+)+\n*)|((?:(?:^|\n)([>*+-]|\d+\.)\s+.*)+)|(?:\!\[([^\]]*?)\]\(([^\)]+?)\))|(\[)|(\](?:\(([^\)]+?)\))?)|(?:(?:^|\n+)([^\s].*)\n(\-{3,}|={3,})(?:\n+|$))|(?:(?:^|\n+)(#{1,3})\s*(.+)(?:\n+|$))|(?:`([^`].*?)`)|(  \n\n*|\n{2,}|__|\*\*|[_*])/gm,
		context = [],
		out = '',
		last = 0,
		links = {},
		chunk, prev, token, inner, t;

	function tag(token) {
		var desc = TAGS[token.replace(/\*/g,'_')[1] || ''],
			end = context[context.length-1]==token;
		if (!desc) { return token; }
		if (!desc[1]) { return desc[0]; }
		context[end?'pop':'push'](token);
		return desc[end|0];
	}

	function flush() {
		var str = '';
		while (context.length) { str += tag(context[context.length-1]); }
		return str;
	}

	md = md.replace(/^\[(.+?)\]:\s*(.+)$/gm, function (s, name, url) {
		links[name.toLowerCase()] = url;
		return '';
	}).replace(/^\n+|\n+$/g, '');

	while ( (token=tokenizer.exec(md)) ) {
		prev = md.substring(last, token.index);
		last = tokenizer.lastIndex;
		chunk = token[0];
		if (prev.match(/[^\\](\\\\)*\\$/)) {
			// escaped
		}
		// Code/Indent blocks:
		else if (token[3] || token[4]) {
			chunk = '<pre class="code '+(token[4]?'poetry':token[2].toLowerCase())+'">'+outdent(encodeAttr(token[3] || token[4]).replace(/^\n+|\n+$/g, ''))+'</pre>';
		}
		// > Quotes, -* lists:
		else if (token[6]) {
			t = token[6];
			if (t.match(/\./)) {
				token[5] = token[5].replace(/^\d+/gm, '');
			}
			inner = parse(outdent(token[5].replace(/^\s*[>*+.-]/gm, '')));
			if (t==='>') { t = 'blockquote'; }
			else {
				t = t.match(/\./) ? 'ol' : 'ul';
				inner = inner.replace(/^(.*)(\n|$)/gm, '<li>$1</li>');
			}
			chunk = '<'+t+'>' + inner + '</'+t+'>';
		}
		// Images:
		else if (token[8]) {
			chunk = "<img src=\"" + (encodeAttr(token[8])) + "\" alt=\"" + (encodeAttr(token[7])) + "\">";
		}
		// Links:
		else if (token[10]) {
			out = out.replace('<a>', ("<a href=\"" + (encodeAttr(token[11] || links[prev.toLowerCase()])) + "\">"));
			chunk = flush() + '</a>';
		}
		else if (token[9]) {
			chunk = '<a>';
		}
		// Headings:
		else if (token[12] || token[14]) {
			t = 'h' + (token[14] ? token[14].length : (token[13][0]==='='?1:2));
			chunk = '<'+t+'>' + parse(token[12] || token[15]) + '</'+t+'>';
		}
		// `code`:
		else if (token[16]) {
			chunk = '<code>'+encodeAttr(token[16])+'</code>';
		}
		// Inline formatting: *em*, **strong** & friends
		else if (token[17] || token[1]) {
			chunk = tag(token[17] || '--');
		}
		out += prev;
		out += chunk;
	}

	return (out + md.substring(last) + flush()).trim();
}


//# sourceMappingURL=snarkdown.es.js.map

'use strict';
var TextRender = (function (Component$$1) {
  function TextRender(props) {
    Component$$1.call(this, props);

    
  }

  if ( Component$$1 ) TextRender.__proto__ = Component$$1;
  TextRender.prototype = Object.create( Component$$1 && Component$$1.prototype );
  TextRender.prototype.constructor = TextRender;

  TextRender.prototype.render = function render$$1 () {
    return preact.h( 'div', { class: "textrender", dangerouslySetInnerHTML: {__html: parse(this.props.data)} });
  };

  return TextRender;
}(Component));

var _type = function(obj) {
  var class2type = {};
  var toString = class2type.toString;
  return obj == null ? String(obj) :
  class2type[toString.call(obj)] || 'object';
};
var isObject = function(obj) {
  return _type(obj) == 'object';
};
var formatDate =  function(date, fmt) {
  if (isObject(date) == false) {
    return date;
  }
  date = new Date(date);
  if (fmt === undefined) {
    fmt = 'yyyy-MM-dd hh:mm:ss';
  }
  var o = {
    'M+': date.getMonth() + 1, //月份
    'd+': date.getDate(), //日
    'h+': date.getHours(), //小时
    'm+': date.getMinutes(), //分
    's+': date.getSeconds(), //秒
    'q+': Math.floor((date.getMonth() + 3) / 3), //季度
    'S': date.getMilliseconds() //毫秒
  };
  if (/(y+)/.test(fmt)) { fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length)); }
  for (var k in o)
    { if (new RegExp('(' + k + ')').test(fmt)) { fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length))); } }
  return fmt;
};

var F10To64 = function (number) {
  var chars = '0123456789abcdefghigklmnopqrstuvwxyzABCDEFGHIGKLMNOPQRSTUVWXYZ'.split(''),
      radix = chars.length,
      qutient = +number,
      arr = [],
      mod = 0;
  
  do {
      mod = qutient % radix;
      qutient = (qutient - mod) / radix;
      arr.unshift(chars[mod]);
  } while (qutient);
  return arr.join('');
};

var fetch = function (url, params) {
  return window.fetch(url, params).then(function(res) {
    var contentType = (res.headers.get('content-type') || '').match(/(?:charset=)(.+)/);
    var charset = '';
    if (contentType && contentType.length > 1) {
      charset = contentType[1];
    }
    return new Promise(function (resolve, reject) {
      var reader = new window.FileReader();
      reader.onload = function(e) {
        var text = reader.result;
        resolve(eval('(' + text + ')'));
      };
      res.blob().then(function (blog) {
        reader.readAsText(blog, charset);
      });
    });
  });
};

var Post = function (url, data) {

  var params = Object.keys(data).map(function(key) {
    return ((encodeURIComponent(key)) + "=" + (encodeURIComponent(data[key])));
  }).join('&');
  var config = {
    method: 'POST',
    body: params,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };
  return fetch(url, config);
};

'use strict';
var TextEdit = (function (Component$$1) {
  function TextEdit(props) {
    Component$$1.call(this, props);
  }

  if ( Component$$1 ) TextEdit.__proto__ = Component$$1;
  TextEdit.prototype = Object.create( Component$$1 && Component$$1.prototype );
  TextEdit.prototype.constructor = TextEdit;


  TextEdit.prototype.handleCancel = function handleCancel () {
    this.props.onChange(false);
  };

  TextEdit.prototype.handleSave = function handleSave () {
    var value = document.getElementById('text-edit-textarea').value;
    this.props.onChange(true, value);
  };

  TextEdit.prototype.render = function render$$1 () {
    console.log(this.props.data);
    return preact.h( 'div', { class: "text-edit" },
      preact.h( 'textarea', { id: "text-edit-textarea", value: this.props.data }),
      preact.h( 'div', { class: "text-cancel", onClick: this.handleCancel.bind(this) }, "Cancel"),
      preact.h( 'div', { class: "text-save", onClick: this.handleSave.bind(this) }, "Save")
    );
  };

  return TextEdit;
}(Component));

'use strict';
var New = (function (Component$$1) {
  function New(props) {
    Component$$1.call(this, props);

    this.state = {
      data: [],
      updateTime: Date.now(),
      isOpenEdit: false,
      nowEditIndex: null,
      link: this.ramdomLink()
    };

    this.getData();
  }

  if ( Component$$1 ) New.__proto__ = Component$$1;
  New.prototype = Object.create( Component$$1 && Component$$1.prototype );
  New.prototype.constructor = New;


  New.prototype.ramdomLink = function ramdomLink () {
    return F10To64(Math.floor(Date.now()));
  };

  New.prototype.handleAdd = function handleAdd (type, index) {
    var ref = this.state;
    var data = ref.data;
    data.splice(index, 0, {
      type: type,
      data: ''
    });
    this.setState({
      updateTime: Date.now()
    });
  };

  New.prototype.handleDel = function handleDel (index) {
    var ref = this.state;
    var data = ref.data;

    if (!window.confirm('确认要删除吗？')) { return; }
    data.splice(index, 1);
    this.setState({
      updateTime: Date.now()
    });
  };

  New.prototype.handleEdit = function handleEdit (index) {
    this.setState({
      isOpenEdit: true,
      nowEditIndex: index
    });
  };

  New.prototype.render_doing = function render_doing (index) {
    return preact.h( 'div', { class: "doing" },
      preact.h( 'i', { class: "text", onClick: this.handleAdd.bind(this, 'text', index) }),
      preact.h( 'i', { class: "image", onClick: this.handleAdd.bind(this, 'image', index) }),
      preact.h( 'i', { class: "code", onClick: this.handleAdd.bind(this, 'code', index) })
    );
  };

  New.prototype.render_type = function render_type (item) {
    switch(item.type) {
      case 'text':
        return preact.h( TextRender, { data: item.data });
    }
  };

  New.prototype.renderItem = function renderItem (item, index) {
    return preact.h( 'div', { class: "item", 'data-title': item.type },
      preact.h( 'div', { class: "item-edit", onClick: this.handleEdit.bind(this, index) }),
      preact.h( 'div', { class: "item-close", onClick: this.handleDel.bind(this, index) }),
      this.render_type(item),
      this.render_doing(index + 1)
    );
  };

  New.prototype.renderEdit = function renderEdit () {
    var this$1 = this;

    var ref = this.state;
    var nowEditIndex = ref.nowEditIndex;
    var data = ref.data;
    if (nowEditIndex == null) { return; }
    var dataItem = data[nowEditIndex];

    console.log(dataItem);

    switch(dataItem.type) {
      case 'text':
        return preact.h( TextEdit, { data: dataItem.data, onChange: this.editChange.bind(this, nowEditIndex) });
      default:
        setTimeout(function (){
          this$1.setState({
            isOpenEdit: false
          });
        }, 200);
    }
  };

  New.prototype.editChange = function editChange (index, isChange, data) {
    if (!isChange) {
      this.setState({
        isOpenEdit: false
      });
    } else {
      this.state.data[index].data = data;
      this.setState({
        isOpenEdit: false,
        updateTime: Date.now()
      });
    }
  };

  New.prototype.handleSend = function handleSend (status) {
    var ref = this.state;
    var data = ref.data;
    var title = document.getElementById('new-info-title').value;
    var tags = document.getElementById('new-info-tags').value;
    var summary = document.getElementById('new-info-summary').value;
    var link = document.getElementById('new-info-link').value;
    var id = window.iamgy.id || 0;

    

    var postData = {
      title: title,
      tags: tags,
      summary: summary,
      link: link,
      status: status,
      data: JSON.stringify(data),
      id: id
    };

    if (!id) {
      var time = document.getElementById('new-info-time').value;
      if (time) {
        postData.time = postData/1000;
      }
    }

    Post('https://iam.gy/me/new', postData).then(function (res) {
      if (!res.success) {
        window.open('../plogin');
      } else {
        location.href = '../plist';
      }
    });
  };

  New.prototype.getData = function getData () {
    var this$1 = this;

    if (!window.iamgy.id) { return; }

    

    fetch('//iam.gy/api/post/' + window.iamgy.id + '/?admin=1', {
      credentials: 'include'
    }).then(function (res) {
      console.log(res);

      if (!res.success) { return; }

      var data = [];

      try {
        data = JSON.parse(res.data.content);
        document.getElementById('new-info-title').value = res.data.title;
        document.getElementById('new-info-tags').value = res.data.tags;
        document.getElementById('new-info-summary').value = res.data.summary;
        document.getElementById('new-info-link').value = res.data.link;
        document.getElementById('now-info-createTime').value = formatDate((new Date(res.data.createTime * 1000)) - 0, 'yy/MM/dd hh:mm:ss');
      } catch(e) {}

      this$1.setState({
        data: data 
      });
    });
  };
  
  New.prototype.render = function render$$1 () {
    var this$1 = this;

    var ref = this.state;
    var data = ref.data;
    var isOpenEdit = ref.isOpenEdit;
    var link = ref.link;
    var flClass = 'new-fl';
    if (isOpenEdit) { flClass += ' active'; }

    return preact.h( 'div', { class: "new" },
      preact.h( 'div', { class: flClass },
      isOpenEdit && this.renderEdit()
      ),
      preact.h( 'div', { class: "new-editor" },
        preact.h( 'div', { class: "editor-label", 'data-label': "Title" },
          preact.h( 'input', { type: "text", id: "new-info-title" })
        ),
        preact.h( 'div', { class: "editor-label", 'data-label': "Tags" },
          preact.h( 'input', { type: "text", id: "new-info-tags" })
        ),
        preact.h( 'div', { class: "editor-label", 'data-label': "Summary" },
          preact.h( 'input', { type: "text", id: "new-info-summary" })
        ),
        preact.h( 'div', { class: "editor-label", 'data-label': "Link" },
          preact.h( 'input', { type: "text", id: "new-info-link", value: link })
        ),
        preact.h( 'div', { class: "editor-label", 'data-label': "CreateTime" },
          preact.h( 'input', { type: "text", id: "now-info-createTime", disabled: true }),
          preact.h( 'input', { type: "text", id: "new-info-time" })
        ),
        this.render_doing(0),
        data.map(function (item, index) {
            return this$1.renderItem(item, index);
          }),
        preact.h( 'div', { class: "new-editor-button" },
          preact.h( 'div', { class: "new-editor-btn save", onClick: this.handleSend.bind(this, 1) }, "Save"),
          preact.h( 'div', { class: "new-editor-btn pub", onClick: this.handleSend.bind(this, 2) }, "Publish")

        )
      )
      
    )
  };

  return New;
}(Component));

'use strict';
var Login = (function (Component$$1) {
  function Login () {
    Component$$1.apply(this, arguments);
  }

  if ( Component$$1 ) Login.__proto__ = Component$$1;
  Login.prototype = Object.create( Component$$1 && Component$$1.prototype );
  Login.prototype.constructor = Login;

  Login.prototype.handleSend = function handleSend () {
    var account = document.getElementById('login-account').value;
    var password = document.getElementById('login-password').value;



    Post('https://iam.gy/me/login', {
      account: account,
      password: password
    }).then(function (res) {
      if (res.success) {
        window.close();
      }
    });
  };

  
  Login.prototype.render = function render$$1 () {
    
    return preact.h( 'div', { class: "login" },
      preact.h( 'input', { id: "login-account", placeholder: "Account" }),
      preact.h( 'input', { type: "password", id: "login-password", placeholder: "Password" }),
      preact.h( 'div', { class: "login-btn", onClick: this.handleSend.bind(this) }, "Login")
    )
  };

  return Login;
}(Component));

'use strict';
var List = (function (Component$$1) {
  function List(props) {
    Component$$1.call(this, props);

    this.state = {
      data: [],
      page: 1
    };

    this.getLogin();
  }

  if ( Component$$1 ) List.__proto__ = Component$$1;
  List.prototype = Object.create( Component$$1 && Component$$1.prototype );
  List.prototype.constructor = List;

  List.prototype.getLogin = function getLogin () {
    var this$1 = this;

    return fetch('//iam.gy/me/logined', {
      credentials: 'include'
    }).then(function (res) {
      if (!res.success) {
        window.open('./plogin');
      } else {
        this$1.fetchData();
      }
    });
  };

  List.prototype.fetchData = function fetchData () {
    var this$1 = this;

    var ref = this.state;
    var page = ref.page;
    fetch('//iam.gy/api/list/' + page + '/?noContent=true&admin=1', {
      credentials: 'include'
    }).then(function (res) {
      this$1.setState({
        data: res.data
      });
    });
  };

  
  List.prototype.render = function render$$1 () {
    var ref = this.state;
    var data = ref.data;
    return preact.h( 'div', { class: "list" },
      preact.h( 'div', { class: "list-main" },
        preact.h( 'div', { class: "list-header" }, "IAM.GY ", preact.h( 'a', { class: "list-to-new", href: "./pnew/", target: "_blank" }, "New Post")
        ),
        preact.h( 'div', null,
          data.map(function (item) {
              return preact.h( 'a', { href: "./pnew/" + item.id, target: "_blank" },
                preact.h( 'div', { class: "list-item" },
                  preact.h( 'div', { class: "list-title" }, item.title),
                  preact.h( 'div', { class: "list-summary" }, item.summary),
                  preact.h( 'div', { class: "list-info" },
                    item.status == 1 ? '[草稿]' : '[已发布]', " | 添加时间: ", formatDate((new Date(item.createTime * 1000)) - 0, 'yy/MM/dd hh:mm:ss'), " | 最后修改时间: ", formatDate((new Date(item.changeTime * 1000)) - 0, 'yy/MM/dd hh:mm:ss'), " | 标签: ", item.tags
                  )
                )
              );
            })
        )
      )
    );
  };

  return List;
}(Component));

'use strict';
var IWenKu = (function (Component$$1) {
  function IWenKu () {
    Component$$1.apply(this, arguments);
  }

  if ( Component$$1 ) IWenKu.__proto__ = Component$$1;
  IWenKu.prototype = Object.create( Component$$1 && Component$$1.prototype );
  IWenKu.prototype.constructor = IWenKu;

  IWenKu.prototype.render = function render$$1 () {
    return preact.h( Base, null,
      preact.h( Router, null,
        preact.h( New, { path: 'me', page: 'pnew' }),
        preact.h( Login, { path: 'me', page: 'plogin' }),
        preact.h( List, { path: 'me', page: 'plist' })
      )
    )
  };

  return IWenKu;
}(Component));


render(preact.h( IWenKu, null ), document.getElementById('container'));

}());
//# sourceMappingURL=admin.js.map
