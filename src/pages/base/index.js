'use strict';
import { Component } from 'preact'; /** @jsx h */
import Router from '_/components/router/index.js';
import './index.less';

class Base extends Component {
  
  render() {
    return <div class="main">
      <Router>
        <div notPath="home" path="notpath" class="header">
          <div class="header-main">
            <div class="header-logo"></div>
            <div class="header-nav">
              <a href="//iam.gy/">Home</a> / 
              <a href="//iam.gy/posts/">All Posts</a> / 
              <a href="//github.com/echosoar" target="_blank">Github</a>
            </div>
          </div>
        </div>
      </Router>
      <div>{ this.props.children }</div>
      <div class="copyright">© 2018 IAM.GY</div>
    </div>
  }
}

export default Base;

