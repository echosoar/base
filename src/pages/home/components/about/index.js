'use strict';
import { Component } from 'preact'; /** @jsx h */
import './index.less';

class About extends Component {

  render() {
    return <div class="about">
      <div class="about-title">About Me</div>
      <div class="about-content">
        <div>Hello! My name is GaoYang, and I live in<i class="icon-hangzhou"></i>HangZhou, China.</div>
        <div>I am a development engineer at<i class="icon-tmall"></i>Tmall.</div>
        <div>My favorite languages are<i class="icon-js"></i>Javascript and<i class="icon-go"></i>Go, but I have broad experience with many languages and technologies.</div>
      </div>
    </div>;
  }
}

export default About;