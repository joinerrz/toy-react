// 让wrapper 和dom行为一致

function setProps(element, props) {
  for (let name in props) {
    let value = props[name];

    if (name === "className") name = "class";

    if (name.match(/^on([\s\S]+)$/)) {
      let eventName = RegExp.$1.replace(/^[\s\S]/, (s) =>
        s.toLocaleLowerCase()
      );
      element.addEventListener(eventName, value);
    }
    element.setAttribute(name, value);
  }
}

function appendChild(element, children) {
  for (let child of children) {
    let range = document.createRange();
    if (element.children.length) {
      range.setStartAfter(element.lastChild);
      range.setEndAfter(element.lastChild);
    } else {
      range.setStart(element, 0);
      range.setEnd(element, 0);
    }
    child.mountTo(range);
  }
}

class ElementWrapper {
  constructor(type) {
    this.type = type;
    this.children = [];
    this.props = Object.create(null);
  }
  setAttribute(name, value) {
    this.props[name] = value;
  }
  appendChild(vchild) {
    this.children.push(vchild);
  }
  mountTo(range) {
    range.deleteContents();

    this.range = range;
    const element = document.createElement(this.type);

    // 设置 props
    setProps(element, this.props);

    // 添加children
    appendChild(element, this.children);

    range.insertNode(element);
  }
}

class TextWrapper {
  constructor(content) {
    this.root = document.createTextNode(content);
    this.type = "#text";
    this.children = [];
    this.props = Object.create(null);
  }
  mountTo(range) {
    this.range = range;
    // 清空dom
    range.deleteContents();
    range.insertNode(this.root);
  }
}

export class Component {
  constructor() {
    this.children = [];
    this.props = Object.create(null); // 用create 对象不对带上原型链
  }

  get type() {
    return this.constructor.name;
  }

  setAttribute(name, value) {
    this.props[name] = value;
    this[name] = value;
  }

  mountTo(range) {
    this.range = range;
    this.update();
  }
  update() {
    let vdom = this.render();
    if (this.vdom) {
      // 优化 diff
      // 比较 props state children

      let isSameNode = (node1, node2) => {
        if (!node1 || !node2) return false;
        if (node1.type !== node2.type) {
          console.log('type is not same')
          return false;
        }
        for (let name in node1.props) {
          if (typeof node1.props[name] === 'function' && typeof node2.props[name] === 'function' && node1.props[name].toString() === node2.props[name].toString()) {
            continue;
          }

          if (typeof node1.props[name] === 'object' && typeof node2.props[name] === 'object' && JSON.stringify(node1.props[name]) === JSON.stringify(node2.props[name])) {
            continue;
          }


          if (node1.props[name] !== node2.props[name]) {
            console.log('prop is not same', name);
            console.log(node1)
            return false;
          }
        }

        if (
          Object.keys(node1.props).length !== Object.keys(node2.props).length
        ) {
          console.log('prop length is not same')
          return false;
        }
        return true;
      };

      let isSameTree = (node1, node2) => {
        // 根节点不同 整个结点数就不同
        if (!isSameNode(node1, node2)) {
          console.log('根节点不同', node1)
          return false;
        }

        // 对比子节点长度
        if (node1.children.length !== node2.children.length) {
          return false;
        }

        for (let i = 0; i < node1.children.length; i++) {
          if (!isSameTree(node1.children[i], node2.children[i])) {
            return false;
          }
        }
        return true;
      };

      let replace = (newTree, oldTree) => {
            console.log('is replace');
            console.log(newTree);
          if (isSameTree(newTree, oldTree)) {
            console.log('is same tree', newTree);
            return;
          }

        if (!isSameNode(newTree, oldTree)) {
          console.log('is not same node +++', newTree)
          console.log()
          newTree.mountTo(oldTree.range);
        } else {
          console.log(' is not same node ', newTree)
          for (let i = 0; i < newTree.children.length; i++) {
            console.log('in for ++++')
            // 依次递归对比children
            replace(newTree.children[i], oldTree.children[i]);
          }
        }
      }

      replace(vdom, this.vdom);

      console.log("new:", vdom);
      console.log("old:", this.vdom);
    } else {
      vdom.mountTo(this.range);
    }

    this.vdom = vdom;
  }

  appendChild(vchild) {
    this.children.push(vchild);
  }

  setState(state) {
    // this.state
    let merge = (oldState, newState) => {
      for (let key in newState) {
        if (typeof newState[key] === "object" && newState[key] !== null) {
          if (typeof oldState[key] !== "object") {
            if (newState[key] instanceof Array) {
              //
              oldState[key] = [];
            } else {
              oldState[key] = {};
            }
          }
          merge(oldState[key], newState[key]);
        } else {
          oldState[key] = newState[key];
        }
      }
    };

    if (!this.state && stat) {
      this.stat = {};
    }

    merge(this.state, state);
    // rerender
    this.update();
  }
}

export const ToyReact = {
  createElement: function (type, attributes, ...children) {
    let element;
    // console.log('in create element ++');
    // console.log(type);
    // console.log(arguments);
    if (typeof type === "string") {
      element = new ElementWrapper(type);
    } else {
      // component
      element = new type(attributes);
    }

    // console.log('element', element);

    for (let name in attributes) {
      element.setAttribute(name, attributes[name]);
    }

    let insertChildren = (children) => {
      for (let child of children) {
        if (typeof child === "object" && child instanceof Array) {
          insertChildren(child);
        } else {
          if (child === null || child === void 0) child = "";
          // 白名单
          if (
            !(child instanceof Component) &&
            !(child instanceof ElementWrapper) &&
            !(child instanceof TextWrapper)
          ) {
            child = String(child);
          }
          if (typeof child === "string") {
            child = new TextWrapper(child);
          }
          // console.log('child'.child);
          element.appendChild(child);
        }
      }
    };

    insertChildren(children);

    return element;
  },

  render: function (vdom, element) {
    // 把vdom的实例转换为实dom的实例
    // vdom.mountTo(element);
    let range = document.createRange();

    if (element.children.length) {
      range.setStartAfter(element.lastChild);
      range.setEndAfter(element.lastChild);
    } else {
      range.setStart(element, 0);
      range.setEnd(element, 0);
    }
    vdom.mountTo(range);
  },
};
