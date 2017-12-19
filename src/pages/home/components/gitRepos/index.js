'use strict';
import { Component } from 'preact'; /** @jsx h */
import LangColor from '_/components/utils/langColor.js';
import Fetch from '_/components/utils/fetch.js';
import './index.less';

class GitRepos extends Component {

  constructor(props) {
    super(props);

    this.state = {
      repos: []
    };
    this.getData();
  }

  getData() {
    // 获取前5个最新的和5个star最多的
    Fetch('//api.github.com/users/echosoar/repos?sort=update').then(repos => {
     //console.log(repos);

      let newest = repos.splice(0, 5);
      let sortedRepos = repos.sort((a, b) => {
        return b.stargazers_count - a.stargazers_count;
      }).splice(0, 5);

      this.setState({
        repos: sortedRepos.concat(newest)
      });
    })
  }
  
  render() {
    let { repos } = this.state;
    return <div class="gitRepos">
      {
        repos && repos.map((repo, index) => {
          console.log(repo)

          let updateTime = new Date(repo.created_at);
          return <div class="gitReposItem">
            <div class="gitReposItemTitle">{ repo.name }</div>
            <div class="gitReposItemDesc">{ repo.description }</div>
            {
              repo.language && <div class="gitReposItemLang">
                <div class="gitReposItemLangColor" style={{'background-color': LangColor[repo.language.toLowerCase()] || '#000'}} />
                { repo.language }
              </div>
            }
            {
              index < 5 && <div class="gitReposItemStar">
                <svg aria-label="stars" class="octicon octicon-star" height="16" role="img" version="1.1" viewBox="0 0 14 16" width="14"><path fill-rule="evenodd" d="M14 6l-4.9-.64L7 1 4.9 5.36 0 6l3.6 3.26L2.67 14 7 11.67 11.33 14l-.93-4.74z"></path></svg>
                {
                  repo.stargazers_count
                }
              </div>
            }
            {
              index >= 5 && <div class="gitReposItemTime">
                {
                  updateTime.getFullYear() + '/' + (updateTime.getMonth() + 1) + '/' + updateTime.getDate() + ' ' + updateTime.getHours() + ':' + updateTime.getMinutes()
                }
              </div>
            }
          </div>
        })
      }
    </div>;
  }
}

export default GitRepos;