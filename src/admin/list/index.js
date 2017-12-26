'use strict';
import { Component } from 'preact'; /** @jsx h */
import Fetch from '_/components/utils/fetch.js';
import TimeFormat from '_/components/utils/time.js';
import './index.less';
class List extends Component {

  constructor(props) {
    super(props);

    this.state = {
      data: [],
      page: window.iamgy.id || 1,
      tol: 0
    };

    this.getLogin();
  }

  getLogin() {
    return Fetch('//iam.gy/me/logined', {
      credentials: 'include'
    }).then(res => {
      if (!res.success) {
        window.open('./plogin');
      } else {
        this.fetchData();
      }
    });
  }

  fetchData() {
    let { page } = this.state;
    Fetch('//iam.gy/api/list/' + page + '/?noContent=true&admin=1', {
      credentials: 'include'
    }).then(res => {
      this.setState({
        data: res.data,
        tol: res.total
      });
    });
  }

  handleChangePage(newPage) {
    let { page } = this.state;

    if (page == newPage) return;

    this.state.page = newPage;
    this.fetchData();
  }

  renderPagation() {
    let { tol, page } = this.state;
    if (!tol) return;
    let pages = Math.ceil(tol/10);

    return <div>
      {
        (new Array(pages + 1)).join('0').split('').map((_, index) => {
          let className = 'list-page-item';
          if (index + 1 == page) {
            className += ' active';
          }

          return <div class={className} onClick={this.handleChangePage.bind(this, index + 1)}>{ index + 1 }</div>
        })
      }
    </div>
  }
  
  render() {
    let { data, tol } = this.state;
    return <div class="list">
      <div class="list-main">
        <div class="list-header">
          IAM.GY
          <a class="list-to-new" href="//iam.gy/me/pnew/"  target="_blank">New Post</a>
        </div>
        <div>
          {
            data.map(item => {
              return <a href={"//iam.gy/me/pnew/" + item.id} target="_blank">
                <div class="list-item">
                  <div class="list-title">{ item.title }</div>
                  <div class="list-summary">{ item.summary }</div>
                  <div class="list-info">
                    { item.status == 1 ? '[草稿]' : '[已发布]' } | 
                    添加时间: { TimeFormat((new Date(item.createTime * 1000)) - 0, 'yy/MM/dd hh:mm:ss') } | 
                    最后修改时间: { TimeFormat((new Date(item.changeTime * 1000)) - 0, 'yy/MM/dd hh:mm:ss') } | 
                    标签: { item.tags }
                  </div>
                </div>
              </a>;
            })
          }
        </div>
        <div class="list-pagation">
          { tol > 0 && this.renderPagation() }
        </div>
      </div>
    </div>;
  }
}

export default List;

