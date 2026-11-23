const https = require('https');
const urls = [
  'https://www.apple.com/la/mac/',
  'https://www.apple.com/la/ipad/',
  'https://www.apple.com/la/watch/'
];

urls.forEach(u => {
  https.get(u, r => {
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
          console.log(u, [...new Set(matches)]);
      }
    });
  });
});
