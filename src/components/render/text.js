'use strict';
import { Component } from 'preact'; /** @jsx h */
import SnarkDown from 'snarkdown';
import './text.less';

class TextRender extends Component {
  
  constructor(props) {
    super(props);

    
  }

  render() {
    return <div class="textrender" dangerouslySetInnerHTML={{__html: SnarkDown(this.props.data)}} />;
  }
}

export default TextRender;