'use strict';
import { Component } from 'preact'; /** @jsx h */
import Router from '_/components/router/index.js';
import './index.less';

class Base extends Component {
  
  render() {
    return <div class="main">
      <div>{ this.props.children }</div>
      <div class="copyright">© 2018 IAM.GY 浙公网安备33010602900497, 浙ICP备171200123号-1</div>
      
    </div>
  }
}

export default Base;

