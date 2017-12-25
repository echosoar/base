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
      page: window.iamgy.id || 1
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
        data: res.data
      });
    });
  }

  
  render() {
    let { data } = this.state;
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
      </div>
    </div>;
  }
}

export default List;

