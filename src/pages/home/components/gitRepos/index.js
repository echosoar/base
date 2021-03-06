'use strict';
import { Component } from 'preact'; /** @jsx h */
import LangColor from '_/components/utils/langColor.js';
import Fetch from '_/components/utils/fetch.js';
import './index.less';

class GitRepos extends Component {

  constructor(props) {
    super(props);

    this.state = {
      repos: [],
      getDataCount: 0
    };
    this.getData();
  }

  getData() {
    this.state.getDataCount ++;
    // 获取前5个最新的和5个star最多的
    Fetch('//api.github.com/users/echosoar/repos?sort=update').then(repos => {

      let newest = repos.sort((a, b) => {
        return (new Date(b.pushed_at)) - (new Date(a.pushed_at));
      }).splice(0, 4);
      let sortedRepos = repos.sort((a, b) => {
        return b.stargazers_count - a.stargazers_count;
      }).splice(0, 4);

      this.setState({
        repos: sortedRepos.concat(newest)
      });
    }).catch(e => {
      this.state.getDataCount < 5 && this.getData();
    });
  }
  
  render() {
    let { repos } = this.state;
    return <div class="gitRepos">
      <div class="gitRepos-title">Open Source Repositories</div>
      {
        repos && repos.map((repo, index) => {

          let updateTime = new Date(repo.pushed_at);

          return <a href={ repo.html_url } target="_blank">
            <div class="gitReposItem">
              <div class="gitReposItemTitle">
                <svg aria-hidden="true" class="octicon octicon-grabber" height="16" version="1.1" viewBox="0 0 8 16" width="8"><path fill-rule="evenodd" d="M8 4v1H0V4h8zM0 8h8V7H0v1zm0 3h8v-1H0v1z"></path></svg>
                { repo.name }
              </div>
              <div class="gitReposItemDesc">{ repo.description }</div>
              {
                repo.language && <div class="gitReposItemLang">
                  <div class="gitReposItemLangColor" style={{'background-color': LangColor[repo.language.toLowerCase()] || '#000'}} />
                  { repo.language }
                </div>
              }
              {
                repo.stargazers_count > 0 && <div class="gitReposItemStar">
                  <svg aria-label="stars" class="octicon octicon-star" height="16" role="img" version="1.1" viewBox="0 0 14 16" width="14"><path fill-rule="evenodd" d="M14 6l-4.9-.64L7 1 4.9 5.36 0 6l3.6 3.26L2.67 14 7 11.67 11.33 14l-.93-4.74z"></path></svg>
                  {
                    repo.stargazers_count
                  }
                </div>
              }
              <div class="gitReposItemTime">
                {
                  updateTime.getFullYear() + '/' + (updateTime.getMonth() + 1) + '/' + updateTime.getDate()
                }
              </div>
            
            </div>
          </a>
        })
      }
    </div>;
  }
}

export default GitRepos;