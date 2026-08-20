const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function findTextBounds(name) {
    const origPath = path.join(__dirname, 'public', 'assets', 'logos', `menu-${name}.png`);
    const v4Path = path.join(__dirname, 'public', 'assets', 'logos', `menu-${name}-v4.png`);
    
    // We might have deleted menu-spa.png? No, I renamed it to menu-spa-v2.png.
    const actualOrig = name === 'spa' ? path.join(__dirname, 'public', 'assets', 'logos', 'menu-spa-v2.png') : origPath;
    
    const { data: d1, info } = await sharp(actualOrig).raw().toBuffer({ resolveWithObject: true });
    const { data: d2 } = await sharp(v4Path).raw().toBuffer({ resolveWithObject: true });
    
    let minY = info.height, maxY = 0;
    
    // Find differences
    const diffs = new Float32Array(info.height);
    for (let y = 0; y < info.height; y++) {
        let rowDiff = 0;
        for (let x = 0; x < info.width; x++) {
            const idx = (y * info.width + x) * info.channels;
            // Ignore alpha channel if present
            const diffR = Math.abs(d1[idx] - d2[idx]);
            const diffG = Math.abs(d1[idx+1] - d2[idx+1]);
            const diffB = Math.abs(d1[idx+2] - d2[idx+2]);
            if (diffR + diffG + diffB > 40) {
                rowDiff += diffR + diffG + diffB;
            }
        }
        diffs[y] = rowDiff;
    }
    
    // Find bounding box based on a threshold
    const maxDiff = Math.max(...diffs);
    const threshold = maxDiff * 0.1;
    
    for (let y = 0; y < info.height; y++) {
        if (diffs[y] > threshold) {
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
    }
    
    const centerPercent = (((minY + maxY) / 2) / info.height) * 100;
    console.log(`${name}: centerPercent = ${centerPercent.toFixed(1)}% (minY=${minY}, maxY=${maxY}, height=${info.height})`);
}

async function run() {
    await findTextBounds('pure');
    await findTextBounds('journey');
    await findTextBounds('spa');
    await findTextBounds('home');
}
run();
