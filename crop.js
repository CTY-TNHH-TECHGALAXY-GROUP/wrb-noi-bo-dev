const fs = require('fs');
const path = require('path');

async function cropImages() {
    try {
        const sharp = require('sharp');
        const inputImage = path.join(__dirname, 'public', 'assets', 'service-menu-poster.png');
        
        // Poster size is 1023 x 1537
        const width = 1023;
        const height = 1537;
        
        const crops = [
            { name: 'menu-pure.png', left: 0.095, top: 0.275, w: 0.375, h: 0.312 },
            { name: 'menu-journey.png', left: 0.494, top: 0.275, w: 0.375, h: 0.312 },
            { name: 'menu-spa.png', left: 0.095, top: 0.597, w: 0.375, h: 0.312 },
            { name: 'menu-home.png', left: 0.494, top: 0.597, w: 0.375, h: 0.312 },
        ];

        for (const crop of crops) {
            const extractRegion = {
                left: Math.round(width * crop.left),
                top: Math.round(height * crop.top),
                width: Math.round(width * crop.w),
                height: Math.round(height * crop.h)
            };
            
            const outPath = path.join(__dirname, 'public', 'assets', 'logos', crop.name);
            await sharp(inputImage)
                .extract(extractRegion)
                .toFile(outPath);
            console.log(`Cropped ${crop.name} successfully.`);
        }
    } catch (e) {
        console.error('Error cropping images:', e);
    }
}

cropImages();
