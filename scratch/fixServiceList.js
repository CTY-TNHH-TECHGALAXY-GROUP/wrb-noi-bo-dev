const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/Journey/ServiceList.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const endMarker = 'export default ServiceList;';
const endIndex = content.indexOf(endMarker);

if (endIndex !== -1) {
    const newContent = content.slice(0, endIndex + endMarker.length) + '\n';
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Fixed file.');
} else {
    console.log('Not found.');
}
