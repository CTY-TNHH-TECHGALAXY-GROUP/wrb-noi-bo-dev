const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/Journey/ServiceList.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const view3Idx = content.indexOf('// VIEW 3: Combined Rating');
const mainIdx = content.indexOf('// MAIN COMPONENT');

if (view3Idx === -1 || mainIdx === -1) {
    console.error("VIEW 3 or MAIN COMPONENT not found!");
    process.exit(1);
}

const startIndex = content.lastIndexOf('// ----', view3Idx);
const endIndex = content.lastIndexOf('// ----', mainIdx);

const newComponent = `// -------------------------------------------------------------------------------
// VIEW 3: Combined Rating — T?t c? NV g?p 1 trang
// -------------------------------------------------------------------------------
const CombinedRatingView = ({
    items, lang = 'vi', bookingId, onItemRated, onAllRated,
}: {
    items: ServiceItem[]; lang?: string; bookingId: string;
    onItemRated: (itemId: string, rating: number, feedback: string) => Promise<void>;
    onAllRated?: () => void;
}) => {
    const [submitted, setSubmitted] = useState<Set<string>>(new Set());
    const [commonRating, setCommonRating] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [showTipFor, setShowTipFor] = useState<boolean>(false);
    const [savedViolations, setSavedViolations] = useState<number[]>([]);
    const [alertState, setAlertState] = useState<{ isOpen: boolean; message: string; type?: 'error' | 'success' | 'info' }>({ isOpen: false, message: '' });
    const t = translations[lang || 'vi'] || translations['en'];

    const getMaxRating = (violationCount: number): number => {
        if (violationCount >= 3) return 1;
        if (violationCount >= 2) return 2;
        if (violationCount >= 1) return 3;
        return 4;
    };
    const maxAllowedRating = getMaxRating(savedViolations.length);

    const storageKey = \`spa_wrb_violations_\${bookingId || 'default'}\`;
    const violations = useRemindersCustomer(lang || 'vi');

    useEffect(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    const allViolations = new Set<number>();
                    Object.values(parsed).forEach((arr: any) => {
                        if (Array.isArray(arr)) arr.forEach((n: number) => allViolations.add(n));
                    });
                    setSavedViolations(Array.from(allViolations));
                } else if (Array.isArray(parsed)) {
                    setSavedViolations(parsed);
                }
            }
        } catch { /* silent */ }
    }, [storageKey]);

    const isAllRated = items.length > 0 && items.every(i => (i.itemRating !== null && i.itemRating !== undefined) || submitted.has(i.id));

    useEffect(() => {
        if (isAllRated) {
            try { localStorage.removeItem(storageKey); } catch { /* silent */ }
            onAllRated?.();
        }
    }, [isAllRated, storageKey, onAllRated]);

    const handleAutoSubmitAll = async (rating: number) => {
        if (submitting) return;

        setCommonRating(rating);

        if (rating === 4) {
            setShowTipFor(true);
            return;
        }

        setSubmitting(true);
        try {
            const newSubmitted = new Set(submitted);
            for (const item of items) {
                if ((item.itemRating === null || item.itemRating === undefined) && !newSubmitted.has(item.id)) {
                    await onItemRated(item.id, rating, '');
                    newSubmitted.add(item.id);
                }
            }
            setSubmitted(newSubmitted);
        } catch (err: any) {
            console.error('Rating submit error:', err);
            setAlertState({
                isOpen: true,
                message: lang === 'vi' ? 'G?i dánh giá th?t b?i. Vui lòng th? l?i.' : 'Failed to submit rating. Please try again.',
                type: 'error'
            });
            setCommonRating(null);
        }
        finally { setSubmitting(false); }
    };

    const handleTipClose = async (tipAmount: number) => {
        setShowTipFor(false);
        setSubmitting(true);
        try {
            const newSubmitted = new Set(submitted);
            let first = true;
            for (const item of items) {
                if ((item.itemRating === null || item.itemRating === undefined) && !newSubmitted.has(item.id)) {
                    await onItemRated(item.id, 4, first ? \`tip:\${tipAmount}\` : '');
                    newSubmitted.add(item.id);
                    first = false;
                }
            }
            setSubmitted(newSubmitted);
        } catch (err: any) {
            console.error('Rating submit error:', err);
            setAlertState({
                isOpen: true,
                message: lang === 'vi' ? 'G?i dánh giá th?t b?i. Vui lòng th? l?i.' : 'Failed to submit rating. Please try again.',
                type: 'error'
            });
            setCommonRating(null);
        }
        finally { setSubmitting(false); }
    };

    const ratedOpt = RATING_OPTIONS.find(r => r.value === commonRating || items.some(i => i.itemRating === r.value));

    return (
        <div className="flex flex-col w-full py-4 animate-in fade-in slide-in-from-bottom-5 duration-500">
            {/* Header */}
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#1c1c1e] rounded-full flex items-center justify-center text-3xl mx-auto mb-3 border border-[#C9A96E]/30 shadow-[0_0_15px_rgba(201,169,110,0.2)]">
                    ?
                </div>
                <h2 className="text-2xl font-black text-[#C9A96E]">
                    {t.rateTitle}
                </h2>
                <p className="text-gray-400 text-base mt-2">
                    {t.rateSub}
                </p>
            </div>

            {/* Violations Checklist */}
            <div className="bg-[#1c1c1e] border border-white/5 rounded-2xl p-4 mb-5 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[#C9A96E]/10 border border-[#C9A96E]/20 text-[#C9A96E] flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    </div>
                    <h3 className="text-base font-black text-[#C9A96E]">
                        {t.violationsSectionTitle}
                    </h3>
                </div>
                <div className="space-y-2">
                    {violations.map((v, idx) => {
                        const isChecked = savedViolations.includes(idx);
                        return (
                            <div key={idx}
                                onClick={() => {
                                    const updated = isChecked
                                        ? savedViolations.filter(i => i !== idx)
                                        : [...savedViolations, idx];
                                    setSavedViolations(updated);
                                    try { localStorage.setItem(storageKey, JSON.stringify(updated)); } catch { /* silent */ }

                                    const newMax = getMaxRating(updated.length);
                                    if (commonRating && commonRating > newMax) {
                                        setCommonRating(null);
                                    }
                                }}
                                className={\`flex items-start gap-3 p-3 bg-[#0d0d0d] rounded-2xl cursor-pointer border transition-all \${
                                    isChecked ? 'border-[#C9A96E] shadow-[#C9A96E]/10 shadow-sm ring-1 ring-[#C9A96E]/20' : 'border-white/5'
                                }\`}>
                                <div className={\`mt-0.5 w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-colors \${
                                    isChecked ? 'border-[#C9A96E] bg-[#C9A96E]' : 'border-gray-600 bg-transparent'
                                }\`}>
                                    {isChecked && <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                </div>
                                <span className={\`text-base leading-snug font-medium flex-1 \${isChecked ? 'text-[#C9A96E]' : 'text-gray-400'}\`}>{v}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Single Order Card */}
            <div className="space-y-3">
                <div className={\`bg-[#1c1c1e] rounded-3xl border-2 transition-all overflow-hidden \${
                    isAllRated ? 'border-white/5 opacity-80' : 'border-[#C9A96E] shadow-[#C9A96E]/20 shadow-lg'
                }\`}>
                    {/* Accordion Header */}
                    <div className="w-full text-left p-4 flex items-center gap-3">
                        <div className={\`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 \${
                            isAllRated ? 'bg-[#0d0d0d] border border-white/5' : 'bg-[#0d0d0d] border border-[#C9A96E]/30 text-[#C9A96E]'
                        }\`}>
                            {isAllRated ? '?' : '??'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={\`font-black text-base leading-tight truncate \${isAllRated ? 'text-gray-400' : 'text-white/90'}\`}>
                                Toàn b? li?u trình
                            </p>
                            <p className="text-gray-500 text-sm font-medium truncate mt-1">
                                {items.length} {t.services}
                            </p>
                        </div>
                        {isAllRated && (
                            <div className="flex items-center gap-1.5 bg-[#C9A96E]/20 text-[#C9A96E] px-3 py-1.5 rounded-full border border-[#C9A96E]/30">
                                <span className="text-xl leading-none">{ratedOpt?.emoji || '?'}</span>
                                <span className="text-xs font-black">{t.ratedSent}</span>
                            </div>
                        )}
                    </div>

                    {/* Expanded Rating Area */}
                    {!isAllRated && (
                        <div className="px-4 pb-4 border-t border-white/5 pt-3 animate-in fade-in slide-in-from-top-2 duration-300 bg-[#0d0d0d]/50">
                            <div className="mb-4">
                                <div className="flex items-center justify-center relative mb-4">
                                    <p className="text-base font-bold text-[#C9A96E]">
                                        {t.yourExperience}
                                    </p>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                {RATING_OPTIONS.map((opt) => {
                                    const isDisabled = opt.value > maxAllowedRating;
                                    const isSel = commonRating === opt.value;
                                    let bgClass = "bg-[#1c1c1e] border-white/5 hover:border-white/10";
                                    if (isSel) {
                                        if (opt.value === 4) bgClass = "bg-green-900/40 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)]";
                                        else if (opt.value === 3) bgClass = "bg-blue-900/40 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]";
                                        else if (opt.value === 2) bgClass = "bg-[#C9A96E]/20 border-[#C9A96E] shadow-[0_0_10px_rgba(201,169,110,0.2)]";
                                        else bgClass = "bg-red-900/40 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]";
                                    }

                                    return (
                                        <button key={opt.value}
                                            disabled={isDisabled || submitting}
                                            onClick={() => {
                                                if (isDisabled || submitting) return;
                                                handleAutoSubmitAll(opt.value);
                                            }}
                                            className={\`flex flex-col items-center p-2.5 rounded-2xl border-2 transition-all \${
                                                isDisabled || submitting
                                                    ? 'opacity-40 grayscale cursor-not-allowed bg-[#0d0d0d] border-transparent'
                                                    : \`active:scale-95 \${bgClass}\`
                                            }\`}>
                                            <span className="text-3xl mb-1">{opt.emoji}</span>
                                            <span className={\`text-xs font-bold leading-tight text-center \${isSel ? 'text-white' : 'text-gray-500'}\`}>
                                                {getRatingLabel(lang || 'vi', opt.value)}
                                            </span>
                                        </button>
                                    );
                                })}
                                </div>
                            </div>
                            
                            {/* Submitting indicator */}
                            {submitting && (
                                <div className="w-full py-3 mt-2 flex items-center justify-center gap-2 text-[#C9A96E]">
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                                    <span className="text-base font-bold">{t.submitting}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Skip Button */}
            {!isAllRated && (
                <button
                    onClick={async () => {
                        setSubmitting(true);
                        try {
                            const newSubmitted = new Set(submitted);
                            for (const item of items) {
                                if ((item.itemRating === null || item.itemRating === undefined) && !newSubmitted.has(item.id)) {
                                    await onItemRated(item.id, 0, 'skipped');
                                    newSubmitted.add(item.id);
                                }
                            }
                            setSubmitted(newSubmitted);
                        } catch { /* noop */ }
                        finally { setSubmitting(false); }
                    }}
                    disabled={submitting}
                    className="w-full py-3 mt-4 rounded-2xl font-bold text-sm text-gray-400 bg-[#1c1c1e] border border-white/5 hover:border-white/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    {submitting ? (
                        <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>{t.processing}</>
                    ) : (
                        <>{t.skipRating}</>
                    )}
                </button>
            )}

            {/* All-done message */}
            {isAllRated && (
                <div className="mt-6 text-center animate-in fade-in zoom-in-95">
                    <p className="text-green-600 font-black text-lg">{t.thankYou}</p>
                    <p className="text-gray-400 text-sm mt-1">{t.allDoneRedirecting}</p>
                </div>
            )}

            {/* TipModal */}
            {showTipFor && <TipModal onClose={handleTipClose} lang={lang} />}

            {/* Alert Modal Overlay */}
            <AlertModal
                isOpen={alertState.isOpen}
                message={alertState.message}
                type={alertState.type}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                lang={lang}
            />
        </div>
    );
};

`;

const newContent = content.slice(0, startIndex) + newComponent + content.slice(endIndex);
fs.writeFileSync(filePath, newContent, 'utf8');
console.log("Replacement completed successfully.");
