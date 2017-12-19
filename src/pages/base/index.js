'use strict';
import { Component } from 'preact'; /** @jsx h */
import Router from '_/components/router/index.js';
import './index.less';

class Base extends Component {
  
  render() {
    return <div class="main">
      <div class="head">
        <div class="head-container">
          <div class="logo">ECHO<br />SOAR</div>
        </div>
        <nav>
          <div class="nav-container">
            <Router class={'nav-active'} displayAll>
              <a class="nav-item nav-active" href="#/" path="/">Blog</a>
              <a class="nav-item" path="#/about" path="/about">About</a>
            </Router>
          </div>
        </nav>
      </div>
      
      <div>{ this.props.children }</div>
    </div>
  }
}

export default Base;

