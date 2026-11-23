const https = require('https');
const urls = [
  'https://www.apple.com/la/mac/',
  'https://www.apple.com/la/ipad/',
  'https://www.apple.com/la/watch/',
  'https://www.apple.com/la/iphone/'
];

urls.forEach(u => {
  https.get(u, r => {
    let d='';
    r.on('data', c=>d+=c);
    r.on('end', () => {
      const regex = /[^"']+\/chapternav\/[a-zA-Z0-9_]+\.(png|svg)/g;
      const matches = d.match(regex);
      if(matches) {
          console.log(u, [...new Set(matches)].filter(x => !x.includes('small')));
      }
    });
  });
});
