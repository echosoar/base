'use strict';
import { Component } from 'preact'; /** @jsx h */
import TextRender from '_/components/render/text.js';
import TimeFormat from '_/components/utils/time.js';
import './index.less';

class Post extends Component {

  constructor(props) {
    super(props);

    this.data = {
      content: []
    };
    
    try {
      this.data = JSON.parse(document.getElementById('data').textContent);
      this.data.content = JSON.parse(this.data.content);
    } catch(e) {}
  }
  

  render_type(item) {
    switch(item.type) {
      case 'text':
        return <TextRender data={item.data} />;
    }
  }

  render() {
    return <div class="post">
      <div class="post-main">
        <div class="post-title">{ this.data.title }</div>
        <div class="post-info">
        Posted at { TimeFormat(this.data.createTime * 1000, 'yy/MM/dd') } |
        Tags {
          this.data.tags.replace(/\s/g, '').split(',').map(tag => {
            return <span class="post-tag-item">{ tag }</span>;
          })
        }
        </div>
        <div class="post-content">{
          this.data.content.map(item => {
            return this.render_type(item);
          })
        }</div>
        <div class="post-more">
          Latest edited at { TimeFormat(this.data.changeTime * 1000, 'yy/MM/dd') }
        </div>
      </div>

    </div>;
  }
}

export default Post;