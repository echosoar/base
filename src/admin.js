'use strict';
import { h, Component, render } from 'preact'; /** @jsx h */
import Router from '_/components/router/index.js';
import Base from '_/admin/base/index.js';
import New from '_/admin/new/index.js';
import Login from '_/admin/login/index.js';
import List from '_/admin/list/index.js';
class IWenKu extends Component {
  
  render() {
    return <Base>
      <Router>
        <New path='me' page='pnew' />
        <Login path='me' page='plogin' />
        <List path='me' page='plist' />
      </Router>
    </Base>
  }
}


render(<IWenKu />, document.getElementById('container'));