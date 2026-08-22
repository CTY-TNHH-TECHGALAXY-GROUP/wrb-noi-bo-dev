const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function cropV4() {
    try {
        const inputImage = path.join(__dirname, 'public', 'assets', 'service-menu-poster-textless.png');
        const width = 1023;
        const height = 1537;
        
        const crops = [
            { name: 'menu-pure-v4.png', left: 0.095, top: 0.275, w: 0.375, h: 0.312 },
            { name: 'menu-journey-v4.png', left: 0.494, top: 0.275, w: 0.375, h: 0.312 },
            { name: 'menu-spa-v4.png', left: 0.095, top: 0.597, w: 0.375, h: 0.312 },
            { name: 'menu-home-v4.png', left: 0.494, top: 0.597, w: 0.375, h: 0.312 },
        ];

        for (const crop of crops) {
            const extractRegion = {
                left: Math.round(width * crop.left),
                top: Math.round(height * crop.top),
                width: Math.round(width * crop.w),
                height: Math.round(height * crop.h)
            };
            
            const outPath = path.join(__dirname, 'public', 'assets', 'logos', crop.name);
            
            // Extract ONLY, no trim!
            await sharp(inputImage)
                .extract(extractRegion)
                .toFile(outPath);
                
            console.log(`Cropped ${crop.name} successfully.`);
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

cropV4();
