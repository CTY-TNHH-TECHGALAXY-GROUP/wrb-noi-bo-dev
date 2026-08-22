const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function cropAllTextless() {
    try {
        const inputImage = path.join(__dirname, 'public', 'assets', 'service-menu-poster-textless.png');
        const width = 1023;
        const height = 1537;
        
        const crops = [
            { name: 'menu-pure-v3.png', left: 0.095, top: 0.275, w: 0.375, h: 0.312 },
            { name: 'menu-journey-v3.png', left: 0.494, top: 0.275, w: 0.375, h: 0.312 },
            { name: 'menu-home-v3.png', left: 0.494, top: 0.597, w: 0.375, h: 0.312 },
        ];

        for (const crop of crops) {
            const extractRegion = {
                left: Math.round(width * crop.left),
                top: Math.round(height * crop.top),
                width: Math.round(width * crop.w),
                height: Math.round(height * crop.h)
            };
            
            const tempPath = path.join(__dirname, 'public', 'assets', 'logos', 'temp_' + crop.name);
            const outPath = path.join(__dirname, 'public', 'assets', 'logos', crop.name);
            
            // Extract
            await sharp(inputImage)
                .extract(extractRegion)
                .toFile(tempPath);
                
            // Trim
            const info = await sharp(tempPath)
                .trim({ background: '#000000', threshold: 100 })
                .toFile(outPath);
                
            fs.unlinkSync(tempPath);
            console.log(`Cropped and trimmed ${crop.name}: new size ${info.width}x${info.height}`);
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

cropAllTextless();
