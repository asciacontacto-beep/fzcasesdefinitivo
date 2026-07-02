const https = require('https');
const urls = [
  'https://www.apple.com/la/mac/',
  'https://www.apple.com/la/iphone/',
  'https://www.apple.com/la/ipad/',
  'https://www.apple.com/la/watch/'
];

async function fetchAll() {
  for (const u of urls) {
    await new Promise(resolve => {
      https.get(u, r => {
        let d='';
        r.on('data', c=>d+=c);
        r.on('end', () => {
          const regex = /<img[^>]+src="([^"]+chapternav[^"]+)"/g;
          let match;
          while ((match = regex.exec(d)) !== null) {
            console.log(u, match[1]);
          }
          resolve();
        });
      });
    });
  }
}
fetchAll();
