import fetch from './fetch.js';


export default (url, data) => {

  const params = Object.keys(data).map(function(key) {
    return `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`;
  }).join('&');
  const config = {
    method: 'POST',
    body: params,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  };
  return fetch(url, config);
}