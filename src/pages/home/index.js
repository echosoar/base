'use strict';
import { Component } from 'preact'; /** @jsx h */
import GitRepos from './components/gitRepos/index.js';
import './index.less';

class Home extends Component {
  
  render() {
    return <div class="home">
      <div class="home-container">
        <GitRepos />
      </div>
    </div>;
  }
}

export default Home;