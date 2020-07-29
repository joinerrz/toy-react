// 让wrapper 和dom行为一致
class ElementWrapper {
  constructor(type) {
    this.root = document.createElement(type);
  }
  setAttribute(name, value) {
    if (name === 'className') name = 'class';

    if (name.match(/^on([\s\S]+)$/)) {
      let eventName = RegExp.$1.replace(/^[\s\S]/, (s) => s.toLocaleLowerCase())
      console.log(eventName)
      this.root.addEventListener(eventName, value);
    }
    this.root.setAttribute(name, value);
  }
  appendChild(vchild) {
    let range = document.createRange();

    if (this.root.children.length) {
      range.setStartAfter(this.root.lastChild);
      range.setEndAfter(this.root.lastChild);
    } else {
      range.setStart(this.root, 0);
      range.setEnd(this.root, 0);
    }
    vchild.mountTo(range);
  }
  mountTo(range) {
    // parent.appendChild(this.root);
    range.deleteContents();
    range.insertNode(this.root);
  }
}

class TextWrapper {
  constructor(content) {
    this.root = document.createTextNode(content);
  }
  mountTo(range) {
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

  setAttribute(name, value) {
    this.props[name] = value;
    this[name] = value;
  }

  mountTo(range) {
    this.range = range;
    this.update()
  }
  update() {
    this.range.deleteContents();
    let vdom = this.render();
    vdom.mountTo(this.range);
  }

  appendChild(vchild) {
    this.children.push(vchild);
  }

  setState(state) {
    // this.state
    let merge = (oldState, newState) => {
      for (let key in newState) {
        if(typeof newState[key] === 'object'){
          if (typeof oldState[key] !== 'object') {
            oldState[key] = {};
          }
          merge(oldState[key], newState[key])
        } else {
          oldState[key] = newState[key];
        }
      }
    }

    if (!this.state && stat) {
      this.stat = {};
    }

    merge(this.state, state);
    console.log(this.state);
    // rerender

  }
}

export const ToyReact = {
  createElement: function (type, attributes, ...children) {
    let element;
    // console.log('in create element ++');
    // console.log(type);
    // console.log(arguments);
    if (typeof type === 'string') {
      element = new ElementWrapper(type);
    } else {
      // component
      element = new type();
    }

    // console.log('element', element);

    for (let name in attributes) {
      element.setAttribute(name, attributes[name]);
    }

    let insertChildren = (children) => {
      for (let child of children) {
        if (typeof child === 'object' && child instanceof Array) {
          insertChildren(child);
        } else {
          // 白名单
          if (
            !(child instanceof Component) &&
            !(child instanceof ElementWrapper) &&
            !(child instanceof TextWrapper)
          ) {
            child = String(child);
          }
          if (typeof child === 'string') {
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
