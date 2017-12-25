

'use strict';
import { Component } from 'preact'; /** @jsx h */
import './index.less';

const iam = [
  'Developer',
  'Programmer',
  'Coder',
  'Innovator',
  'Traveler',
  'Creator',
  'Jser',
  'Gopher',
  'Geek'
]

class Er extends Component {

  constructor(props) {
    super(props);

    this.state = {
      nowIndex: 0
    }

    this.changeIndex();
  }

  changeIndex() {
    let nowIndex = this.state.nowIndex;
    nowIndex ++;
    if (nowIndex >= iam.length) nowIndex = 0;
    this.setState({
      nowIndex
    });
    setTimeout(this.changeIndex.bind(this), 1200);
  }
  
  render() {
    let { nowIndex } = this.state;
    return <div class="er">
      {
        iam.map((item, index) => {
          let className = 'eritem'
          if (index == nowIndex) {
            className += ' erItemActive';
          }
          return <div class={className}>{item}</div>;
        })
      }
    </div>;
  }
}

export default Er;