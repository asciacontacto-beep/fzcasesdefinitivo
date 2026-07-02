const https = require('https');

function fetchImages(url) {
  https.get(url, r => {
    let d='';
    r.on('data', c=>d+=c);
    r.on('end', () => {
      const regex = /"([^"]*chapternav[^"]*\.(?:svg|png))"/g;
      const matches = [];
      let match;
      while ((match = regex.exec(d)) !== null) {
        matches.push(match[1]);
      }
      if(matches.length > 0) {
          console.log(url, [...new Set(matches)]);
      }
    });
  });
}

fetchImages('https://www.apple.com/la/watch/');
