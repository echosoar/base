'use strict';
import { Component } from 'preact'; /** @jsx h */
import Router from '_/components/router/index.js';
import TextRender from '_/components/render/text.js';
import TimeFormat from '_/components/utils/time.js';
import F10To64 from '_/components/utils/10to64.js';
import Post from '_/components/utils/post.js';
import TextEdit from './textEdit.js';
import Fetch from '_/components/utils/fetch.js';

import './index.less';
class New extends Component {

  constructor(props) {
    super(props);

    this.state = {
      data: [],
      updateTime: Date.now(),
      isOpenEdit: false,
      nowEditIndex: null,
      link: this.ramdomLink()
    };

    this.getData();
  }


  ramdomLink() {
    return F10To64(Math.floor(Date.now()));
  }

  handleAdd(type, index) {
    let { data } = this.state;
    data.splice(index, 0, {
      type,
      data: ''
    });
    this.setState({
      updateTime: Date.now()
    });
  }

  handleDel(index) {
    let { data } = this.state;

    if (!window.confirm('确认要删除吗？')) return;
    data.splice(index, 1);
    this.setState({
      updateTime: Date.now()
    });
  }

  handleEdit(index) {
    this.setState({
      isOpenEdit: true,
      nowEditIndex: index
    })
  }

  render_doing(index) {
    return <div class="doing">
      <i class="text" onClick={this.handleAdd.bind(this, 'text', index)}></i>
      <i class="image" onClick={this.handleAdd.bind(this, 'image', index)}></i>
      <i class="code" onClick={this.handleAdd.bind(this, 'code', index)}></i>
    </div>;
  }

  render_type(item) {
    switch(item.type) {
      case 'text':
        return <TextRender data={item.data} />;
    }
  }

  renderItem(item, index) {
    return <div class="item" data-title={item.type}>
      <div class="item-edit" onClick={this.handleEdit.bind(this, index)}></div>
      <div class="item-close" onClick={this.handleDel.bind(this, index)}></div>
      {
        this.render_type(item)
      }
      {
        this.render_doing(index + 1)
      }
    </div>;
  }

  renderEdit() {
    let { nowEditIndex, data } = this.state;
    if (nowEditIndex == null) return;
    let dataItem = data[nowEditIndex];

    console.log(dataItem)

    switch(dataItem.type) {
      case 'text':
        return <TextEdit data={dataItem.data} onChange={this.editChange.bind(this, nowEditIndex)} />;
      default:
        setTimeout(()=>{
          this.setState({
            isOpenEdit: false
          })
        }, 200);
    }
  }

  editChange(index, isChange, data) {
    if (!isChange) {
      this.setState({
        isOpenEdit: false
      });
    } else {
      this.state.data[index].data = data;
      this.setState({
        isOpenEdit: false,
        updateTime: Date.now()
      });
    }
  }

  handleSend(status) {
    let { data } = this.state;
    let title = document.getElementById('new-info-title').value;
    let tags = document.getElementById('new-info-tags').value;
    let summary = document.getElementById('new-info-summary').value;
    let link = document.getElementById('new-info-link').value;
    let id = window.iamgy.id || 0;

    

    let postData = {
      title,
      tags,
      summary,
      link,
      status,
      data: JSON.stringify(data),
      id
    };

    if (!id) {
      let time = document.getElementById('new-info-time').value;
      if (time) {
        postData.time = time;
      }
    }

    Post('https://iam.gy/me/new', postData).then(res => {
      if (!res.success) {
        window.open('../plogin');
      } else {
        location.href = '../plist'
      }
    })
  }

  getData() {
    if (!window.iamgy.id) return;

    

    Fetch('//iam.gy/api/post/' + window.iamgy.id + '/?admin=1', {
      credentials: 'include'
    }).then(res => {
      console.log(res);

      if (!res.success) return;

      let data = [];

      try {
        data = JSON.parse(res.data.content);
        document.getElementById('new-info-title').value = res.data.title;
        document.getElementById('new-info-tags').value = res.data.tags;
        document.getElementById('new-info-summary').value = res.data.summary;
        document.getElementById('new-info-link').value = res.data.link;
        document.getElementById('now-info-createTime').value = TimeFormat((new Date(res.data.createTime * 1000)) - 0, 'yy/MM/dd hh:mm:ss');
      } catch(e) {}

      this.setState({
        data 
      });
    });
  }
  
  render() {
    let { data, isOpenEdit, link, summary, title, tags} = this.state;

    let flClass = 'new-fl';
    if (isOpenEdit) flClass += ' active';

    return <div class="new">
      <div class={ flClass }>
      {
        isOpenEdit && this.renderEdit()
      }
      </div>
      <div class="new-editor">
        <div class="editor-label" data-label="Title">
          <input type="text" id="new-info-title" />
        </div>
        <div class="editor-label" data-label="Tags">
          <input type="text" id="new-info-tags" />
        </div>
        <div class="editor-label" data-label="Summary">
          <input type="text" id="new-info-summary" />
        </div>
        <div class="editor-label" data-label="Link">
          <input type="text" id="new-info-link" value={link} />
        </div>
        <div class="editor-label" data-label="CreateTime">
          <input type="text"  id="now-info-createTime" disabled />
          <input type="text" id="new-info-time" />
        </div>
        {
          this.render_doing(0)
        }
        {
          data.map((item, index) => {
            return this.renderItem(item, index);
          })
        }
        <div class="new-editor-button">
          <div class="new-editor-btn save" onClick={this.handleSend.bind(this, 1)}>Save</div>
          <div class="new-editor-btn pub" onClick={this.handleSend.bind(this, 2)}>Publish</div>

        </div>
      </div>
      
    </div>
  }
}

export default New;

