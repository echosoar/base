
let fetch = (url, params) => {
  return window.fetch(url, params).then(function(res) {
    const contentType = (res.headers.get('content-type') || '').match(/(?:charset=)(.+)/);
    let charset = '';
    if (contentType && contentType.length > 1) {
      charset = contentType[1];
    }
    return new Promise((resolve, reject) => {
      const reader = new window.FileReader();
      reader.onload = function(e) {
        const text = reader.result;
        resolve(eval('(' + text + ')'));
      };
      res.blob().then((blog) => {
        reader.readAsText(blog, charset);
      });
    });
  });
}

export default fetch;

