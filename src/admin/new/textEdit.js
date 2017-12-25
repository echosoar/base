'use strict';
import { Component } from 'preact'; /** @jsx h */

import './textEdit.less';

class TextEdit extends Component {
  
  constructor(props) {
    super(props);
  }


  handleCancel() {
    this.props.onChange(false);
  }

  handleSave() {
    let value = document.getElementById('text-edit-textarea').value;
    this.props.onChange(true, value);
  }

  render() {
    console.log(this.props.data)
    return <div class="text-edit">
      <textarea id="text-edit-textarea" value={this.props.data}></textarea>
      <div class="text-cancel" onClick={this.handleCancel.bind(this)}>Cancel</div>
      <div class="text-save" onClick={this.handleSave.bind(this)}>Save</div>
    </div>;
  }
}

export default TextEdit;