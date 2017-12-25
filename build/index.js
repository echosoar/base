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
      preact.h( 'div', null, this.props.children ),
      preact.h( 'div', { class: "copyright" }, "© 2018 IAM.GY 浙公网安备33010602900497, 浙ICP备171200123号-1")
      
    )
  };

  return Base;
}(Component));

var LangColor = {
  javascript: 'rgb(241, 224, 90)',
  php: 'rgb(79, 93, 149)',
  makefile: 'rgb(66, 120, 25)',
  css: 'rgb(86, 61, 124)',
  html: 'rgb(227, 76, 38)'
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

'use strict';
var GitRepos = (function (Component$$1) {
  function GitRepos(props) {
    Component$$1.call(this, props);

    this.state = {
      repos: [],
      getDataCount: 0
    };
    this.getData();
  }

  if ( Component$$1 ) GitRepos.__proto__ = Component$$1;
  GitRepos.prototype = Object.create( Component$$1 && Component$$1.prototype );
  GitRepos.prototype.constructor = GitRepos;

  GitRepos.prototype.getData = function getData () {
    var this$1 = this;

    this.state.getDataCount ++;
    // 获取前5个最新的和5个star最多的
    fetch('//api.github.com/users/echosoar/repos?sort=update').then(function (repos) {

      var newest = repos.sort(function (a, b) {
        return (new Date(b.pushed_at)) - (new Date(a.pushed_at));
      }).splice(0, 4);
      var sortedRepos = repos.sort(function (a, b) {
        return b.stargazers_count - a.stargazers_count;
      }).splice(0, 4);

      this$1.setState({
        repos: sortedRepos.concat(newest)
      });
    }).catch(function (e) {
      this$1.state.getDataCount < 5 && this$1.getData();
    });
  };
  
  GitRepos.prototype.render = function render$$1 () {
    var ref = this.state;
    var repos = ref.repos;
    return preact.h( 'div', { class: "gitRepos" },
      preact.h( 'div', { class: "gitRepos-title" }, "Open Source Repositories"),
      repos && repos.map(function (repo, index) {

          var updateTime = new Date(repo.pushed_at);

          return preact.h( 'a', { href: repo.html_url, target: "_blank" },
            preact.h( 'div', { class: "gitReposItem" },
              preact.h( 'div', { class: "gitReposItemTitle" },
                preact.h( 'svg', { 'aria-hidden': "true", class: "octicon octicon-grabber", height: "16", version: "1.1", viewBox: "0 0 8 16", width: "8" }, preact.h( 'path', { 'fill-rule': "evenodd", d: "M8 4v1H0V4h8zM0 8h8V7H0v1zm0 3h8v-1H0v1z" })),
                repo.name
              ),
              preact.h( 'div', { class: "gitReposItemDesc" }, repo.description),
              repo.language && preact.h( 'div', { class: "gitReposItemLang" },
                  preact.h( 'div', { class: "gitReposItemLangColor", style: {'background-color': LangColor[repo.language.toLowerCase()] || '#000'} }),
                  repo.language
                ),
              repo.stargazers_count > 0 && preact.h( 'div', { class: "gitReposItemStar" },
                  preact.h( 'svg', { 'aria-label': "stars", class: "octicon octicon-star", height: "16", role: "img", version: "1.1", viewBox: "0 0 14 16", width: "14" }, preact.h( 'path', { 'fill-rule': "evenodd", d: "M14 6l-4.9-.64L7 1 4.9 5.36 0 6l3.6 3.26L2.67 14 7 11.67 11.33 14l-.93-4.74z" })),
                  repo.stargazers_count
                ),
              preact.h( 'div', { class: "gitReposItemTime" },
                updateTime.getFullYear() + '/' + (updateTime.getMonth() + 1) + '/' + updateTime.getDate()
              )
            
            )
          )
        })
    );
  };

  return GitRepos;
}(Component));

'use strict';
var About = (function (Component$$1) {
  function About () {
    Component$$1.apply(this, arguments);
  }

  if ( Component$$1 ) About.__proto__ = Component$$1;
  About.prototype = Object.create( Component$$1 && Component$$1.prototype );
  About.prototype.constructor = About;

  About.prototype.render = function render$$1 () {
    return preact.h( 'div', { class: "about" },
      preact.h( 'div', { class: "about-title" }, "About Me"),
      preact.h( 'div', { class: "about-content" },
        preact.h( 'div', null, "Hello! My name is GaoYang, and I live in", preact.h( 'i', { class: "icon-hangzhou" }), "HangZhou, China." ),
        preact.h( 'div', null, "I am a development engineer at", preact.h( 'i', { class: "icon-tmall" }), "Tmall." ),
        preact.h( 'div', null, "My favorite languages are", preact.h( 'i', { class: "icon-js" }), "Javascript and", preact.h( 'i', { class: "icon-go" }), "Go, but I have broad experience with many languages and technologies." )
      )
    );
  };

  return About;
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

'use strict';
var SortBy = [
  {
    name: 'Time',
    value: 'time'
  },
  {
    name: 'Word',
    value: 'word'
  },
  {
    name: 'Read',
    value: 'read'
  }
];

var Blog = (function (Component$$1) {
  function Blog(props) {
    this.state = {
      nowType: null
    };

    this.handleChangeType(SortBy[0].value);
  }

  if ( Component$$1 ) Blog.__proto__ = Component$$1;
  Blog.prototype = Object.create( Component$$1 && Component$$1.prototype );
  Blog.prototype.constructor = Blog;

  Blog.prototype.handleChangeType = function handleChangeType (type) {
    var this$1 = this;

    var ref = this.state;
    var nowType = ref.nowType;
    if (type == nowType) { return; }

    if (this.state[type]) {
      this.setState({
        nowType: type
      });
    } else {
      this.setState({
        nowType: type
      });
      setTimeout(function () {
        this$1.loadData(type);
      }, 0);
    }
  };

  Blog.prototype.loadData = function loadData (type) {
    var this$1 = this;

    setTimeout(function (){
      this$1.setState(( obj = {}, obj[type] = [
          {
            title: '10 Things I Hate About Social Issues Journalism',
            img: "//cdn-images-1.medium.com/max/2000/1*NyQPW2AYiu84R8rjiJBLVw.jpeg",
            summary: "",
            time: 1512013860020,
            tags: ['Test', 'TagsA'],
            link: 'sadsafasffa'
          },
          {
            title: 'White people, we’re tired of trying to convince you of our humanity',
            summary: "Yesterday a group of WOC and I spent several hours online working with a white woman who couldn’t understand her comments that minimized racism and discounted the struggles of black women were harmful. An ally I work with spent several more hours working with her one-on-one. The result? She barely budged in her way of thinking.",
            time: 1514013860020,
            tags: ['Test', 'TagsB']
          },
          {
            title: 'Alphabet’s Schmidt Hands Reins to Google Founders, Leaders',
            summary: "Google parent Alphabet Inc. no longer needs Eric Schmidt’s adult supervision.After 17 years in senior management, Schmidt is relinquishing his executive chairman role. He was recruited from Novell Inc. when Google had just 200 employees; now it’s a dominant global force in search, online advertising and…",
            time: 1514013860020,
            tags: ['Test', 'TagsB']
          },{
            title: 'Prove everyone wrong',
            summary: "",
            img: '//cdn-images-1.medium.com/max/1600/1*xk9ZcxhJvELFfc50da722w.jpeg',
            time: 1514013860020,
            tags: ['Test', 'TagsB']
          },
          {
            title: 'White people, we’re tired of trying to convince you of our humanity',
            summary: "Yesterday a group of WOC and I spent several hours online working with a white woman who couldn’t understand her comments that minimized racism and discounted the struggles of black women were harmful. An ally I work with spent several more hours working with her one-on-one. The result? She barely budged in her way of thinking.",
            time: 1514013860020,
            tags: ['Test', 'TagsB']
          },
          {
            title: 'A Cute Toy Just Brought a Hacker Into Your Home',
            summary: "Amid the holiday shopping season, cybersecurity researchers warn that new, interactive toys are vulnerable to many hacking threats.",
            time: 1514013860020,
            tags: ['Test', 'TagsB']
          },
          {
            title: '2017读了上百本书，唯独这7本彻底改变了我',
            time: 1514013860020,
            img: '//upload-images.jianshu.io/upload_images/2206395-5025633bfebeecec.jpeg?imageMogr2/auto-orient/',
            tags: ['Test', 'TagsB']
          },
          {
            title: '《红楼梦》与民国名著',
            time: 1514013860020,
            img: '//upload-images.jianshu.io/upload_images/5513287-60d6a2939be94bb0.gif?imageMogr2/auto-orient/strip%7CimageView2/2/w/700',
            tags: ['Test', 'TagsB']
          },
          {
            title: 'Why ‘The Dark Is Rising’ Is the Book We Need Right Now',
            time: 1514013860020,
            img: '//cdn-images-1.medium.com/max/2000/1*ocdu-Vzzw9C5UDaKrx1o7Q.jpeg',
            tags: ['Test', 'TagsB']
          }], obj));
      var obj;
    }, 1000);
  };

  Blog.prototype.render = function render$$1 () {
    var this$1 = this;

    var ref = this.state;
    var nowType = ref.nowType;
    return preact.h( 'div', { class: "blog" },
      preact.h( 'div', { class: "blog-title" }, "Posts ", preact.h( 'div', { class: "blog-sort" }, "Sort by ", SortBy.map(function (by) {
              var className = '';
              if (nowType == by.value) { className = 'blog-type-active'; }
              return preact.h( 'span', { class: className, onClick: this$1.handleChangeType.bind(this$1, by.value) }, by.name);
            })
        )
      ),
      preact.h( 'div', { class: "blog-main" },
        this.state[nowType] && this.state[nowType].map(function (post) {

            var className = 'blog-item';
            var style = {};

            if (post.img) {
              className += ' blog-item-haveImg';
              style['background-image'] = "url(" + (post.img) + ")";
            }

            return preact.h( 'div', { class: className, style: style },
              preact.h( 'a', { href: '//iam.gy/post/' + post.link, target: "_blank" },
                preact.h( 'div', { class: "blog-item-title" }, post.title),
                !post.img && preact.h( 'div', { class: "blog-summary" },
                    post.summary
                  ),
                post.tags && preact.h( 'div', { class: "blog-tags" }, "#", post.tags.slice(0, 2).join(' #')),
                preact.h( 'div', { class: "blog-item-time" }, formatDate(post.time, 'yy/MM/dd'))
              )
            );
          }),
        this.state[nowType] && preact.h( 'div', { class: "blog-item" },
            preact.h( 'div', { class: "blog-mylikesentence" }, "Live well", preact.h( 'br', null ), "Love lots", preact.h( 'br', null ), "And laugh often"),
            preact.h( 'a', { href: "//iam.gy/posts/", class: "blog-toblog", target: "_blank" }, "View All Posts")
          ),
        !this.state[nowType] && preact.h( 'div', null, "Loading" )
      )
      
    );
  };

  return Blog;
}(Component));

'use strict';
var iam = [
  'Developer',
  'Programmer',
  'Coder',
  'Innovator',
  'Traveler',
  'Creator',
  'Jser',
  'Gopher',
  'Geek'
];

var Er = (function (Component$$1) {
  function Er(props) {
    Component$$1.call(this, props);

    this.state = {
      nowIndex: 0
    };

    this.changeIndex();
  }

  if ( Component$$1 ) Er.__proto__ = Component$$1;
  Er.prototype = Object.create( Component$$1 && Component$$1.prototype );
  Er.prototype.constructor = Er;

  Er.prototype.changeIndex = function changeIndex () {
    var nowIndex = this.state.nowIndex;
    nowIndex ++;
    if (nowIndex >= iam.length) { nowIndex = 0; }
    this.setState({
      nowIndex: nowIndex
    });
    setTimeout(this.changeIndex.bind(this), 1200);
  };
  
  Er.prototype.render = function render$$1 () {
    var ref = this.state;
    var nowIndex = ref.nowIndex;
    return preact.h( 'div', { class: "er" },
      iam.map(function (item, index) {
          var className = 'eritem';
          if (index == nowIndex) {
            className += ' erItemActive';
          }
          return preact.h( 'div', { class: className }, item);
        })
    );
  };

  return Er;
}(Component));

'use strict';
var Home = (function (Component$$1) {
  function Home () {
    Component$$1.apply(this, arguments);
  }

  if ( Component$$1 ) Home.__proto__ = Component$$1;
  Home.prototype = Object.create( Component$$1 && Component$$1.prototype );
  Home.prototype.constructor = Home;

  Home.prototype.render = function render$$1 () {
    return preact.h( 'div', { class: "home" },
      preact.h( 'div', { class: "home-container" },
        preact.h( 'div', { class: "home-logo" }),
        preact.h( 'div', { class: "home-text" }, "I AM GaoYang, I AM ", preact.h( 'span', { class: "home-iam" },
            preact.h( Er, null )
          ), " !")
      ),
      preact.h( 'div', { class: "container" },
        preact.h( 'div', { class: "git-container" },
          preact.h( GitRepos, null )
        ),
        preact.h( 'div', { class: "about-container" },
          preact.h( About, null )
        ),
        preact.h( 'div', { class: "blog-container" },
          preact.h( Blog, null )
        )
      )
    );
  };

  return Home;
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
        preact.h( Home, { path: 'home' })
      )
    )
  };

  return IWenKu;
}(Component));


render(preact.h( IWenKu, null ), document.getElementById('container'));

}());
//# sourceMappingURL=index.js.map
