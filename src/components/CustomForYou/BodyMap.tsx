import React from 'react';
import { Check, X } from 'lucide-react';
import { BodyPartKey, LanguageCode, MultiLangText, ServiceData } from './types';
import { getText } from './utils';
import { getDictionary } from '@/lib/dictionaries';

// ============================================================================
// 🔧 UI CONFIGURATION — Chỉnh màu sắc tại đây
// ============================================================================
const SVG_CONFIG = {
    viewBox: '0 0 120 270',
    containerBg: '#0d0d0d',          // Nền hộp SVG: Đen trùng nền tổng
    defaultFill: '#1c1c1e',          // Chưa chọn: Đen nhạt
    defaultStroke: '#3f3f46',        // Chưa chọn: Viền xám tối
    focusFill: '#166534',          // Tập trung: fill xanh sẫm
    focusStroke: '#22c55e',          // Tập trung: viền xanh lá
    avoidFill: '#7f1d1d',          // Tránh: fill đỏ sẫm
    avoidStroke: '#ef4444',          // Tránh: viền đỏ tươi
    disabledFill: '#000000',         // Vùng disable: Đen thui
    disabledStroke: '#1c1c1e',       // Viền disable: Đen nhạt
    strokeWidth: 1.8,
    shoulderStrokeWidth: 4,          // Độ mảnh nét vai (chỉnh tại đây)
};

// ============================================================================
// 📐 BODY SVG SHAPES — Tọa độ từng bộ phận (viewBox 120x270)
// ============================================================================
type SvgShape =
    | { type: 'circle'; cx: number; cy: number; r: number }
    | { type: 'ellipse'; cx: number; cy: number; rx: number; ry: number }
    | { type: 'rect'; x: number; y: number; width: number; height: number; rx: number }
    | { type: 'path'; d: string }; // Arc/crescent shapes

const BODY_SVG: Record<BodyPartKey, SvgShape[]> = {
    HEAD: [{ type: 'circle', cx: 60, cy: 20, r: 16 }],
    NECK: [{ type: 'rect', x: 53.5, y: 33.5, width: 14, height: 18, rx: 4 }],
    SHOULDER: [
        { type: 'path', d: 'M 32,55 Q 12,55 14,75' },              // Vai trái
        { type: 'path', d: 'M 88,55 Q 108,55 106,75' },           // Vai phải
    ],
    ARM: [
        { type: 'rect', x: 6, y: 76, width: 18, height: 65, rx: 9 },  // Tay trái
        { type: 'rect', x: 96, y: 76, width: 18, height: 65, rx: 9 },  // Tay phải
    ],
    BACK: [{ type: 'rect', x: 32, y: 52, width: 56, height: 92, rx: 9 }], // Thân
    THIGH: [
        { type: 'rect', x: 33, y: 147, width: 24, height: 55, rx: 12 },   // Đùi trái
        { type: 'rect', x: 63, y: 147, width: 24, height: 55, rx: 12 },   // Đùi phải
    ],
    CALF: [
        { type: 'rect', x: 35, y: 205, width: 20, height: 45, rx: 10 },   // Bắp chân trái
        { type: 'rect', x: 65, y: 205, width: 20, height: 45, rx: 10 },   // Bắp chân phải
    ],
    FOOT: [
        { type: 'ellipse', cx: 43, cy: 258, rx: 14, ry: 8 },              // Bàn chân trái
        { type: 'ellipse', cx: 77, cy: 258, rx: 14, ry: 8 },              // Bàn chân phải
    ],
};

const ALL_BODY_PARTS: { key: BodyPartKey; height: string }[] = [
    { key: 'HEAD', height: '10%' },
    { key: 'NECK', height: '8%' },
    { key: 'SHOULDER', height: '12%' },
    { key: 'ARM', height: '10%' },
    { key: 'BACK', height: '12%' },
    { key: 'THIGH', height: '17%' },
    { key: 'CALF', height: '15%' },
    { key: 'FOOT', height: '10%' },
];

const LAYOUT_CONFIG = {
    checklist: { gap: '4px', paddingRight: '0px', checkboxSize: '22px' }
};

// ============================================================================

interface BodyMapProps {
    focus: string[];
    avoid: string[];
    lang: LanguageCode;
    serviceData: ServiceData;
    onToggle: (type: 'focus' | 'avoid', area: string) => void;
}

// Helper: render từng SVG shape
const renderShape = (
    shape: SvgShape,
    fill: string,
    stroke: string,
    filterId: string | undefined,
    key: string,
    onClick?: () => void
) => {
    const commonProps = {
        fill,
        stroke,
        strokeWidth: SVG_CONFIG.strokeWidth,
        filter: filterId ? `url(#${filterId})` : undefined,
        onClick,
        style: onClick ? { cursor: 'pointer' } : undefined,
    };
    if (shape.type === 'circle')
        return <circle key={key} {...commonProps} cx={shape.cx} cy={shape.cy} r={shape.r} />;
    if (shape.type === 'ellipse')
        return <ellipse key={key} {...commonProps} cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} />;
    if (shape.type === 'path')
        return <path key={key} fill="none" stroke={stroke} strokeWidth={SVG_CONFIG.shoulderStrokeWidth} strokeLinecap="round" strokeLinejoin="round" filter={filterId ? `url(#${filterId})` : undefined} onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined} d={shape.d} />;
    return <rect key={key} {...commonProps} x={shape.x} y={shape.y} width={shape.width} height={shape.height} rx={shape.rx} />;
};

const BodyMap: React.FC<BodyMapProps> = ({ focus, avoid, lang, serviceData, onToggle }) => {
    const dict = getDictionary(lang);

    const availableParts = ALL_BODY_PARTS.filter(part => {
        if (!serviceData.FOCUS_POSITION) return true;
        return serviceData.FOCUS_POSITION[part.key] === true;
    });

    const isFullBody = availableParts.length > 0 && focus.length === availableParts.length;

    const handleFullBodyToggle = () => {
        if (isFullBody) onToggle('focus', 'CLEAR_ALL');
        else onToggle('focus', 'FULL_BODY');
    };

    if (availableParts.length === 0) return null;

    return (
        <div className="flex gap-2 h-[460px] sm:h-[550px]">

            {/* CỘT TRÁI: Nút Toàn Thân */}
            <div className="w-[15%] flex flex-col items-center justify-center pr-2">
                {availableParts.length > 1 && (
                    <label className="flex flex-col items-center justify-center cursor-pointer bg-[#1c1c1e] p-2 rounded-xl border border-white/5 transition-all hover:border-[#C9A96E] active:scale-95 shadow-sm py-4 w-full h-[100px] sm:h-[120px]">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-2 sm:mb-3 transition-colors border-2 ${isFullBody ? 'bg-[#C9A96E] border-[#C9A96E]' : 'bg-[#0d0d0d] border-white/10'}`}>
                            <Check className={`w-5 h-5 sm:w-6 sm:h-6 text-black transition-opacity ${isFullBody ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
                            <input type="checkbox" className="hidden" checked={isFullBody} onChange={handleFullBodyToggle} />
                        </div>
                        <span className={`text-[10px] sm:text-xs font-bold uppercase leading-snug text-center tracking-tight ${isFullBody ? 'text-[#C9A96E]' : 'text-gray-400'}`}>
                            {getText({ en: 'Whole\nBody', vi: 'Toàn\nThân', jp: '全身', kr: '전신', cn: '全身' }, lang)}
                        </span>
                    </label>
                )}
            </div>

            {/* CỘT GIỮA: SVG Body Figure */}
            <div
                className="w-[40%] h-[340px] sm:h-[450px] relative flex items-center justify-center pl-2 rounded-xl overflow-hidden self-center"
                style={{ backgroundColor: SVG_CONFIG.containerBg, border: '1px solid rgba(255,255,255,0.05)' }}
            >
                <svg
                    viewBox={SVG_CONFIG.viewBox}
                    className="w-full h-full"
                    style={{ maxHeight: '100%' }}
                >
                    {/* Glow Filters */}
                    <defs>
                        <filter id="glow-green" x="-40%" y="-40%" width="180%" height="180%">
                            <feGaussianBlur stdDeviation="3.5" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <filter id="glow-red" x="-40%" y="-40%" width="180%" height="180%">
                            <feGaussianBlur stdDeviation="3.5" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Render từng bộ phận */}
                    {ALL_BODY_PARTS.map(part => {
                        const isAvailable = availableParts.find(p => p.key === part.key);
                        const isFocus = focus.includes(part.key);
                        const isAvoid = avoid.includes(part.key);

                        let fill = isAvailable ? SVG_CONFIG.defaultFill : SVG_CONFIG.disabledFill;
                        let stroke = isAvailable ? SVG_CONFIG.defaultStroke : SVG_CONFIG.disabledStroke;
                        let filterId: string | undefined;

                        if (isAvailable) {
                            if (isFocus) { fill = SVG_CONFIG.focusFill; stroke = SVG_CONFIG.focusStroke; filterId = 'glow-green'; }
                            else if (isAvoid) { fill = SVG_CONFIG.avoidFill; stroke = SVG_CONFIG.avoidStroke; filterId = 'glow-red'; }
                        }

                        const shapes = BODY_SVG[part.key];
                        const handleClick = isAvailable
                            ? () => onToggle('focus', part.key)
                            : undefined;

                        return shapes.map((shape, i) =>
                            renderShape(shape, fill, stroke, filterId, `${part.key}-${i}`, handleClick)
                        );
                    })}
                </svg>
            </div>

            {/* CỘT PHẢI: Bảng Checklist */}
            <div className="w-[45%] flex flex-col h-[380px] sm:h-[480px] pl-2 self-center">
                <div
                    className="flex flex-row items-center text-[9px] sm:text-xs font-bold uppercase tracking-tight pb-2 border-b border-white/10 flex-none mb-2 sm:mb-4 pt-0"
                    style={{ marginRight: LAYOUT_CONFIG.checklist.paddingRight }}
                >
                    <span className="text-[#C9A96E]/80 flex-1">{getText({ en: 'Area', vi: 'Vị trí', jp: '部位', kr: '부위', cn: '区域' }, lang)}</span>
                    <div className="flex justify-end gap-1 w-[60px] sm:w-[80px]">
                        <span className="text-green-500 w-7 sm:w-10 text-center">{getText({ en: 'Focus', vi: 'Tập\ntrung', jp: '集中', kr: '집중', cn: '重点' }, lang)}</span>
                        <span className="text-red-500 w-7 sm:w-10 text-center">{getText({ en: 'Avoid', vi: 'Tránh', jp: '避ける', kr: '피하다', cn: '避开' }, lang)}</span>
                    </div>
                </div>

                <div className="flex flex-col flex-1 justify-between overflow-y-auto custom-scrollbar" style={{ marginRight: LAYOUT_CONFIG.checklist.paddingRight }}>
                    {ALL_BODY_PARTS.map((part) => {
                        const isAvailable = availableParts.find(p => p.key === part.key);
                        const isFocus = focus.includes(part.key);
                        const isAvoid = avoid.includes(part.key);

                        return (
                            <div
                                key={part.key}
                                className={`w-full flex items-center px-1 border-b border-transparent py-[6px] sm:py-2 ${isAvailable
                                    ? 'hover:bg-white/5 rounded transition-colors justify-between'
                                    : 'pointer-events-none opacity-20 grayscale'
                                    }`}
                            >
                                {isAvailable ? (
                                    <>
                                        <span className={`text-[12px] sm:text-base flex-1 truncate font-semibold ${isFocus ? 'text-green-400' : isAvoid ? 'text-red-400' : 'text-gray-300'}`}>
                                            {getText({
                                                HEAD: { en: 'Head', vi: 'Đầu', jp: '頭', kr: '머리', cn: '头' },
                                                NECK: { en: 'Neck', vi: 'Cổ', jp: '首', kr: '목', cn: '颈部' },
                                                SHOULDER: { en: 'Shoulder', vi: 'Vai', jp: '肩', kr: '어깨', cn: '肩部' },
                                                ARM: { en: 'Arm', vi: 'Tay', jp: '腕', kr: '팔', cn: '手臂' },
                                                BACK: { en: 'Back', vi: 'Lưng', jp: '背中', kr: '등', cn: '背部' },
                                                THIGH: { en: 'Thigh', vi: 'Đùi', jp: '太もも', kr: '허벅지', cn: '大腿' },
                                                CALF: { en: 'Calf', vi: 'Bắp chân', jp: 'ふくらはぎ', kr: '종아리', cn: '小腿' },
                                                FOOT: { en: 'Foot', vi: 'Bàn chân', jp: '足', kr: '발', cn: '脚' },
                                            }[part.key] as MultiLangText, lang)}
                                        </span>

                                        <div className="flex items-center justify-end gap-1 w-[60px] sm:w-[80px]">
                                            {/* Focus Checkbox (Xanh) — icon ✓ */}
                                            <label className="relative flex items-center justify-center cursor-pointer w-7 sm:w-10">
                                                <input
                                                    type="checkbox"
                                                    checked={isFocus}
                                                    onChange={(e) => { e.stopPropagation(); onToggle('focus', part.key); }}
                                                    className="peer appearance-none border border-white/20 rounded bg-[#1c1c1e] checked:bg-green-600 checked:border-green-500 transition-all w-[22px] h-[22px] sm:w-[28px] sm:h-[28px]"
                                                />
                                                <Check className="absolute w-4 h-4 sm:w-5 sm:h-5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" strokeWidth={3} />
                                            </label>

                                            {/* Avoid Checkbox (Đỏ) — icon ✗ */}
                                            <label className="relative flex items-center justify-center cursor-pointer w-7 sm:w-10">
                                                <input
                                                    type="checkbox"
                                                    checked={isAvoid}
                                                    onChange={(e) => { e.stopPropagation(); onToggle('avoid', part.key); }}
                                                    className="peer appearance-none border border-white/20 rounded bg-[#1c1c1e] checked:bg-red-600 checked:border-red-500 transition-all w-[22px] h-[22px] sm:w-[28px] sm:h-[28px]"
                                                />
                                                <X className="absolute w-4 h-4 sm:w-5 sm:h-5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" strokeWidth={3} />
                                            </label>
                                        </div>
                                    </>
                                ) : (
                                    <span className="text-[11px] sm:text-sm text-[#3f3f46] italic flex-1 py-1">
                                        {getText({
                                            HEAD: { en: 'Head', vi: 'Đầu', jp: '頭', kr: '머리', cn: '头' },
                                            NECK: { en: 'Neck', vi: 'Cổ', jp: '首', kr: '목', cn: '颈部' },
                                            SHOULDER: { en: 'Shoulder', vi: 'Vai', jp: '肩', kr: '어깨', cn: '肩部' },
                                            ARM: { en: 'Arm', vi: 'Tay', jp: '腕', kr: '팔', cn: '手臂' },
                                            BACK: { en: 'Back', vi: 'Lưng', jp: '背中', kr: '등', cn: '背部' },
                                            THIGH: { en: 'Thigh', vi: 'Đùi', jp: '太もも', kr: '허벅지', cn: '大腿' },
                                            CALF: { en: 'Calf', vi: 'Bắp chân', jp: 'ふくらはぎ', kr: '종아리', cn: '小腿' },
                                            FOOT: { en: 'Foot', vi: 'Bàn chân', jp: '足', kr: '발', cn: '脚' },
                                        }[part.key] as MultiLangText, lang)}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
};

export default BodyMap;
