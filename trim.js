const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function trimImages() {
    const inputDir = path.join(__dirname, 'public', 'assets', 'logos');
    const backupDir = path.join(inputDir, 'backup_before_trim');
    const files = ['menu-pure.png', 'menu-journey.png', 'menu-spa.png', 'menu-home.png'];
    
    for (const file of files) {
        const inputPath = path.join(inputDir, file);
        const tempPath = path.join(inputDir, 'trim_' + file);
        const backupPath = path.join(backupDir, file);
        
        try {
            const sourcePath = fs.existsSync(backupPath) ? backupPath : inputPath;

            // Dùng threshold cao (100) để ăn đứt mọi phần đen/tối cho đến khi đụng viền vàng sáng
            const info = await sharp(sourcePath)
                .trim({ background: '#000000', threshold: 100 }) 
                .toFile(tempPath);
                
            console.log(`Aggressively trimmed ${file}: new size ${info.width}x${info.height}`);
            
            fs.renameSync(tempPath, inputPath);
        } catch (e) {
            console.error(`Error trimming ${file}:`, e);
        }
    }
}

trimImages();
