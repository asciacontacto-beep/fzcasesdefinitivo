const https = require('https');

function fetch(url) {
  https.get(url, res => {
    let d='';
    res.on('data', c=>d+=c);
    res.on('end', () => {
      const regex = /\/v\/[a-z]+\/home\/[^\"'\s]+\.svg/g;
      const matches = d.match(regex);
      if (matches) {
        console.log([...new Set(matches)]);
      } else {
        console.log("No matches for", url);
      }
    });
  });
}

fetch('https://www.apple.com/la/mac/');
fetch('https://www.apple.com/la/ipad/');
fetch('https://www.apple.com/la/iphone/');
fetch('https://www.apple.com/la/watch/');
