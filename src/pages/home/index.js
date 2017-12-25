'use strict';
import { Component } from 'preact'; /** @jsx h */
import GitRepos from './components/gitRepos/index.js';
import About from './components/about/index.js';
import Posts from './components/blog/index.js';
import Er from './components/er/index.js';
import './index.less';

class Home extends Component {
  
  render() {
    return <div class="home">
      <div class="home-container">
        <div class="home-logo"></div>
        <div class="home-text">
          I AM GaoYang, I AM <span class="home-iam">
            <Er />
          </span> !
        </div>
      </div>
      <div class="container">
        <div class="git-container">
          <GitRepos />
        </div>
        <div class="about-container">
          <About />
        </div>
        <div class="blog-container">
          <Posts />
        </div>
      </div>
    </div>;
  }
}

export default Home;