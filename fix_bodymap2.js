const fs = require('fs');
let c = fs.readFileSync('src/components/CustomForYou/BodyMap.tsx', 'utf8');

const correctBlock = `HEAD: { en: 'Head', vi: 'Đầu', jp: '頭', kr: '머리', cn: '头' },
                                                NECK: { en: 'Neck', vi: 'Cổ', jp: '首', kr: '목', cn: '颈部' },
                                                SHOULDER: { en: 'Shoulder', vi: 'Vai', jp: '肩', kr: '어깨', cn: '肩部' },
                                                ARM: { en: 'Arm', vi: 'Tay', jp: '腕', kr: '팔', cn: '手臂' },
                                                BACK: { en: 'Back', vi: 'Lưng', jp: '背中', kr: '등', cn: '背部' },
                                                THIGH: { en: 'Thigh', vi: 'Đùi', jp: '太もも', kr: '허벅지', cn: '大腿' },
                                                KNEE: { en: 'Knee', vi: 'Gối', jp: '膝', kr: '무릎', cn: '膝盖' },
                                                CALF: { en: 'Calf', vi: 'Bắp chân', jp: 'ふくらはぎ', kr: '종아리', cn: '小腿' },
                                                FOOT: { en: 'Foot', vi: 'Bàn chân', jp: '足', kr: '발', cn: '脚' },`;

// Remove the old blocks and insert the correct one
c = c.replace(/HEAD: \{[\s\S]*?FOOT: \{[^\}]+\},/g, correctBlock);

fs.writeFileSync('src/components/CustomForYou/BodyMap.tsx', c, 'utf8');
console.log('Fixed block translation!');
