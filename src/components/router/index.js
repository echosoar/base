'use strict';
import { Component } from 'preact'; /** @jsx h */

// 传入class，在path匹配上的时候使用此class

class Router extends Component {
  render() {
    return <div>
      {
        this.props.children && this.props.children.map(child => {
          if (!window.iamgy) return child;
          console.log(child.attributes)
          if (window.iamgy.path && child.attributes.notPath != null && window.iamgy.path != child.attributes.notPath) {
            return child;
          }

          if (window.iamgy.path && child.attributes.path != null && window.iamgy.path != child.attributes.path) return null;

          if (window.iamgy.page && child.attributes.page != null && window.iamgy.page != child.attributes.page) return null;
          return child;
        })
      }
    </div>;
  }
}

export default Router;