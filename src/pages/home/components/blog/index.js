'use strict';
import { Component } from 'preact'; /** @jsx h */
import TimeFormat from '_/components/utils/time.js';
import './index.less';

const SortBy = [
  {
    name: 'Time',
    value: 'time'
  },
  {
    name: 'Word',
    value: 'word'
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
    setTimeout(()=>{
      this.setState({
        [type]: [
          {
            title: '10 Things I Hate About Social Issues Journalism',
            img: "//cdn-images-1.medium.com/max/2000/1*NyQPW2AYiu84R8rjiJBLVw.jpeg",
            summary: "",
            time: 1512013860020,
            tags: ['Test', 'TagsA'],
            link: 'sadsafasffa'
          },
          {
            title: 'White people, we’re tired of trying to convince you of our humanity',
            summary: "Yesterday a group of WOC and I spent several hours online working with a white woman who couldn’t understand her comments that minimized racism and discounted the struggles of black women were harmful. An ally I work with spent several more hours working with her one-on-one. The result? She barely budged in her way of thinking.",
            time: 1514013860020,
            tags: ['Test', 'TagsB']
          },
          {
            title: 'Alphabet’s Schmidt Hands Reins to Google Founders, Leaders',
            summary: "Google parent Alphabet Inc. no longer needs Eric Schmidt’s adult supervision.After 17 years in senior management, Schmidt is relinquishing his executive chairman role. He was recruited from Novell Inc. when Google had just 200 employees; now it’s a dominant global force in search, online advertising and…",
            time: 1514013860020,
            tags: ['Test', 'TagsB']
          },{
            title: 'Prove everyone wrong',
            summary: "",
            img: '//cdn-images-1.medium.com/max/1600/1*xk9ZcxhJvELFfc50da722w.jpeg',
            time: 1514013860020,
            tags: ['Test', 'TagsB']
          },
          {
            title: 'White people, we’re tired of trying to convince you of our humanity',
            summary: "Yesterday a group of WOC and I spent several hours online working with a white woman who couldn’t understand her comments that minimized racism and discounted the struggles of black women were harmful. An ally I work with spent several more hours working with her one-on-one. The result? She barely budged in her way of thinking.",
            time: 1514013860020,
            tags: ['Test', 'TagsB']
          },
          {
            title: 'A Cute Toy Just Brought a Hacker Into Your Home',
            summary: "Amid the holiday shopping season, cybersecurity researchers warn that new, interactive toys are vulnerable to many hacking threats.",
            time: 1514013860020,
            tags: ['Test', 'TagsB']
          },
          {
            title: '2017读了上百本书，唯独这7本彻底改变了我',
            time: 1514013860020,
            img: '//upload-images.jianshu.io/upload_images/2206395-5025633bfebeecec.jpeg?imageMogr2/auto-orient/',
            tags: ['Test', 'TagsB']
          },
          {
            title: '《红楼梦》与民国名著',
            time: 1514013860020,
            img: '//upload-images.jianshu.io/upload_images/5513287-60d6a2939be94bb0.gif?imageMogr2/auto-orient/strip%7CimageView2/2/w/700',
            tags: ['Test', 'TagsB']
          },
          {
            title: 'Why ‘The Dark Is Rising’ Is the Book We Need Right Now',
            time: 1514013860020,
            img: '//cdn-images-1.medium.com/max/2000/1*ocdu-Vzzw9C5UDaKrx1o7Q.jpeg',
            tags: ['Test', 'TagsB']
          }]
      });
    }, 1000);
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
          this.state[nowType] && this.state[nowType].map(post => {

            let className = 'blog-item';
            let style = {};

            if (post.img) {
              className += ' blog-item-haveImg';
              style['background-image'] = `url(${ post.img })`;
            }

            return <div class={className} style={style}>
              <a href={'//iam.gy/post/' + post.link} target="_blank">
                <div class="blog-item-title">{ post.title }</div>
                {
                  !post.img && <div class="blog-summary">
                    { post.summary }
                  </div>
                }
                {
                  post.tags && <div class="blog-tags">#{post.tags.slice(0, 2).join(' #')}</div>
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