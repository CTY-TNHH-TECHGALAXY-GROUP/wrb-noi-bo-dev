const fs = require('fs');
const path = require('path');

function extractBase64() {
    const htmlPath = path.join(__dirname, 'Page Choose Menu', 'oriaspa-textless-service-menu1.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    const match = htmlContent.match(/src="data:image\/(jpeg|png);base64,([^"]+)"/);
    if (match) {
        const base64Data = match[2];
        const outPath = path.join(__dirname, 'public', 'assets', 'service-menu-poster-textless.png');
        fs.writeFileSync(outPath, Buffer.from(base64Data, 'base64'));
        console.log('Saved textless poster to', outPath);
    } else {
        console.log('No base64 image found');
    }
}

extractBase64();
