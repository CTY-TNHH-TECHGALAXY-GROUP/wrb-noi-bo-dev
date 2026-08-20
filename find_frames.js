const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function findFrames() {
    const imgPath = path.join(__dirname, 'public', 'assets', 'service-menu-poster-textless.png');
    const { data, info } = await sharp(imgPath).raw().toBuffer({ resolveWithObject: true });
    
    // We want to find the left, right, top, bottom of each of the 4 frames.
    // Let's divide the image into 4 quadrants.
    const w2 = Math.floor(info.width / 2);
    const h2 = Math.floor(info.height / 2);
    
    const quadrants = [
        { name: 'pure', x1: 0, y1: 0, x2: w2, y2: h2 },
        { name: 'journey', x1: w2, y1: 0, x2: info.width, y2: h2 },
        { name: 'spa', x1: 0, y1: h2, x2: w2, y2: info.height },
        { name: 'home', x1: w2, y1: h2, x2: info.width, y2: info.height }
    ];
    
    // Gold color is roughly R:230, G:180, B:80. Let's just look for pixels where R > 150 && G > 100 && R > B + 50
    const isGold = (r, g, b) => r > 100 && g > 80 && r > b + 20 && r > g * 0.8;
    
    for (const q of quadrants) {
        let minX = q.x2, maxX = q.x1, minY = q.y2, maxY = q.y1;
        
        for (let y = q.y1; y < q.y2; y++) {
            for (let x = q.x1; x < q.x2; x++) {
                const idx = (y * info.width + x) * info.channels;
                const r = data[idx];
                const g = data[idx+1];
                const b = data[idx+2];
                
                if (isGold(r, g, b)) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }
        console.log(`${q.name}: left: ${minX/info.width}, top: ${minY/info.height}, w: ${(maxX-minX)/info.width}, h: ${(maxY-minY)/info.height}`);
        console.log(`Pixels: left: ${minX}, top: ${minY}, w: ${maxX-minX}, h: ${maxY-minY}`);
    }
}
findFrames();
