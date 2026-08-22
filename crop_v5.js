const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function cropV5() {
    try {
        const inputImage = path.join(__dirname, 'public', 'assets', 'service-menu-poster-textless.png');
        const width = 1023;
        const height = 1537;
        
        // Using EXACT coordinates from user's HTML hotspots:
        // .pure { left: 8.5%; top: 22.4%; width: 38.2%; height: 35.2%; }
        // .journey { left: 49.8%; top: 22.4%; width: 38.2%; height: 35.2%; }
        // .spa { left: 8.5%; top: 59.2%; width: 38.2%; height: 35.2%; }
        // .home { left: 49.8%; top: 59.2%; width: 38.2%; height: 35.2%; }
        
        const crops = [
            { name: 'menu-pure-v5.png', left: 0.085, top: 0.224, w: 0.382, h: 0.352 },
            { name: 'menu-journey-v5.png', left: 0.498, top: 0.224, w: 0.382, h: 0.352 },
            { name: 'menu-spa-v5.png', left: 0.085, top: 0.592, w: 0.382, h: 0.352 },
            { name: 'menu-home-v5.png', left: 0.498, top: 0.592, w: 0.382, h: 0.352 },
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
        console.error('Error:', e);
    }
}

cropV5();
