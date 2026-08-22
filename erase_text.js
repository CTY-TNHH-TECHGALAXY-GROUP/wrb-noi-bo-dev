const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function eraseText() {
    const imgPath = path.join(__dirname, 'public', 'assets', 'logos', 'menu-spa.png');
    const tempPath = path.join(__dirname, 'public', 'assets', 'logos', 'menu-spa-temp.png');

    // Lấy kích thước thật của ảnh hiện tại
    const metadata = await sharp(imgPath).metadata();
    const w = metadata.width;
    const h = metadata.height;

    // Y center là khoảng 45% chiều cao
    const yCenter = Math.round(h * 0.45);
    const rectHeight = 80;
    const rectY = yCenter - rectHeight / 2;

    // SVG vẽ một hình chữ nhật bo tròn màu đỏ sẫm có hiệu ứng mờ viền (blur) cực mạnh
    // để vá đè lên chữ THERAPIST mà vẫn hòa trộn đẹp vào nền đỏ của bức ảnh
    const svgOverlay = `
        <svg width="${w}" height="${h}">
            <defs>
                <filter id="blurFilter" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="25" />
                </filter>
            </defs>
            <rect x="-10" y="${rectY}" width="${w + 20}" height="${rectHeight}" fill="#2e0504" filter="url(#blurFilter)" />
        </svg>
    `;

    try {
        await sharp(imgPath)
            .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
            .toFile(tempPath);
            
        // Ghi đè file gốc
        fs.copyFileSync(tempPath, imgPath);
        fs.unlinkSync(tempPath);
        console.log(`Erased text on ${imgPath} at Y=${rectY}`);
    } catch (e) {
        console.error(e);
    }
}

eraseText();
