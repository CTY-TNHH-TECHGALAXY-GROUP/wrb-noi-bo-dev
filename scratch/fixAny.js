const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/Journey/ServiceList.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace('groups.map((g, i) => {', 'groups.map((g: any, i: number) => {');
content = content.replace('g.items.every(item =>', 'g.items.every((item: any) =>');
content = content.replace('groups.findIndex(gr => !gr.items.every(it =>', 'groups.findIndex((gr: any) => !gr.items.every((it: any) =>');
content = content.replace('g.items.some(item =>', 'g.items.some((item: any) =>');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed implicit anys');
