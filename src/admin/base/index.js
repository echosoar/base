'use strict';
import { Component } from 'preact'; /** @jsx h */
import Router from '_/components/router/index.js';
import './index.less';
class Base extends Component {
  
  render() {
    return <div class="main">
      <div>{ this.props.children }</div>
    </div>
  }
}

export default Base;

