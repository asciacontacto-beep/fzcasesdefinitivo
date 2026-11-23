const fs = require('fs');
const path = require('path');

const files = ['index.html', 'catalogo.html', 'nosotros.html', 'info-importante.html', 'garantia.html'];

files.forEach(f => {
    const filePath = path.join(__dirname, f);
    if(fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        // Update CSS cache buster
        content = content.replace(/styles\.css\?v=[^"']*/g, 'styles.css?v=3.0');
        // Update script.js cache buster or add one
        content = content.replace(/script\.js(\?v=[^"']*)?"/g, 'script.js?v=3.0"');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Cache busted: ' + f);
    }
});
