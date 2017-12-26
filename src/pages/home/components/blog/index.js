'use strict';
import { Component } from 'preact'; /** @jsx h */
import Fetch from '_/components/utils/fetch.js';
import TimeFormat from '_/components/utils/time.js';
import './index.less';

const SortBy = [
  {
    name: 'Add',
    value: 'createTime'
  },
  {
    name: 'Update',
    value: 'changeTime'
  },
  {
    name: 'Read',
    value: 'read'
  }
]

class Blog extends Component {

  constructor(props) {
    this.state = {
      nowType: null
    }

    this.handleChangeType(SortBy[0].value);
  }



  handleChangeType(type) {
    let { nowType } = this.state;
    if (type == nowType) return;

    if (this.state[type]) {
      this.setState({
        nowType: type
      });
    } else {
      this.setState({
        nowType: type
      });
      setTimeout(() => {
        this.loadData(type);
      }, 0);
    }
  }

  loadData(type) {

    let { page } = this.state;
    Fetch('//iam.gy/api/list/' + page + '/' + type + '?noContent=true', {
      credentials: 'include'
    }).then(res => {
      this.setState({
        [type]: res.data
      });
    });
  
  }

  render() {
    let { nowType, isLoading } = this.state;
    return <div class="blog">
      <div class="blog-title">
        Posts
        <div class="blog-sort">
          Sort by {
            SortBy.map(by => {
              let className = '';
              if (nowType == by.value) className = 'blog-type-active';
              return <span class={className} onClick={this.handleChangeType.bind(this, by.value)}>{ by.name }</span>;
            })
          }
        </div>
      </div>
      <div class="blog-main">
        {
          this.state[nowType] && this.state[nowType].slice(0, 9).map(post => {

            let className = 'blog-item';
            let style = {};

            if (post.img) {
              className += ' blog-item-haveImg';
              style['background-image'] = `url(${ post.img })`;
            }

            return <div class={className} style={style}>
              <a href={'//iam.gy/p/' + post.link} target="_blank">
                <div class="blog-item-title">{ post.title }</div>
                {
                  !post.img && <div class="blog-summary">
                    { post.summary }
                  </div>
                }
                {
                  post.tags && <div class="blog-tags">#{post.tags.split(',').slice(0, 2).join(' #')}</div>
                }
                <div class="blog-item-time">{ TimeFormat(post.time, 'yy/MM/dd') }</div>
              </a>
            </div>;
          })
        }
        {
          this.state[nowType] && <div class="blog-item">
            <div class="blog-mylikesentence">Live well<br />Love lots<br />And laugh often</div>
            <a href="//iam.gy/posts/" class="blog-toblog" target="_blank">View All Posts</a>
          </div>
        }
        {
          !this.state[nowType] && <div>Loading</div>
        }
      </div>
      
    </div>;
  }
}

export default Blog;