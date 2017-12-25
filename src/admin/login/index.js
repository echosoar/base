'use strict';
import { Component } from 'preact'; /** @jsx h */
import Post from '_/components/utils/post.js';

import './index.less';
class Login extends Component {

  handleSend() {
    let account = document.getElementById('login-account').value;
    let password = document.getElementById('login-password').value;



    Post('https://iam.gy/me/login', {
      account,
      password
    }).then(res => {
      if (res.success) {
        window.close();
      }
    })
  }

  
  render() {
    
    return <div class="login">
      <input id="login-account" placeholder="Account" />
      <input type="password" id="login-password"  placeholder="Password"  />
      <div class="login-btn" onClick={this.handleSend.bind(this)}>Login</div>
    </div>
  }
}

export default Login;

