'use strict';
import { Component } from 'preact'; /** @jsx h */

// 传入class，在path匹配上的时候使用此class

class Router extends Component {
  
  

  render() {
    return <div>
      {
        this.props.children
      }
    </div>;
  }
}

export default Router;