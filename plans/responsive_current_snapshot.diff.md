# Diff snapshot — responsive và thay đổi đồng thời

Mốc cũ: `4376795`. Mốc hiện tại lúc lập tài liệu: `6bf8a4c`.

**Đây là diff đã nằm trong commit, KHÔNG phải patch để áp lại lên HEAD.** Working tree sạch tại thời điểm chụp. Tôi không tạo commit này. Commit còn chứa thay đổi Mix/carousel/test của luồng làm việc đồng thời; giữ nguyên chúng, không coi chúng là yêu cầu responsive mới.

Đọc cùng [plan toàn website](./plan_responsive_toan_website.md). Diff là snapshot chính xác từ Git, không phải diff giả định. Những sửa đổi tiếp theo được mô tả riêng ở phần “Diff đề xuất” trong plan và phải kiểm tra lại với HEAD trước khi áp dụng.

Số file trong snapshot: 55.

```diff
diff --git a/.gitignore b/.gitignore
index 1842672..1d53f92 100644
--- a/.gitignore
+++ b/.gitignore
@@ -15,6 +15,7 @@
 
 # next.js
 /.next/
+/.next-responsive/
 /out/
 
 # production

diff --git a/next.config.mjs b/next.config.mjs
index da5f993..83dfd09 100644
--- a/next.config.mjs
+++ b/next.config.mjs
@@ -1,4 +1,5 @@
 const nextConfig = {
+  distDir: process.env.NEXT_DIST_DIR || '.next',
   eslint: {
     ignoreDuringBuilds: true,
   },

diff --git a/scripts/test-carousel-logic.ts b/scripts/test-carousel-logic.ts
index 2f8fcc0..58210bf 100644
--- a/scripts/test-carousel-logic.ts
+++ b/scripts/test-carousel-logic.ts
@@ -403,4 +403,44 @@ it('resolveInitialActiveGalleryItem skips legacy lead images and picks the first
   }
 });
 
+// Case 21: Mix vs single therapy card mutual exclusion
+it('When Mix is active, single therapy cards are unselected and only Mix card is selected', () => {
+  const selectedMixTechniqueIds: ('coconutOil' | 'thaiTherapy')[] = ['coconutOil', 'thaiTherapy'];
+
+  // Single card isSelected logic from BookingConfig
+  const isCoconutSelected =
+    selectedMixTechniqueIds.length === 1 && selectedMixTechniqueIds[0] === 'coconutOil';
+  const isThaiSelected =
+    selectedMixTechniqueIds.length === 1 && selectedMixTechniqueIds[0] === 'thaiTherapy';
+  const isMixSelected = selectedMixTechniqueIds.length >= 2;
+
+  assert.equal(isCoconutSelected, false);
+  assert.equal(isThaiSelected, false);
+  assert.equal(isMixSelected, true);
+
+  // Switch to single therapy
+  const singleIds: ['thaiTherapy'] = ['thaiTherapy'];
+  const isSingleThaiSelected = singleIds.length === 1 && singleIds[0] === 'thaiTherapy';
+  const isSingleMixSelected = singleIds.length >= 2;
+
+  assert.equal(isSingleThaiSelected, true);
+  assert.equal(isSingleMixSelected, false);
+});
+
+// Case 22: Applying Mix immediately confirms selection to booking config step
+it('Applying Mix immediately resolves staff and validates readiness for direct transition to booking config', () => {
+  const applied = evaluateMixApply({
+    mixStaff: mockStaff1,
+    chosenTechniqueIds: ['coconutOil', 'thaiTherapy'],
+    selectedIds: ['KTV01'],
+    staffList: [mockStaff1],
+  });
+
+  const resolvedStaff = resolveSelectedStaff(applied.nextSelectedIds, [mockStaff1]);
+  assert.notEqual(resolvedStaff, null);
+  assert.equal(resolvedStaff?.length, 1);
+  assert.equal(resolvedStaff?.[0].id, 'KTV01');
+  assert.deepEqual(applied.nextTechniqueIds, ['coconutOil', 'thaiTherapy']);
+});
+
 console.log(`\n🎉 ALL ${passedCount} CAROUSEL LOGIC TEST CASES PASSED!\n`);

diff --git a/src/app/[lang]/auth/page.tsx b/src/app/[lang]/auth/page.tsx
index e809f14..a48d04d 100644
--- a/src/app/[lang]/auth/page.tsx
+++ b/src/app/[lang]/auth/page.tsx
@@ -80,12 +80,12 @@ export default function AuthPage() {
 
 
     return (
-        <div className="w-full h-[100dvh] flex flex-col items-center bg-[#FAF9F6] relative overflow-hidden font-sans pb-[env(safe-area-inset-bottom)]">
+        <div className="w-full min-h-[100dvh] flex flex-col items-center bg-[#FAF9F6] relative font-sans pb-[env(safe-area-inset-bottom)]">
 
             {/* Background soft glow / texture (optional) */}
             <div className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-multiply bg-gradient-to-b from-[#FDFCF8] to-[#F1EDE4]" />
 
-            <div className="z-10 w-full max-w-md md:max-w-lg flex flex-col px-6 md:px-10 h-full text-center">
+            <div className="z-10 w-full max-w-md md:max-w-lg flex flex-col px-6 md:px-10 min-h-[100dvh] text-center">
 
                 {/* HEADER */}
                 <div

diff --git a/src/app/[lang]/contacted-first/page.module.css b/src/app/[lang]/contacted-first/page.module.css
index e2b60d8..42d1b0b 100644
--- a/src/app/[lang]/contacted-first/page.module.css
+++ b/src/app/[lang]/contacted-first/page.module.css
@@ -464,11 +464,14 @@
 }
 
 .modalContent {
+  max-height: calc(100dvh - 1rem);
+  overflow-y: auto;
+  overscroll-behavior: contain;
   background: linear-gradient(180deg, #18130d 0%, #050403 100%);
   border-top: 1px solid rgba(222,180,79,.3);
   border-radius: 28px 28px 0 0;
   width: 100%;
-  max-width: 100%;
+  max-width: 800px;
   box-shadow: 0 -10px 40px rgba(0,0,0,0.5);
   display: flex;
   flex-direction: column;
@@ -503,6 +506,7 @@
 }
 
 .inputGroup {
+  min-width: 0;
   display: flex;
   flex-direction: column;
   gap: 6px;
@@ -536,6 +540,7 @@
 }
 
 .modalFooter {
+  flex-wrap: wrap;
   padding: 20px 30px;
   border-top: 1px solid rgba(222,180,79,.1);
   display: flex;
@@ -587,6 +592,8 @@
   }
 }
 @media (min-width: 768px) {
+  .modalOverlay { align-items: center; padding: 1rem; }
+  .modalContent { border-radius: 28px; }
   .modalBody {
     flex-direction: row;
     flex-wrap: wrap;
@@ -599,3 +606,10 @@
     width: 100%;
   }
 }
+
+@media (max-width: 430px) {
+  .meta { grid-column: 1 / -1; grid-template-columns: 1fr; }
+  .name, .phone, .metaRow { overflow-wrap: anywhere; }
+  .modalHeader, .modalBody, .modalFooter { padding: 16px; }
+  .nextCard { width: 100%; padding: 24px 16px; }
+}

diff --git a/src/app/globals.css b/src/app/globals.css
index 9cc00a9..ca8e16d 100644
--- a/src/app/globals.css
+++ b/src/app/globals.css
@@ -6,6 +6,54 @@
 
 @import "tailwindcss";
 
+@theme {
+  --breakpoint-xs: 25rem;
+}
+
+/* Intrinsic content must not force flex/grid columns outside their viewport.
+   Explicit min-width utilities still win (e.g. horizontal date carousels). */
+@layer base {
+  :where(.flex, .grid) > * { min-width: 0; }
+  :where(.flex-1, .grow):where(.overflow-y-auto, .overflow-hidden) { min-height: 0; }
+  :where(input, select, textarea) { max-width: 100%; }
+  :where(h1, h2, h3, h4, p, label, button) { overflow-wrap: anywhere; }
+  :where(video, canvas, iframe) { max-width: 100%; }
+}
+
+/* Opt-in shared surfaces: scroll the whole panel on short screens so that
+   a tall header/footer never makes the body or confirmation button unreachable. */
+.responsive-panel {
+  max-height: calc(100dvh - 2rem);
+  overflow-y: auto;
+  overscroll-behavior: contain;
+}
+.responsive-sheet {
+  max-height: calc(100dvh - 1rem);
+  overflow-y: auto;
+  overscroll-behavior: contain;
+}
+@media (min-width: 768px) {
+  .responsive-sheet {
+    left: max(1rem, calc((100% - 48rem) / 2));
+    width: min(48rem, calc(100% - 2rem));
+  }
+}
+@media (max-height: 500px) {
+  .responsive-sheet, .responsive-panel { display: block; }
+  .responsive-sheet > .overflow-y-auto, .responsive-panel > .overflow-y-auto { overflow-y: visible; }
+  .short-screen-flow { position: relative; top: auto; bottom: auto; }
+  .standard-category-nav { padding-block: .5rem; }
+  .standard-category-nav > button { width: 5rem; gap: .25rem; }
+  .standard-category-nav > button > div { width: 3rem; height: 3rem; margin-inline: auto; }
+  .standard-category-nav > button > span { font-size: .75rem; }
+}
+@media (pointer: coarse) {
+  /* Prevent focus zoom without disabling user zoom. */
+  input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), select, textarea {
+    font-size: max(1rem, 1em);
+  }
+}
+
 /* --- 0. ENVIRONMENT VARIABLES CONFIGURATION (NEW - IMPORTANT FOR MOBILE) --- */
 :root {
   --font-primary: var(--font-inter, Inter), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
@@ -37,7 +85,7 @@ body,
   /* Mobile optimizations from HTML */
   overscroll-behavior: none;
   -webkit-text-size-adjust: 100%;
-  touch-action: pan-x pan-y;
+  touch-action: manipulation;
   /* Ensure full height — allow vertical scroll, block horizontal */
   height: var(--app-height, 100dvh);
   overflow-x: hidden;

diff --git a/src/app/layout.tsx b/src/app/layout.tsx
index a32d28c..a1a8884 100644
--- a/src/app/layout.tsx
+++ b/src/app/layout.tsx
@@ -44,8 +44,6 @@ export const metadata: Metadata = {
 export const viewport = {
   width: "device-width",
   initialScale: 1,
-  maximumScale: 1,
-  userScalable: false, // Prevent zooming
   viewportFit: "cover",
   themeColor: "#b8860b",
 };

diff --git a/src/components/Booking/BookingConfirmModal.tsx b/src/components/Booking/BookingConfirmModal.tsx
index e7b64a1..3a2a866 100644
--- a/src/components/Booking/BookingConfirmModal.tsx
+++ b/src/components/Booking/BookingConfirmModal.tsx
@@ -83,7 +83,7 @@ export default function BookingConfirmModal({
         return (
             <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                 <div 
-                    className="bg-[#1c1c1e] border border-white/5 w-full p-8 shadow-2xl flex flex-col items-center text-center space-y-6 m-4 relative overflow-hidden animate-in zoom-in-95 duration-300"
+                    className="bg-[#1c1c1e] border border-white/5 w-full p-8 shadow-2xl flex flex-col items-center text-center space-y-6 m-4 relative responsive-panel animate-in zoom-in-95 duration-300"
                     style={{ maxWidth: UI_CONFIG.SUCCESS_MODAL_MAX_WIDTH, borderRadius: UI_CONFIG.BORDER_RADIUS }}
                 >
                     <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#C9A96E]/20 rounded-full blur-3xl -z-10 opacity-50"></div>
@@ -169,7 +169,7 @@ export default function BookingConfirmModal({
     return (
         <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in pb-0 sm:pb-0">
             <div
-                className="bg-[#1c1c1e] border border-white/10 w-full max-h-[90vh] sm:h-auto rounded-t-[32px] shadow-2xl flex flex-col overflow-hidden relative animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300"
+                className="bg-[#1c1c1e] border border-white/10 w-full max-h-[90dvh] sm:h-auto rounded-t-[32px] shadow-2xl flex flex-col responsive-panel relative animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300"
                 style={{ maxWidth: UI_CONFIG.MODAL_MAX_WIDTH, borderRadius: UI_CONFIG.BORDER_RADIUS }}
                 onClick={(e) => e.stopPropagation()}
             >

diff --git a/src/components/Booking/BookingTermsModal.tsx b/src/components/Booking/BookingTermsModal.tsx
index b739e90..740398c 100644
--- a/src/components/Booking/BookingTermsModal.tsx
+++ b/src/components/Booking/BookingTermsModal.tsx
@@ -22,7 +22,7 @@ export default function BookingTermsModal({ isOpen, onClose, lang }: BookingTerm
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: 100 }}
             transition={{ type: "spring", damping: 25, stiffness: 300 }}
-            className="bg-[#1b1b1d] w-full max-w-lg rounded-[32px] overflow-hidden border border-[#4d463a]/30 shadow-2xl flex flex-col max-h-[85vh]"
+            className="bg-[#1b1b1d] w-full max-w-lg rounded-[32px] overflow-hidden border border-[#4d463a]/30 shadow-2xl flex flex-col max-h-[85dvh]"
           >
             {/* Header */}
             <div className="flex justify-between items-center p-6 border-b border-[#4d463a]/20 bg-[#131315]">
@@ -38,7 +38,7 @@ export default function BookingTermsModal({ isOpen, onClose, lang }: BookingTerm
             </div>
 
             {/* Content */}
-            <div className="p-6 overflow-y-auto custom-scrollbar text-[#d0c5b5] space-y-6 text-sm leading-relaxed">
+            <div className="min-h-0 p-4 sm:p-6 overflow-y-auto custom-scrollbar text-[#d0c5b5] space-y-6 text-sm leading-relaxed">
               <section>
                 <h3 className="text-[#e6c487] font-bold mb-2 uppercase tracking-wide text-xs">1. {lang === 'en' ? 'Arrival Time' : 'Thời gian có mặt'}</h3>
                 <p>{lang === 'en' ? 'Please arrive 10-15 minutes prior to your scheduled appointment to allow time for check-in and preparation.' : 'Quý khách vui lòng đến trước 10-15 phút so với giờ hẹn để làm thủ tục và chuẩn bị.'}</p>

diff --git a/src/components/Checkout/CheckoutHeader.tsx b/src/components/Checkout/CheckoutHeader.tsx
index c7e33ba..eaaac64 100644
--- a/src/components/Checkout/CheckoutHeader.tsx
+++ b/src/components/Checkout/CheckoutHeader.tsx
@@ -12,9 +12,9 @@ interface CheckoutHeaderProps {
 export default function CheckoutHeader({ title, backLabel = "Menu", onBack, rightAction }: CheckoutHeaderProps) {
     const logoUrl = useAppLogo();
     return (
-        <div className="sticky top-0 z-50 bg-[#0d0d0d]/95 backdrop-blur-sm pb-4 mb-6 shadow-sm border-b border-white/10 transition-all pt-[calc(env(safe-area-inset-top))]">
+        <div className="short-screen-flow sticky top-0 z-50 bg-[#0d0d0d]/95 backdrop-blur-sm pb-4 mb-6 shadow-sm border-b border-white/10 transition-all pt-[calc(env(safe-area-inset-top))]">
             {/* Top Bar: Back + Title */}
-            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 mb-4">
+            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] items-center gap-3 px-4 py-3 border-b border-white/10 mb-4">
                 <button
                     onClick={onBack}
                     className="flex items-center gap-1 text-[#C9A96E] font-medium text-sm hover:text-[#E2C285] transition-colors"
@@ -22,7 +22,7 @@ export default function CheckoutHeader({ title, backLabel = "Menu", onBack, righ
                     <ChevronLeft size={20} />
                     <span>{backLabel}</span>
                 </button>
-                <h1 className="text-[#C9A96E] font-bold text-base absolute left-1/2 -translate-x-1/2">
+                <h1 className="text-[#C9A96E] font-bold text-base text-center">
                     {title}
                 </h1>
                 {rightAction ? (

diff --git a/src/components/Checkout/CustomRequestModal.tsx b/src/components/Checkout/CustomRequestModal.tsx
index d720447..d1eb953 100644
--- a/src/components/Checkout/CustomRequestModal.tsx
+++ b/src/components/Checkout/CustomRequestModal.tsx
@@ -77,7 +77,7 @@ export default function CustomRequestModal({ isOpen, onClose, onSave, lang, item
 
             {/* Modal Content */}
             <div className={`
-                bg-[#1c1c1e] border border-white/5 w-full max-w-lg max-h-[90vh] flex flex-col rounded-t-3xl md:rounded-3xl shadow-2xl pointer-events-auto
+                bg-[#1c1c1e] border border-white/5 w-full max-w-lg max-h-[90dvh] flex flex-col rounded-t-3xl md:rounded-3xl shadow-2xl pointer-events-auto
                 transform transition-all duration-300
             `}>
                 {/* Header */}
@@ -117,7 +117,7 @@ export default function CustomRequestModal({ isOpen, onClose, onSave, lang, item
                 </div>
 
                 {/* Body Content */}
-                <div className="flex-1 overflow-y-auto p-5">
+                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5">
                     {/* BODY TAB */}
                     {tab === 'BODY' && (
                         <div className="space-y-4">

diff --git a/src/components/Checkout/Invoice.tsx b/src/components/Checkout/Invoice.tsx
index 57b6f9e..07ef3f2 100644
--- a/src/components/Checkout/Invoice.tsx
+++ b/src/components/Checkout/Invoice.tsx
@@ -116,8 +116,8 @@ export default function Invoice({ cart, lang, dict, currency = 'VND', onCustomRe
                         return (
                             <div key={item.cartId} className="border border-white/10 rounded-2xl p-4 shadow-sm bg-[#0d0d0d] mb-4">
                                 {/* Row 1: Name + Price */}
-                                <div className="flex justify-between items-start mb-1 gap-2">
-                                    <h4 className="text-white font-bold text-lg truncate flex-1 flex items-center gap-2">
+                                <div className="flex flex-wrap justify-between items-start mb-1 gap-2">
+                                    <h4 className="text-white font-bold text-lg min-w-0 basis-full sm:basis-auto sm:flex-1 flex items-center gap-2">
                                         {idx + 1}. {isVipItem ? vipDisplayName : (item.names[lang] || item.names.en)}
                                         {isVipItem && <Crown size={16} className="text-[#e6c487] shrink-0" />}
                                     </h4>
@@ -308,7 +308,7 @@ export default function Invoice({ cart, lang, dict, currency = 'VND', onCustomRe
                 <div className="h-0 border-t-2 border-dashed border-white/10 my-6"></div>
 
                 {/* Total */}
-                <div className="flex justify-between items-baseline">
+                <div className="flex flex-wrap gap-3 justify-between items-baseline">
                     <span className="text-white font-bold text-lg">{dict.checkout?.total_bill || 'Total'}</span>
                     <div className="text-right">
                         <span className={`block text-3xl font-black ${currency === 'USD' ? 'text-emerald-600' : 'text-[#C9A96E]'}`}>

diff --git a/src/components/Checkout/OrderConfirmModal.tsx b/src/components/Checkout/OrderConfirmModal.tsx
index c80ac35..9e72638 100644
--- a/src/components/Checkout/OrderConfirmModal.tsx
+++ b/src/components/Checkout/OrderConfirmModal.tsx
@@ -174,7 +174,7 @@ const OrderConfirmModal: React.FC<OrderConfirmModalProps> = ({
         return (
             <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                 <div 
-                    className="bg-[#1c1c1e] border border-white/5 w-full p-8 shadow-2xl flex flex-col items-center text-center space-y-6 m-4 relative overflow-hidden animate-in zoom-in-95 duration-300"
+                    className="bg-[#1c1c1e] border border-white/5 w-full p-8 shadow-2xl flex flex-col items-center text-center space-y-6 m-4 relative responsive-panel animate-in zoom-in-95 duration-300"
                     style={{ maxWidth: UI_CONFIG.SUCCESS_MODAL_MAX_WIDTH, borderRadius: UI_CONFIG.BORDER_RADIUS }}
                 >
                     {/* Gold Glow Background */}
@@ -270,7 +270,7 @@ const OrderConfirmModal: React.FC<OrderConfirmModalProps> = ({
     return (
         <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in pb-0 sm:pb-0">
             <div
-                className="bg-[#1c1c1e] border border-white/10 w-full max-h-[90vh] sm:h-auto rounded-t-[32px] shadow-2xl flex flex-col overflow-hidden relative animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300"
+                className="bg-[#1c1c1e] border border-white/10 w-full max-h-[90dvh] sm:h-auto rounded-t-[32px] shadow-2xl flex flex-col responsive-panel relative animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300"
                 style={{ maxWidth: UI_CONFIG.MODAL_MAX_WIDTH, borderRadius: UI_CONFIG.BORDER_RADIUS }}
                 onClick={(e) => e.stopPropagation()}
             >

diff --git a/src/components/Checkout/PaymentMethods.tsx b/src/components/Checkout/PaymentMethods.tsx
index 8157939..4c31fb8 100644
--- a/src/components/Checkout/PaymentMethods.tsx
+++ b/src/components/Checkout/PaymentMethods.tsx
@@ -125,7 +125,7 @@ const PaymentMethods = ({ lang, dict, selected, onChange, onInfoContinue }: Paym
                     onClick={closeModal}
                 >
                     <div
-                        className={`bg-[#1c1c1e] w-full max-w-sm max-h-[85vh] flex flex-col rounded-[32px] overflow-hidden shadow-2xl border border-white/5 ${isClosing ? 'animate-out zoom-out-95' : 'animate-in zoom-in-95 duration-200'}`}
+                        className={`bg-[#1c1c1e] w-full max-w-sm max-h-[85dvh] flex flex-col rounded-[32px] overflow-hidden shadow-2xl border border-white/5 ${isClosing ? 'animate-out zoom-out-95' : 'animate-in zoom-in-95 duration-200'}`}
                         onClick={(e) => {
                             e.stopPropagation();
                             handleInfoContinue();
@@ -204,7 +204,7 @@ const PaymentMethods = ({ lang, dict, selected, onChange, onInfoContinue }: Paym
                             {modalContent === 'card' && (
                                 <div>
                                     <p className="text-center text-sm font-bold text-white mb-4 uppercase tracking-wider">{dict.payment_methods.accepted_cards}</p>
-                                    <div className="grid grid-cols-3 gap-4">
+                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                         {ACCEPTED_CARDS.map((card) => (
                                             <div key={card.name} className="flex flex-col items-center gap-2">
                                                 <div className="w-full aspect-[4/3] flex items-center justify-center p-2 rounded-xl border border-white/5 shadow-sm bg-white overflow-hidden">

diff --git a/src/components/Checkout/PaymentModal.tsx b/src/components/Checkout/PaymentModal.tsx
index 19ac49b..8acbdf7 100644
--- a/src/components/Checkout/PaymentModal.tsx
+++ b/src/components/Checkout/PaymentModal.tsx
@@ -126,7 +126,7 @@ export default function PaymentModal({
             <div className={`
                 relative w-full max-w-lg bg-[#1c1c1e] border border-white/5 md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col
                 transform transition-transform duration-300
-                pb-safe max-h-[90vh]
+                pb-safe max-h-[90dvh]
                 ${(isClosing || !isVisible) ? 'translate-y-full md:scale-95 md:translate-y-0 md:opacity-0' : 'translate-y-0 md:scale-100 md:opacity-100'}
             `}>
                 
@@ -146,7 +146,7 @@ export default function PaymentModal({
                 </div>
 
                 {/* Scrollable Content */}
-                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
+                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6">
                     {/* Pay Warning Banner */}
                     <div
                         className="relative overflow-hidden rounded-2xl border border-[#E8C97A]/35 bg-gradient-to-br from-[#2a1d0c] via-[#15110a] to-[#080808] p-4 text-center shadow-[0_0_30px_rgba(212,175,55,0.18)]"

diff --git a/src/components/Checkout/ServiceOptionSelector.tsx b/src/components/Checkout/ServiceOptionSelector.tsx
index e217922..8f748c2 100644
--- a/src/components/Checkout/ServiceOptionSelector.tsx
+++ b/src/components/Checkout/ServiceOptionSelector.tsx
@@ -63,7 +63,7 @@ export const ServiceOptionSelector = ({ initialOptions, onChange, lang = 'vi' }:
                 <label className="text-base font-medium text-gray-700">
                     {localeText.duration}
                 </label>
-                <div className="grid grid-cols-3 gap-3">
+                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                     {DURATIONS.map((dur) => (
                         <button
                             key={dur}

diff --git a/src/components/CustomForYou/BodyMap.tsx b/src/components/CustomForYou/BodyMap.tsx
index 6f0b905..a0a118b 100644
--- a/src/components/CustomForYou/BodyMap.tsx
+++ b/src/components/CustomForYou/BodyMap.tsx
@@ -133,12 +133,12 @@ const BodyMap: React.FC<BodyMapProps> = ({ focus, avoid, lang, serviceData, onTo
     if (availableParts.length === 0) return null;
 
     return (
-        <div className="flex gap-2 sm:gap-4 items-stretch min-h-[500px] sm:min-h-[580px] md:min-h-[620px]">
+        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 items-stretch">
 
             {/* Cá»˜T TRÃI: NÃºt ToÃ n ThÃ¢n */}
             {showFullBodyShortcut && (
-                <div className="w-[12%] sm:w-[12%] flex flex-col items-center justify-center pr-2">
-                    <label className="flex flex-col items-center justify-center cursor-pointer bg-[#1c1c1e] p-1.5 sm:p-2 rounded-xl border border-white/5 transition-all hover:border-white/15 active:scale-95 shadow-sm py-3 sm:py-4 w-full h-[110px] sm:h-[130px]">
+                <div className="sm:col-span-2">
+                    <label className="flex items-center justify-center gap-3 cursor-pointer bg-[#1c1c1e] p-3 rounded-xl border border-white/5 transition-all hover:border-white/15 active:scale-95 shadow-sm w-full">
                         <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center mb-1.5 sm:mb-2 transition-colors border-2 ${isFullBody ? 'bg-[#C9A96E] border-transparent' : 'bg-[#0d0d0d] border-white/10'}`}>
                             <Check className={`w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-black transition-opacity ${isFullBody ? 'opacity-100' : 'opacity-0'}`} strokeWidth={3} />
                             <input type="checkbox" className="hidden" checked={isFullBody} onChange={handleFullBodyToggle} />
@@ -152,7 +152,7 @@ const BodyMap: React.FC<BodyMapProps> = ({ focus, avoid, lang, serviceData, onTo
 
             {/* Cá»˜T GIá»®A: SVG Body Figure */}
             <div
-                className={`${showFullBodyShortcut ? 'w-[40%] sm:w-[42%]' : 'w-[42%] sm:w-[43%]'} self-stretch relative flex items-center justify-center pl-2 rounded-xl overflow-hidden`}
+                className="w-full h-72 sm:h-auto sm:min-h-[400px] relative flex items-center justify-center rounded-xl overflow-hidden"
                 style={{ backgroundColor: SVG_CONFIG.containerBg, border: '1px solid rgba(255,255,255,0.05)' }}
             >
                 <svg
@@ -207,7 +207,7 @@ const BodyMap: React.FC<BodyMapProps> = ({ focus, avoid, lang, serviceData, onTo
 
             {/* Cá»˜T PHáº¢I: Báº£ng Checklist */}
             {/* CỘT PHẢI: Bảng Checklist */}
-            <div className={`${showFullBodyShortcut ? 'w-[48%] sm:w-[46%]' : 'w-[58%] sm:w-[57%]'} flex flex-col pl-2 self-stretch justify-center`}>
+            <div className="w-full flex flex-col self-stretch justify-center">
                 <div
                     className="flex flex-row items-center text-sm sm:text-base md:text-lg font-bold uppercase tracking-tight pb-3 border-b border-white/10 flex-none mb-3 sm:mb-4 pt-0"
                     style={{ marginRight: LAYOUT_CONFIG.checklist.paddingRight }}
@@ -235,7 +235,7 @@ const BodyMap: React.FC<BodyMapProps> = ({ focus, avoid, lang, serviceData, onTo
                             >
                                 {isAvailable ? (
                                     <>
-                                        <span className={`text-lg sm:text-2xl md:text-[28px] flex-1 truncate font-semibold ${isFocus ? 'text-green-400' : isAvoid ? 'text-red-400' : 'text-gray-300'}`}>
+                                        <span className={`text-sm sm:text-base flex-1 break-words font-semibold ${isFocus ? 'text-green-400' : isAvoid ? 'text-red-400' : 'text-gray-300'}`}>
                                             {getText({
                                                 HEAD: { en: 'Head', vi: 'Đầu', jp: '頭', kr: '머리', cn: '头' },
                                                 NECK: { en: 'Neck', vi: 'Cổ', jp: '首', kr: '목', cn: '颈部' },

diff --git a/src/components/CustomForYou/index.tsx b/src/components/CustomForYou/index.tsx
index 9bee211..6edd58d 100644
--- a/src/components/CustomForYou/index.tsx
+++ b/src/components/CustomForYou/index.tsx
@@ -154,13 +154,13 @@ export default function CustomForYouModal({
             />
 
             {/* Modal Content - Fixed Height for no scroll */}
-            <div className="relative w-full sm:w-[95vw] max-w-2xl bg-[#0d0d0d] rounded-t-[32px] rounded-b-none sm:rounded-[32px] overflow-hidden flex flex-col h-[90vh] sm:h-[85vh] animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 border border-white/10 shadow-2xl">
+            <div className="relative w-full sm:w-[95vw] max-w-2xl bg-[#0d0d0d] rounded-t-[32px] rounded-b-none sm:rounded-[32px] overflow-hidden flex flex-col h-[90dvh] sm:h-[85dvh] animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 border border-white/10 shadow-2xl">
 
                 {/* Header */}
-                <div className="px-6 py-5 flex items-center justify-between z-20">
+                <div className="px-4 py-3 sm:px-6 sm:py-5 flex items-center justify-between gap-2 shrink-0 z-20">
                     <div>
-                        <h2 className="text-3xl sm:text-4xl md:text-[42px] font-sans tracking-wide text-[#C9A96E] leading-tight">{dict.custom_for_you?.title}</h2>
-                        <p className="text-xl sm:text-2xl md:text-[28px] text-gray-400 font-medium mt-1 leading-snug">
+                        <h2 className="text-xl sm:text-2xl font-sans tracking-wide text-[#C9A96E] leading-tight">{dict.custom_for_you?.title}</h2>
+                        <p className="text-sm sm:text-base text-gray-400 font-medium mt-1 leading-snug">
                             {getText(serviceData.NAMES, lang)}
                         </p>
                     </div>
@@ -173,7 +173,7 @@ export default function CustomForYouModal({
                 </div>
 
                 {/* Content Area - Hidden overflow and flex to fit */}
-                <div className="flex-1 overflow-hidden relative">
+                <div className="flex-1 min-h-0 overflow-hidden relative">
                     <div 
                         className="absolute inset-0 overflow-y-auto px-6 py-2 custom-scrollbar"
                         onScroll={handleScroll}
@@ -230,16 +230,16 @@ export default function CustomForYouModal({
 
                 {/* Footer Action */}
                 <div className="bg-[#0d0d0d] pb-[env(safe-area-inset-bottom)] z-20 p-4 border-t border-white/10">
-                    <div className="grid grid-cols-[1.15fr_0.85fr] gap-3">
+                    <div className="grid grid-cols-2 gap-2">
                         <button
                             onClick={() => onSave(prefs)}
-                            className="custom-continue-order-btn bg-[#151515] hover:bg-[#202020] border border-white/10 text-gray-100 font-bold py-4 sm:py-5 md:py-6 rounded-[18px] flex items-center justify-center text-lg sm:text-xl md:text-2xl transition-all active:scale-[0.98] shadow-lg"
+                            className="custom-continue-order-btn bg-[#151515] hover:bg-[#202020] border border-white/10 text-gray-100 font-bold px-2 py-3 rounded-[18px] flex items-center justify-center text-sm sm:text-base transition-all active:scale-[0.98] shadow-lg"
                         >
                             {getText({ en: 'Continue order', vi: 'Tiếp tục chọn', jp: '注文を続ける', kr: '계속 선택', cn: '继续点单' }, lang)}
                         </button>
                         <button
                             onClick={() => (onSaveAndCheckout ? onSaveAndCheckout(prefs) : onSave(prefs))}
-                            className="custom-save-checkout-btn bg-[#C9A96E] hover:bg-[#dfc599] border border-transparent text-black font-bold py-4 sm:py-5 md:py-6 rounded-[18px] flex items-center justify-center gap-2 text-lg sm:text-xl md:text-2xl transition-all active:scale-[0.98] shadow-lg shadow-[#C9A96E]/20"
+                            className="custom-save-checkout-btn bg-[#C9A96E] hover:bg-[#dfc599] border border-transparent text-black font-bold px-2 py-3 rounded-[18px] flex items-center justify-center gap-2 text-sm sm:text-base transition-all active:scale-[0.98] shadow-lg shadow-[#C9A96E]/20"
                         >
                             <Check className="w-6 h-6 md:w-8 md:h-8" />
                             {getText({ en: 'Checkout', vi: 'Thanh toán', jp: 'お会計へ', kr: '결제하기', cn: '去结账' }, lang)}

diff --git a/src/components/Feedback/BelongingsCheck.tsx b/src/components/Feedback/BelongingsCheck.tsx
index 3b877c3..83852a5 100644
--- a/src/components/Feedback/BelongingsCheck.tsx
+++ b/src/components/Feedback/BelongingsCheck.tsx
@@ -21,7 +21,7 @@ export const BelongingsCheck = ({ lang = 'vi', onConfirm }: { lang?: 'vi' | 'en'
     return (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 animate-in fade-in">
             <div
-                className="bg-white w-full max-w-sm p-6 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 items-center text-center"
+                className="responsive-panel bg-white w-full max-w-sm p-6 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 items-center text-center"
                 style={{ borderRadius: PANEL_RADIUS }}
             >
                 <div className="w-16 h-16 bg-amber-100 rounded-full flex justify-center items-center text-amber-600 mb-2">

diff --git a/src/components/Feedback/PostReviewScale.tsx b/src/components/Feedback/PostReviewScale.tsx
index 451bb3e..a5223cb 100644
--- a/src/components/Feedback/PostReviewScale.tsx
+++ b/src/components/Feedback/PostReviewScale.tsx
@@ -59,7 +59,7 @@ export const PostReviewScale = ({ lang = 'vi' }: { lang?: 'vi' | 'en' }) => {
                 </div>
 
                 {/* 5 Faces Icons */}
-                <div className="flex justify-between w-full px-2 gap-2">
+                <div className="flex flex-wrap justify-center w-full gap-3">
                     {FACES.map((face) => {
                         const isSelected = score === face.score;
                         let label = '';
@@ -97,10 +97,10 @@ export const PostReviewScale = ({ lang = 'vi' }: { lang?: 'vi' | 'en' }) => {
                 {showTipping && (
                     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 animate-in fade-in">
                         <div
-                            className="bg-white w-full max-w-sm p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95"
+                            className="responsive-panel bg-white w-full max-w-sm p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95"
                             style={{ borderRadius: MODAL_RADIUS }}
                         >
-                            <div className="flex justify-center -mt-12">
+                            <div className="flex justify-center">
                                 <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                                     <span className="text-3xl animate-bounce">💖</span>
                                 </div>

diff --git a/src/components/Journey/TipModal.tsx b/src/components/Journey/TipModal.tsx
index 626a516..96953b7 100644
--- a/src/components/Journey/TipModal.tsx
+++ b/src/components/Journey/TipModal.tsx
@@ -27,7 +27,7 @@ export default function TipModal({ onClose, lang = 'vi' }: TipModalProps) {
 
     return (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
-            <div className="bg-[#1c1c1e] w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative animate-in zoom-in-95 duration-300 border border-white/5">
+            <div className="responsive-panel bg-[#1c1c1e] w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative animate-in zoom-in-95 duration-300 border border-white/5">
                 {/* Close X */}
                 <button onClick={() => onClose(0)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>

diff --git a/src/components/Menu/DeepBody/BookingConfig/index.tsx b/src/components/Menu/DeepBody/BookingConfig/index.tsx
index 71ffd70..18ca375 100644
--- a/src/components/Menu/DeepBody/BookingConfig/index.tsx
+++ b/src/components/Menu/DeepBody/BookingConfig/index.tsx
@@ -250,22 +250,7 @@ export default function DeepBookingConfig({
   const currentUsdPrice = isFourHands ? Math.round(currentService.priceUSD * 1.5) : currentService.priceUSD;
 
   const handleToggleTechnique = (techId: DeepBodyBaseTechniqueId) => {
-    setSelectedTechniqueIds((prev) => {
-      // If currently single technique
-      if (prev.length === 1) {
-        if (prev[0] === techId) return prev;
-        return [techId]; // Switch to the clicked single technique
-      }
-      // If currently in mix mode
-      if (prev.includes(techId)) {
-        return prev.filter((id) => id !== techId);
-      } else {
-        if (prev.length < 4) {
-          return [...prev, techId];
-        }
-        return prev;
-      }
-    });
+    setSelectedTechniqueIds([techId]);
   };
 
   const handleOpenMixPopover = () => {
@@ -413,7 +398,9 @@ export default function DeepBookingConfig({
         {/* Techniques List (1 card per row, large prominent typography matching Standard style) */}
         <div className="flex flex-col gap-3 sm:gap-3.5 mt-4">
           {baseMethods.map((tech) => {
-            const isSelected = selectedTechniqueIds.includes(tech.id as DeepBodyBaseTechniqueId);
+            const isSelected =
+              selectedTechniqueIds.length === 1 &&
+              selectedTechniqueIds[0] === (tech.id as DeepBodyBaseTechniqueId);
 
             return (
               <div
@@ -475,7 +462,7 @@ export default function DeepBookingConfig({
               <div className="flex flex-col min-w-0 flex-1">
                 <div className="flex items-center gap-3.5">
                   <h4 className="text-2xl sm:text-3xl md:text-[32px] font-black leading-tight tracking-wide text-white group-hover:text-[#e6c487] transition-colors truncate">
-                    {mixMethod.name[safeLang] || mixMethod.name.en}
+                    Mix
                   </h4>
                   <button
                     type="button"
@@ -532,10 +519,10 @@ export default function DeepBookingConfig({
         {/* Dynamic Duration Cards Grid matching ma trận thời lượng */}
         <div className={`grid gap-2.5 xs:gap-3 sm:gap-4 md:gap-5 w-full ${
           availableServices.length === 3
-            ? 'grid-cols-3'
+            ? 'grid-cols-2 sm:grid-cols-3'
             : availableServices.length === 4
-            ? 'grid-cols-2 sm:grid-cols-4'
-            : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'
+            ? 'grid-cols-2 lg:grid-cols-4'
+            : 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-5'
         }`}>
           {availableServices.map((svc, idx) => {
             const isSelected = effectiveDuration === svc.timeValue;
@@ -571,7 +558,7 @@ export default function DeepBookingConfig({
 
                 <div className="w-12 sm:w-16 h-px bg-white/10 my-1 sm:my-1.5" />
 
-                <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1 text-center font-black">
+                <div className="flex flex-col items-center justify-center gap-0.5 sm:gap-1 text-center font-black">
                   <span className="text-xs xs:text-sm sm:text-base md:text-lg tracking-tight whitespace-nowrap">
                     {priceVND.toLocaleString('vi-VN')} VND
                   </span>

diff --git a/src/components/Menu/DeepBody/CertificateModal.tsx b/src/components/Menu/DeepBody/CertificateModal.tsx
index 826d16a..dbe03a5 100644
--- a/src/components/Menu/DeepBody/CertificateModal.tsx
+++ b/src/components/Menu/DeepBody/CertificateModal.tsx
@@ -41,7 +41,7 @@ export default function CertificateModal({
           animate={{ opacity: 1, scale: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.92, y: 20 }}
           transition={{ type: 'spring', damping: 25, stiffness: 300 }}
-          className="relative w-full max-w-lg bg-[#141416] border border-[#e6c487]/40 rounded-[2rem] p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col z-10"
+          className="relative w-full max-w-lg max-h-[calc(100dvh_-_3rem)] bg-[#141416] border border-[#e6c487]/40 rounded-[2rem] p-4 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-y-auto overscroll-contain z-10"
         >
           {/* Top Gold Accent */}
           <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[#e6c487] to-transparent opacity-80" />

diff --git a/src/components/Menu/DeepBody/DeepBody.i18n.ts b/src/components/Menu/DeepBody/DeepBody.i18n.ts
index b816eb0..67c0ab8 100644
--- a/src/components/Menu/DeepBody/DeepBody.i18n.ts
+++ b/src/components/Menu/DeepBody/DeepBody.i18n.ts
@@ -386,8 +386,8 @@ export const DEEP_BODY_I18N = {
     kr: '닫기',
   },
   mix_popover_title: {
-    vi: 'Tùy Chọn Liệu Trình Kết Hợp (Mix)',
-    en: 'Customize Combined Treatment (Mix)',
+    vi: 'Chọn phương pháp Mix',
+    en: 'Choose Mix therapies',
     cn: '自选组合疗程（Mix）',
     jp: '複合トリートメント選択（Mix）',
     kr: '맞춤 복합 테라피 선택 (Mix)',

diff --git a/src/components/Menu/DeepBody/StaffSelector/MixTechniquePopover.tsx b/src/components/Menu/DeepBody/StaffSelector/MixTechniquePopover.tsx
index 6341840..fab1f26 100644
--- a/src/components/Menu/DeepBody/StaffSelector/MixTechniquePopover.tsx
+++ b/src/components/Menu/DeepBody/StaffSelector/MixTechniquePopover.tsx
@@ -48,10 +48,13 @@ export default function MixTechniquePopover({
 
   const [selectedIds, setSelectedIds] = useState<DeepBodyBaseTechniqueId[]>(() => {
     if (initialSelected.length >= 2) return initialSelected;
-    // Default select first 2 techniques that staff supports
     const available = DEEP_BODY_BASE_TECHNIQUE_IDS.filter((id) =>
       staffHasDeepBodyTechnique(staff?.skills, id)
     );
+    if (initialSelected.length === 1 && available.includes(initialSelected[0])) {
+      const peer = available.find((id) => id !== initialSelected[0]);
+      return peer ? [initialSelected[0], peer] : available.slice(0, 2);
+    }
     return available.slice(0, 2);
   });
 
@@ -176,7 +179,7 @@ export default function MixTechniquePopover({
               <button
                 type="button"
                 onClick={onCancel}
-                className="min-h-11 flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
+                className="min-h-11 flex-1 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
               >
                 {t.mix_cancel}
               </button>
@@ -184,7 +187,7 @@ export default function MixTechniquePopover({
                 type="button"
                 onClick={handleApply}
                 disabled={isApplyDisabled}
-                className={`min-h-11 flex-1 px-5 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
+                className={`min-h-11 flex-1 whitespace-nowrap px-5 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                   isApplyDisabled
                     ? 'opacity-40 bg-zinc-700 text-gray-400 cursor-not-allowed'
                     : 'bg-gradient-to-r from-[#e6c487] to-[#c9a96e] text-black hover:brightness-110 active:scale-95'

diff --git a/src/components/Menu/DeepBody/StaffSelector/StaffImageCarousel.tsx b/src/components/Menu/DeepBody/StaffSelector/StaffImageCarousel.tsx
index 27db6fe..b02ea45 100644
--- a/src/components/Menu/DeepBody/StaffSelector/StaffImageCarousel.tsx
+++ b/src/components/Menu/DeepBody/StaffSelector/StaffImageCarousel.tsx
@@ -51,6 +51,7 @@ export interface StaffImageCarouselProps {
   staffId: string;
   staffName: string;
   lang?: string;
+  imageFit?: 'contain' | 'cover';
   onActiveItemChange?: (item: TherapyGalleryParsedItem | null) => void;
 }
 
@@ -60,6 +61,7 @@ export default function StaffImageCarousel({
   staffId,
   staffName,
   lang = 'vi',
+  imageFit = 'contain',
   onActiveItemChange,
 }: StaffImageCarouselProps) {
   const [currentIndex, setCurrentIndex] = useState(0);
@@ -230,22 +232,39 @@ export default function StaffImageCarousel({
         style={{ transform: `translateX(-${validIndex * 100}%)` }}
       >
         {normalizedItems.map((item, idx) => (
-          <div key={idx} className="w-full h-full shrink-0 relative bg-[#131315] flex items-center justify-center overflow-hidden">
-            {/* Ambient blurred backdrop so letterbox/pillarbox blends softly */}
-            <img
-              src={item.url}
-              alt=""
-              aria-hidden="true"
-              className="absolute inset-0 w-full h-full object-cover blur-2xl scale-125 opacity-25 pointer-events-none"
-            />
-            {/* Full uncropped image */}
-            <img
-              src={item.url}
-              alt={`${staffName} - ${idx + 1}`}
-              className="w-full h-full object-contain relative z-10 pointer-events-none"
-              loading={idx === 0 ? 'eager' : 'lazy'}
-              draggable={false}
-            />
+          <div
+            key={idx}
+            className={`w-full h-full shrink-0 relative flex items-center justify-center overflow-hidden ${
+              imageFit === 'cover' ? 'bg-[#1b1b1d]' : 'bg-[#131315]'
+            }`}
+          >
+            {imageFit === 'cover' ? (
+              <img
+                src={item.url}
+                alt={`${staffName} - ${idx + 1}`}
+                className="w-full h-full object-cover object-top pointer-events-none transition-transform duration-700 group-hover:scale-105"
+                loading={idx === 0 ? 'eager' : 'lazy'}
+                draggable={false}
+              />
+            ) : (
+              <>
+                {/* Ambient blurred backdrop so letterbox/pillarbox blends softly */}
+                <img
+                  src={item.url}
+                  alt=""
+                  aria-hidden="true"
+                  className="absolute inset-0 w-full h-full object-cover blur-2xl scale-125 opacity-25 pointer-events-none"
+                />
+                {/* Full uncropped image */}
+                <img
+                  src={item.url}
+                  alt={`${staffName} - ${idx + 1}`}
+                  className="w-full h-full object-contain relative z-10 pointer-events-none"
+                  loading={idx === 0 ? 'eager' : 'lazy'}
+                  draggable={false}
+                />
+              </>
+            )}
           </div>
         ))}
       </div>

diff --git a/src/components/Menu/DeepBody/StaffSelector/index.tsx b/src/components/Menu/DeepBody/StaffSelector/index.tsx
index e287d6c..a1cf4d1 100644
--- a/src/components/Menu/DeepBody/StaffSelector/index.tsx
+++ b/src/components/Menu/DeepBody/StaffSelector/index.tsx
@@ -250,6 +250,19 @@ export default function DeepStaffSelector({
     }
 
     setMixStaff(null);
+
+    const selectedStaff = resolveSelectedStaff(result.nextSelectedIds, staffList);
+    if (!selectedStaff) {
+      setWarningMessage(t.staff_selection_stale_warning);
+      return;
+    }
+
+    if (result.nextSelectedIds.length === 2 && !showGroupingPopup) {
+      setShowGroupingPopup(true);
+      return;
+    }
+
+    onConfirmSelection(result.nextSelectedIds, selectedStaff, undefined, result.nextTechniqueIds);
   };
 
   const handleMixCancel = () => {
@@ -428,6 +441,7 @@ export default function DeepStaffSelector({
                 <div className="relative h-[470px] md:h-[510px] w-full overflow-hidden bg-[#1b1b1d]">
                   {/* Image Carousel (Lướt ảnh qua lại) */}
                   <StaffImageCarousel
+                    imageFit="contain"
                     items={carouselItems}
                     staffId={staff.id}
                     staffName={staff.fullName}

diff --git a/src/components/Menu/DeepBody/TechniqueGalleryModal.tsx b/src/components/Menu/DeepBody/TechniqueGalleryModal.tsx
index a19ab41..0e27bc1 100644
--- a/src/components/Menu/DeepBody/TechniqueGalleryModal.tsx
+++ b/src/components/Menu/DeepBody/TechniqueGalleryModal.tsx
@@ -55,7 +55,7 @@ export default function TechniqueGalleryModal({
           animate={{ opacity: 1, scale: 1, y: 0 }}
           exit={{ opacity: 0, scale: 0.92, y: 20 }}
           transition={{ type: 'spring', damping: 25, stiffness: 300 }}
-          className="relative w-full max-w-2xl bg-[#141416] border border-[#e6c487]/40 rounded-[2rem] p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh] z-10"
+          className="relative w-full max-w-2xl bg-[#141416] border border-[#e6c487]/40 rounded-[2rem] p-4 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-y-auto overscroll-contain max-h-[calc(100dvh_-_3rem)] z-10"
         >
           {/* Top Gold Accent */}
           <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[#e6c487] to-transparent opacity-80" />
@@ -77,7 +77,7 @@ export default function TechniqueGalleryModal({
           </div>
 
           {/* Scrollable Content */}
-          <div className="overflow-y-auto py-4 space-y-4 custom-scrollbar pr-1">
+          <div className="py-4 space-y-4 pr-1">
             {/* Image Slider */}
             <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/60 border border-white/10 shadow-lg group">
               <img

diff --git a/src/components/Menu/Premium/BookingConfig/index.tsx b/src/components/Menu/Premium/BookingConfig/index.tsx
index 1c58f1d..67b1c08 100644
--- a/src/components/Menu/Premium/BookingConfig/index.tsx
+++ b/src/components/Menu/Premium/BookingConfig/index.tsx
@@ -590,10 +590,10 @@ const BookingConfig = ({ lang, isBookingFlow, selectedStaffIds, selectedStaffInf
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: 80 }}
             transition={{ type: 'spring', stiffness: 400, damping: 30 }}
-            className="fixed inset-x-0 bottom-0 z-50 border-t border-white/8 bg-gradient-to-t from-[#101012] via-[#101012]/96 to-[#101012]/82 px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-8 shadow-[0_-24px_45px_rgba(0,0,0,0.72)] backdrop-blur-2xl"
+            className="short-screen-flow fixed inset-x-0 bottom-0 z-50 border-t border-white/8 bg-gradient-to-t from-[#101012] via-[#101012]/96 to-[#101012]/82 px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-8 shadow-[0_-24px_45px_rgba(0,0,0,0.72)] backdrop-blur-2xl"
           >
             <div className="mx-auto w-full lg:w-[500px]">
-              <div className="flex justify-between items-end mb-2 px-1">
+              <div className="flex flex-wrap gap-3 justify-between items-end mb-2 px-1">
                 <div>
                   <div className="text-xs text-[#998f81] uppercase tracking-wider font-bold mb-1">{t.bc_selected}</div>
                   <div className="text-3xl font-black text-[#e4e2e4]">{effectiveDuration} <span className="text-xl font-medium">{t.bc_mins}</span></div>
@@ -626,7 +626,7 @@ const BookingConfig = ({ lang, isBookingFlow, selectedStaffIds, selectedStaffInf
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
-              className="bg-[#131315] border border-[#e6c487]/30 rounded-3xl p-5 w-full max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
+              className="responsive-panel bg-[#131315] border border-[#e6c487]/30 rounded-3xl p-5 w-full max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
             >
               {/* Header */}
               <div className="flex justify-between items-center mb-4">
@@ -693,7 +693,7 @@ const BookingConfig = ({ lang, isBookingFlow, selectedStaffIds, selectedStaffInf
                         setSelectedSlot(null);
                         setShowCalendar(false);
                       }}
-                      className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs transition-all ${
+                      className={`min-h-9 w-full rounded-xl flex items-center justify-center text-xs transition-all ${
                         isSelected
                           ? 'bg-[#e6c487] text-[#412d00] font-bold'
                           : disabled
@@ -730,7 +730,7 @@ const BookingConfig = ({ lang, isBookingFlow, selectedStaffIds, selectedStaffInf
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 20 }}
-              className="bg-[#131315] border border-[#e6c487]/30 rounded-3xl p-6 w-full max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col max-h-[80vh]"
+              className="bg-[#131315] border border-[#e6c487]/30 rounded-3xl p-6 w-full max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col max-h-[80dvh]"
             >
               <div className="flex justify-between items-center mb-5 pb-4 border-b border-[#4d463a]/30">
                 <h4 className="font-sans not-italic text-xl text-[#e6c487]">

diff --git a/src/components/Menu/Premium/SkillBuilder/index.tsx b/src/components/Menu/Premium/SkillBuilder/index.tsx
index b68cf0b..241983f 100644
--- a/src/components/Menu/Premium/SkillBuilder/index.tsx
+++ b/src/components/Menu/Premium/SkillBuilder/index.tsx
@@ -106,9 +106,9 @@ export default function SkillBuilder({ lang, selectedStaffIds, onConfirmSkills }
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: 100 }}
             transition={{ type: 'spring', stiffness: 300, damping: 30 }}
-            className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d] to-transparent pt-12"
+            className="relative p-4 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d] to-transparent pt-12"
           >
-            <div className="flex justify-between items-end mb-4 px-2">
+            <div className="flex flex-wrap gap-3 justify-between items-end mb-4 px-2">
               <div>
                 <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{isVi ? 'Thời gian phục vụ' : 'Total Duration'}</div>
                 <div className="text-3xl font-black text-white">{totalDuration} <span className="text-xl font-medium">{isVi ? 'phút' : 'mins'}</span></div>

diff --git a/src/components/Menu/Premium/StaffSelector/index.tsx b/src/components/Menu/Premium/StaffSelector/index.tsx
index 5966da4..3dfbcc3 100644
--- a/src/components/Menu/Premium/StaffSelector/index.tsx
+++ b/src/components/Menu/Premium/StaffSelector/index.tsx
@@ -302,6 +302,7 @@ const StaffSelector = ({ lang, preferredCategoryId, cartHasItems, onConfirmSelec
                 <div className="relative h-[450px] md:h-[500px] w-full overflow-hidden bg-[#1b1b1d]">
                   {/* Image Carousel (Avatar trước, sau đó là Gallery) */}
                   <StaffImageCarousel
+                    imageFit="cover"
                     images={(() => {
                       const { primary, photos } = resolveMenuPhotos({ staff, menu: 'nhp' });
                       return photos.length > 0 ? photos : (primary ? [primary] : []);

diff --git a/src/components/Menu/Premium/TimeSlotPicker/index.tsx b/src/components/Menu/Premium/TimeSlotPicker/index.tsx
index 090a8e1..0635a85 100644
--- a/src/components/Menu/Premium/TimeSlotPicker/index.tsx
+++ b/src/components/Menu/Premium/TimeSlotPicker/index.tsx
@@ -104,7 +104,7 @@ export default function TimeSlotPicker({ lang, totalDuration, onConfirm }: TimeS
           <motion.div
             initial={{ opacity: 0, y: 100 }}
             animate={{ opacity: 1, y: 0 }}
-            className="absolute bottom-4 left-4 right-4"
+            className="relative mt-6 mb-4"
           >
             <button
               onClick={onConfirm}

diff --git a/src/components/Menu/Premium/VipCartStep/index.tsx b/src/components/Menu/Premium/VipCartStep/index.tsx
index 6337fb1..f6095c3 100644
--- a/src/components/Menu/Premium/VipCartStep/index.tsx
+++ b/src/components/Menu/Premium/VipCartStep/index.tsx
@@ -251,8 +251,8 @@ const VipCartStep = ({
             {/* ── Sheet Container ───────────────────── */}
             <div
                 className={`
-                    fixed bottom-0 left-0 w-full bg-[#0d0d0d] rounded-t-[30px] z-[100]
-                    overflow-hidden flex flex-col shadow-2xl
+                    responsive-sheet fixed bottom-0 left-0 w-full bg-[#0d0d0d] rounded-t-[30px] z-[100]
+                    flex flex-col shadow-2xl
                     transform transition-transform duration-${ANIMATION_DURATION} ease-out
                     ${(isClosing || !isVisible) ? 'translate-y-full' : 'translate-y-0'}
                 `}

diff --git a/src/components/Menu/Premium/index.tsx b/src/components/Menu/Premium/index.tsx
index bc707e6..6dd2e3d 100644
--- a/src/components/Menu/Premium/index.tsx
+++ b/src/components/Menu/Premium/index.tsx
@@ -324,7 +324,7 @@ const PremiumMenu = ({ lang, isBookingFlow, onBack, onCheckout, onSwitchToStanda
             </div>
 
             {/* Header */}
-            <header className={`sticky top-0 ${isLangOpen ? 'z-[80]' : 'z-40'} bg-[#0e0e10]/80 backdrop-blur-xl shadow-[0_0_40px_rgba(201,169,110,0.04)]`}>
+            <header className={`shrink-0 ${isLangOpen ? 'z-[80]' : 'z-40'} bg-[#0e0e10]/80 backdrop-blur-xl shadow-[0_0_40px_rgba(201,169,110,0.04)]`}>
                 <div className="flex justify-between items-center gap-2 px-3 sm:px-6 py-3">
                     <button
                         onClick={handleBack}

diff --git a/src/components/Menu/Standard/Footer.tsx b/src/components/Menu/Standard/Footer.tsx
index 67c2bae..a47a772 100644
--- a/src/components/Menu/Standard/Footer.tsx
+++ b/src/components/Menu/Standard/Footer.tsx
@@ -81,9 +81,9 @@ export default function Footer({ totalVND, totalUSD, totalItems, maxMinutes, lan
             </AnimatePresence>
 
             <div
-                className="glass-footer w-full max-w-[100vw] box-border px-3 sm:px-4 md:px-6 pt-4 sm:pt-5 md:pt-6 flex items-center justify-between gap-2 sm:gap-3 animate-[slide-up_0.3s_ease-out] bg-black/90 backdrop-blur-xl border-t border-gray-800 overflow-visible"
+                className="glass-footer w-full box-border px-3 sm:px-4 md:px-6 pt-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-3 bg-black/90 backdrop-blur-xl border-t border-gray-800 overflow-visible shrink-0"
                 style={{
-                    position: 'fixed',
+                    position: 'relative',
                     bottom: 0,
                     left: 0,
                     right: 0,
@@ -114,7 +114,7 @@ export default function Footer({ totalVND, totalUSD, totalItems, maxMinutes, lan
                                 animate={{ opacity: 1, y: 0, scale: 1 }}
                                 exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                 transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
-                                className="absolute bottom-[calc(100%+16px)] left-0 z-[110] flex flex-col gap-4 p-2"
+                                className="absolute bottom-[calc(100%+16px)] left-0 z-[110] flex flex-col gap-2 p-2 max-h-[60dvh] overflow-y-auto rounded-2xl bg-black/95"
                             >
                                 {languages.map((l) => (
                                     <button
@@ -134,13 +134,13 @@ export default function Footer({ totalVND, totalUSD, totalItems, maxMinutes, lan
                 </div>
 
             {/* Thông tin Tiền & Thời gian */}
-            <div className="flex-1 flex flex-col items-start md:items-center justify-center min-w-0 overflow-hidden px-1 sm:px-2">
+            <div className="order-first w-full sm:order-none sm:w-auto sm:flex-1 flex flex-col items-start md:items-center justify-center min-w-0 px-1 sm:px-2">
                 {maxMinutes > 0 && (
-                    <div className="max-w-full text-[clamp(9px,1.8vw,15px)] text-gray-400 font-bold tracking-[0.14em] uppercase mb-1 flex items-center gap-1 whitespace-nowrap overflow-hidden text-ellipsis">
+                    <div className="max-w-full text-xs text-gray-400 font-bold tracking-wide uppercase mb-1 flex flex-wrap items-center gap-1">
                         {t('total_est')} <span className="text-[#C9A96E] font-bold ml-1">• {maxMinutes} {t('mins')}</span>
                     </div>
                 )}
-                <div className="w-full flex items-baseline justify-start md:justify-center gap-1 whitespace-nowrap overflow-hidden">
+                <div className="w-full flex flex-wrap items-baseline justify-start md:justify-center gap-1">
                     <span className="text-[clamp(22px,4.4vw,42px)] font-bold text-white tracking-wide tabular-nums leading-none">{formatCurrency(totalVND)}</span>
                     <span className="text-[clamp(10px,1.7vw,16px)] text-gray-500 font-bold mb-0.5 ml-0.5">VND</span>
 

diff --git a/src/components/Menu/Standard/Header.tsx b/src/components/Menu/Standard/Header.tsx
index 6dab244..044f6b9 100644
--- a/src/components/Menu/Standard/Header.tsx
+++ b/src/components/Menu/Standard/Header.tsx
@@ -86,7 +86,7 @@ export default function Header({ categories, activeCategory, lang, onSelectCateg
                 onMouseLeave={handleMouseLeave}
                 onMouseUp={handleMouseUp}
                 onMouseMove={handleMouseMove}
-                className={`flex flex-row overflow-x-auto md:justify-center snap-x hide-scrollbar gap-x-5 md:gap-x-8 pt-5 px-4 pb-3 transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-0'} cursor-grab`}
+                className={`standard-category-nav flex flex-row overflow-x-auto justify-start snap-x hide-scrollbar gap-x-5 md:gap-x-8 pt-3 px-4 pb-3 transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-0'} cursor-grab`}
                 style={{ scrollBehavior: 'smooth' }}
             >
                 {repeatedCategories.map((cat, index) => {

diff --git a/src/components/Menu/Standard/ServiceItem.tsx b/src/components/Menu/Standard/ServiceItem.tsx
index b2074ad..056487b 100644
--- a/src/components/Menu/Standard/ServiceItem.tsx
+++ b/src/components/Menu/Standard/ServiceItem.tsx
@@ -60,7 +60,7 @@ export default function ServiceItem({ service, singleOption, quantity, lang, isB
                 onClick={onClick}
                 className={`
                     relative w-full min-h-[210px] sm:min-h-[230px] md:min-h-[250px] overflow-hidden rounded-[28px] border px-5 py-5 sm:px-7 sm:py-6 md:px-9
-                    flex items-center gap-5 sm:gap-7 md:gap-8 cursor-pointer active:scale-[0.985] transition-all duration-300
+                    flex flex-col sm:flex-row items-stretch sm:items-center gap-5 sm:gap-7 md:gap-8 cursor-pointer active:scale-[0.985] transition-all duration-300
                     bg-[radial-gradient(circle_at_18%_50%,rgba(218,163,64,0.20),transparent_32%),linear-gradient(115deg,rgba(18,11,5,0.82),rgba(0,0,0,0.54))]
                     shadow-[0_18px_44px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,238,170,0.08)]
                     ${isSelected ? 'border-white/20' : 'border-white/10 hover:border-white/18'}
@@ -91,7 +91,7 @@ export default function ServiceItem({ service, singleOption, quantity, lang, isB
                     ) : null}
                 </div>
 
-                <div className="relative z-20 flex w-[126px] shrink-0 flex-col items-end justify-center gap-4 sm:w-[172px] md:w-[220px]">
+                <div className="relative z-20 flex w-full shrink-0 flex-row flex-wrap items-center justify-between gap-4 sm:w-[172px] md:w-[220px] sm:flex-col sm:items-end sm:justify-center">
                     {singleOption.timeValue > 0 && (
                         <div className="rounded-full border border-white/12 bg-black/25 px-4 py-1.5 text-center sm:px-6 sm:py-2">
                             <span className="text-[18px] font-black tracking-[0.08em] text-[#ffe7a3] sm:text-[24px] md:text-[28px]">

diff --git a/src/components/Menu/Standard/ServiceList.tsx b/src/components/Menu/Standard/ServiceList.tsx
index 9f36b46..7773e7d 100644
--- a/src/components/Menu/Standard/ServiceList.tsx
+++ b/src/components/Menu/Standard/ServiceList.tsx
@@ -169,7 +169,7 @@ export default function ServiceList({ categories, services, cart, lang, directio
     }, [services, showHiddenServices]);
 
     return (
-        <div className="flex-1 overflow-y-auto px-4 pb-40 scroll-smooth no-scrollbar" id="service-list-container">
+        <div className="flex-1 min-h-0 min-w-0 overflow-y-auto px-4 pb-6 scroll-smooth no-scrollbar" id="service-list-container">
             <AnimatePresence mode="wait" custom={direction}>
                 {categories.map(cat => {
                     // Phân loại NGHIÊM NGẶT theo category id (cat)

diff --git a/src/components/Menu/Standard/Sheets/CartDrawer.tsx b/src/components/Menu/Standard/Sheets/CartDrawer.tsx
index bc9720a..b79ce68 100644
--- a/src/components/Menu/Standard/Sheets/CartDrawer.tsx
+++ b/src/components/Menu/Standard/Sheets/CartDrawer.tsx
@@ -23,7 +23,7 @@ interface CartDrawerProps {
 const CONFIG = {
     ANIMATION_DURATION: 300,
     BORDER_RADIUS: '30px',
-    MAX_HEIGHT: '85vh',
+    MAX_HEIGHT: 'calc(100dvh - 1rem)',
     OVERLAY_COLOR: 'bg-black/60',
     BG_COLOR: 'bg-[#0d0d0d]',
     FOOTER_BG: 'bg-[#1c1c1e]',
@@ -356,7 +356,7 @@ export default function CartDrawer({ cart, services, lang, isOpen, onClose, onUp
 
             {/* Drawer Container */}
             <div className={`
-                fixed bottom-0 left-0 w-full ${CONFIG.BG_COLOR} rounded-t-[${CONFIG.BORDER_RADIUS}] z-50 overflow-hidden flex flex-col shadow-2xl
+                responsive-sheet fixed bottom-0 left-0 w-full ${CONFIG.BG_COLOR} rounded-t-[${CONFIG.BORDER_RADIUS}] z-50 flex flex-col shadow-2xl
                 transform transition-transform duration-${CONFIG.ANIMATION_DURATION} ease-out pb-safe
                 ${(isClosing || !isVisible) ? 'translate-y-full' : 'translate-y-0'}
             `} style={{ maxHeight: CONFIG.MAX_HEIGHT }}>

diff --git a/src/components/Menu/Standard/Sheets/MainSheet.tsx b/src/components/Menu/Standard/Sheets/MainSheet.tsx
index e509f3d..d0fa409 100644
--- a/src/components/Menu/Standard/Sheets/MainSheet.tsx
+++ b/src/components/Menu/Standard/Sheets/MainSheet.tsx
@@ -34,8 +34,8 @@ interface MainSheetProps {
 const CONFIG = {
     ANIMATION_DURATION: 300,
     BORDER_RADIUS: '30px',
-    MAX_HEIGHT: '85vh',
-    HEADER_IMAGE_HEIGHT: '18rem', // h-72 = 18rem = 288px
+    MAX_HEIGHT: 'calc(100dvh - 1rem)',
+    HEADER_IMAGE_HEIGHT: 'min(18rem, 25dvh)',
     OVERLAY_COLOR: 'bg-black/60',
     BG_COLOR: 'bg-[#0d0d0d]',
     // Time slot button stagger
@@ -210,7 +210,7 @@ export default function MainSheet({ group, cart, cartItems = [], isOpen, lang, o
             <div className={`fixed inset-0 ${CONFIG.OVERLAY_COLOR} z-40 transition-opacity duration-${CONFIG.ANIMATION_DURATION} ${isClosing ? 'opacity-0' : 'opacity-100'}`} onClick={handleClose} />
 
             <div className={`
-          fixed bottom-0 left-0 w-full ${CONFIG.BG_COLOR} rounded-t-[${CONFIG.BORDER_RADIUS}] z-50 overflow-hidden flex flex-col shadow-2xl
+          responsive-sheet fixed bottom-0 left-0 w-full ${CONFIG.BG_COLOR} rounded-t-[${CONFIG.BORDER_RADIUS}] z-50 flex flex-col shadow-2xl
           transform transition-transform 
           duration-${CONFIG.ANIMATION_DURATION}
           ease-out

diff --git a/src/components/Menu/Standard/Sheets/ReviewSheet.tsx b/src/components/Menu/Standard/Sheets/ReviewSheet.tsx
index a77beef..a03dd8a 100644
--- a/src/components/Menu/Standard/Sheets/ReviewSheet.tsx
+++ b/src/components/Menu/Standard/Sheets/ReviewSheet.tsx
@@ -66,7 +66,7 @@ export default function ReviewSheet({ service, cart, isOpen, lang, onClose, onUp
             {/* 2. Nội dung bảng (Sheet Content) */}
             <div
                 className={`
-          fixed bottom-0 left-0 w-full bg-[#0d0d0d] rounded-t-[30px] z-50 overflow-hidden flex flex-col shadow-2xl
+          responsive-sheet fixed bottom-0 left-0 w-full bg-[#0d0d0d] rounded-t-[30px] z-50 shadow-2xl
           transform transition-transform duration-300 ease-out pb-safe
           ${isClosing ? 'translate-y-full' : 'translate-y-0'}
         `}
@@ -164,4 +164,4 @@ export default function ReviewSheet({ service, cart, isOpen, lang, onClose, onUp
             </div>
         </>
     );
-}
\ No newline at end of file
+}

diff --git a/src/components/Menu/Standard/index.tsx b/src/components/Menu/Standard/index.tsx
index 8587215..82282bb 100644
--- a/src/components/Menu/Standard/index.tsx
+++ b/src/components/Menu/Standard/index.tsx
@@ -497,14 +497,14 @@ export default function StandardMenu({ lang, menuType = 'standard', onBack, onCh
 
                     {/* B. LIST (Chỉ truyền category đã lọc) */}
                     {contextLoading ? (
-                        <div className="flex-1 px-4 pt-4 flex flex-col gap-4 overflow-y-auto no-scrollbar">
+                        <div className="flex-1 min-h-0 min-w-0 px-4 pt-4 flex flex-col gap-4 overflow-y-auto no-scrollbar">
                             {/* Loading Skeleton */}
                             {[1, 2, 3, 4].map(i => (
                                 <div key={i} className="w-full h-[120px] bg-white/5 rounded-3xl animate-pulse"></div>
                             ))}
                         </div>
                     ) : contextError || (services.length === 0 && !contextLoading) ? (
-                        <div className="flex-1 px-4 flex flex-col items-center justify-center text-center gap-4 overflow-y-auto pb-40">
+                        <div className="flex-1 min-h-0 min-w-0 px-4 flex flex-col items-center text-center gap-4 overflow-y-auto pb-40">
                             <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500/80 mb-2">
                                 <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />

diff --git a/src/components/Menu/Therapy/BookingConfig/index.tsx b/src/components/Menu/Therapy/BookingConfig/index.tsx
index 9405516..f975fa4 100644
--- a/src/components/Menu/Therapy/BookingConfig/index.tsx
+++ b/src/components/Menu/Therapy/BookingConfig/index.tsx
@@ -458,10 +458,10 @@ const BookingConfig = ({ lang, isBookingFlow, selectedStaffIds, selectedStaffInf
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: 80 }}
             transition={{ type: 'spring', stiffness: 400, damping: 30 }}
-            className="fixed inset-x-0 bottom-0 z-50 border-t border-white/8 bg-gradient-to-t from-[#101012] via-[#101012]/96 to-[#101012]/82 px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-8 shadow-[0_-24px_45px_rgba(0,0,0,0.72)] backdrop-blur-2xl"
+            className="short-screen-flow fixed inset-x-0 bottom-0 z-50 border-t border-white/8 bg-gradient-to-t from-[#101012] via-[#101012]/96 to-[#101012]/82 px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-8 shadow-[0_-24px_45px_rgba(0,0,0,0.72)] backdrop-blur-2xl"
           >
             <div className="mx-auto w-full lg:w-[500px]">
-              <div className="flex justify-between items-end mb-2 px-1">
+              <div className="flex flex-wrap gap-3 justify-between items-end mb-2 px-1">
                 <div>
                   <div className="text-[10px] text-[#998f81] uppercase tracking-wider">{t.bc_selected}</div>
                   <div className="text-lg font-bold text-[#e4e2e4]">{effectiveDuration} {t.bc_mins}</div>
@@ -494,7 +494,7 @@ const BookingConfig = ({ lang, isBookingFlow, selectedStaffIds, selectedStaffInf
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
-              className="bg-[#131315] border border-[#e6c487]/30 rounded-3xl p-5 w-full max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
+              className="responsive-panel bg-[#131315] border border-[#e6c487]/30 rounded-3xl p-5 w-full max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
             >
               {/* Header */}
               <div className="flex justify-between items-center mb-4">
@@ -561,7 +561,7 @@ const BookingConfig = ({ lang, isBookingFlow, selectedStaffIds, selectedStaffInf
                         setSelectedSlot(null);
                         setShowCalendar(false);
                       }}
-                      className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs transition-all ${
+                      className={`min-h-9 w-full rounded-xl flex items-center justify-center text-xs transition-all ${
                         isSelected
                           ? 'bg-[#e6c487] text-[#412d00] font-bold'
                           : disabled
@@ -598,7 +598,7 @@ const BookingConfig = ({ lang, isBookingFlow, selectedStaffIds, selectedStaffInf
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 20 }}
-              className="bg-[#131315] border border-[#e6c487]/30 rounded-3xl p-6 w-full max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col max-h-[80vh]"
+              className="bg-[#131315] border border-[#e6c487]/30 rounded-3xl p-6 w-full max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col max-h-[80dvh]"
             >
               <div className="flex justify-between items-center mb-5 pb-4 border-b border-[#4d463a]/30">
                 <h4 className="font-sans not-italic text-xl text-[#e6c487]">

diff --git a/src/components/Menu/Therapy/SkillBuilder/index.tsx b/src/components/Menu/Therapy/SkillBuilder/index.tsx
index f5c83a1..3b31c9a 100644
--- a/src/components/Menu/Therapy/SkillBuilder/index.tsx
+++ b/src/components/Menu/Therapy/SkillBuilder/index.tsx
@@ -106,9 +106,9 @@ export default function SkillBuilder({ lang, selectedStaffIds, onConfirmSkills }
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: 100 }}
             transition={{ type: 'spring', stiffness: 300, damping: 30 }}
-            className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d] to-transparent pt-12"
+            className="relative p-4 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d] to-transparent pt-12"
           >
-            <div className="flex justify-between items-end mb-4 px-2">
+            <div className="flex flex-wrap gap-3 justify-between items-end mb-4 px-2">
               <div>
                 <div className="text-gray-400 text-sm">{isVi ? 'Thời gian phục vụ' : 'Total Duration'}</div>
                 <div className="text-2xl font-light text-white">{totalDuration} {isVi ? 'phút' : 'mins'}</div>

diff --git a/src/components/Menu/Therapy/TimeSlotPicker/index.tsx b/src/components/Menu/Therapy/TimeSlotPicker/index.tsx
index 090a8e1..0635a85 100644
--- a/src/components/Menu/Therapy/TimeSlotPicker/index.tsx
+++ b/src/components/Menu/Therapy/TimeSlotPicker/index.tsx
@@ -104,7 +104,7 @@ export default function TimeSlotPicker({ lang, totalDuration, onConfirm }: TimeS
           <motion.div
             initial={{ opacity: 0, y: 100 }}
             animate={{ opacity: 1, y: 0 }}
-            className="absolute bottom-4 left-4 right-4"
+            className="relative mt-6 mb-4"
           >
             <button
               onClick={onConfirm}

diff --git a/src/components/Menu/Therapy/VipCartStep/index.tsx b/src/components/Menu/Therapy/VipCartStep/index.tsx
index b48d8af..6502057 100644
--- a/src/components/Menu/Therapy/VipCartStep/index.tsx
+++ b/src/components/Menu/Therapy/VipCartStep/index.tsx
@@ -251,8 +251,8 @@ const VipCartStep = ({
             {/* ── Sheet Container ───────────────────── */}
             <div
                 className={`
-                    fixed bottom-0 left-0 w-full bg-[#0d0d0d] rounded-t-[30px] z-[100]
-                    overflow-hidden flex flex-col shadow-2xl
+                    responsive-sheet fixed bottom-0 left-0 w-full bg-[#0d0d0d] rounded-t-[30px] z-[100]
+                    flex flex-col shadow-2xl
                     transform transition-transform duration-${ANIMATION_DURATION} ease-out
                     ${(isClosing || !isVisible) ? 'translate-y-full' : 'translate-y-0'}
                 `}

diff --git a/src/components/Menu/Therapy/index.tsx b/src/components/Menu/Therapy/index.tsx
index 6d07749..a1ffd3d 100644
--- a/src/components/Menu/Therapy/index.tsx
+++ b/src/components/Menu/Therapy/index.tsx
@@ -169,7 +169,7 @@ const TherapyMenu = ({ lang, isBookingFlow, onBack, onCheckout, onSwitchToStanda
     };
 
     return (
-        <div className="w-full h-full bg-[#131315] text-[#e4e2e4] flex flex-col relative overflow-hidden">
+        <div className="w-full h-full min-h-0 min-w-0 bg-[#131315] text-[#e4e2e4] flex flex-col relative overflow-hidden">
             {/* Progress Bar */}
             <div className="absolute top-0 left-0 h-[2px] bg-[#1b1b1d] w-full z-30">
                 <motion.div
@@ -181,8 +181,8 @@ const TherapyMenu = ({ lang, isBookingFlow, onBack, onCheckout, onSwitchToStanda
             </div>
 
             {/* Header */}
-            <header className="sticky top-0 z-20 bg-[#0e0e10]/80 backdrop-blur-xl shadow-[0_0_40px_rgba(201,169,110,0.04)]">
-                <div className="flex justify-between items-center px-6 py-3.5">
+            <header className="shrink-0 z-20 bg-[#0e0e10]/80 backdrop-blur-xl shadow-[0_0_40px_rgba(201,169,110,0.04)]">
+                <div className="flex justify-between items-center gap-2 px-3 sm:px-6 py-3.5">
                     <button
                         onClick={handleBack}
                         className="text-[#e6c487] p-1 hover:bg-white/5 rounded-full transition-colors"
@@ -192,12 +192,12 @@ const TherapyMenu = ({ lang, isBookingFlow, onBack, onCheckout, onSwitchToStanda
                         </svg>
                     </button>
 
-                    <h1 className="premium-therapist-display-font text-lg tracking-[0.2em] text-[#e6c487]">
+                    <h1 className="premium-therapist-display-font flex-1 text-sm sm:text-lg tracking-wide sm:tracking-[0.2em] text-[#e6c487]">
                         {getStepTitle()}
                     </h1>
 
                     {/* Right: Cart badge hoặc Switch to Standard */}
-                    <div className="flex items-center gap-2">
+                    <div className="flex items-center gap-2 shrink-0">
                         {/* Cart badge — hiển thị khi có gói đã đặt */}
                         {vipGroupCount > 0 && (
                             <button
@@ -226,7 +226,7 @@ const TherapyMenu = ({ lang, isBookingFlow, onBack, onCheckout, onSwitchToStanda
             </header>
 
             {/* Main Content */}
-            <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
+            <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden w-full">
                 <div className="w-full lg:max-w-5xl lg:mx-auto lg:px-8 pb-32">
                     <AnimatePresence mode="wait">
                         {/* STAFF STEP */}

diff --git a/src/components/MenuTypeSelector/style.module.css b/src/components/MenuTypeSelector/style.module.css
index 8fe5c96..07b3ad0 100644
--- a/src/components/MenuTypeSelector/style.module.css
+++ b/src/components/MenuTypeSelector/style.module.css
@@ -4,7 +4,7 @@
   align-items: center;
   justify-content: center;
   width: 100%;
-  height: 100%;
+  min-height: 100%;
   padding: 1rem;
   padding-top: calc(env(safe-area-inset-top, 0px) + 1rem);
   padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 1rem);
@@ -12,9 +12,9 @@
 
 .grid {
   display: grid;
-  grid-template-columns: repeat(2, 1fr);
+  grid-template-columns: repeat(2, minmax(0, 1fr));
   gap: 16px;
-  width: min(100vw - 32px, 600px);
+  width: min(100%, 600px);
   margin: 0 auto;
 }
 

diff --git a/src/components/ServiceRoom/ServiceCountdownGauge.tsx b/src/components/ServiceRoom/ServiceCountdownGauge.tsx
index af15c5a..624cf48 100644
--- a/src/components/ServiceRoom/ServiceCountdownGauge.tsx
+++ b/src/components/ServiceRoom/ServiceCountdownGauge.tsx
@@ -32,12 +32,12 @@ export const ServiceCountdownGauge = ({ startTimeISO, durationMinutes, lang = 'v
     return (
         <div className="flex flex-col items-center gap-6 p-6 animate-fade-in-up">
             {/* Vòng cung Gauge */}
-            <div className="relative flex justify-center items-center" style={{ width: GAUGE_SIZE, height: GAUGE_SIZE }}>
+            <div className="relative flex justify-center items-center aspect-square max-w-full" style={{ width: GAUGE_SIZE }}>
                 <svg
                     width={GAUGE_SIZE}
                     height={GAUGE_SIZE}
                     viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE}`}
-                    className="absolute transform rotate-[135deg]"
+                    className="absolute w-full h-full transform rotate-[135deg]"
                 >
                     {/* Background Track */}
                     <circle

diff --git a/src/components/Shared/AlertModal.tsx b/src/components/Shared/AlertModal.tsx
index b79260b..145ad0b 100644
--- a/src/components/Shared/AlertModal.tsx
+++ b/src/components/Shared/AlertModal.tsx
@@ -62,8 +62,8 @@ export default function AlertModal({ isOpen, title, message, type = 'error', onC
 
     return (
         <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
-            <div className="bg-[#1c1c1e] w-full max-w-sm rounded-[32px] p-6 shadow-2xl border border-white/5 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
-                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${iconColors}`}>
+            <div role="alertdialog" aria-modal="true" aria-label={title || defaultTitle} className="responsive-panel bg-[#1c1c1e] w-full max-w-sm rounded-[32px] p-6 shadow-2xl border border-white/5 text-center animate-in zoom-in-95 duration-200">
+                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${iconColors}`}>
                     {icon}
                 </div>
                 <h3 className="text-xl font-bold text-white mb-2">{title || defaultTitle}</h3>

diff --git a/src/components/Translator/FloatingTranslator.tsx b/src/components/Translator/FloatingTranslator.tsx
index 7aa58f3..557196b 100644
--- a/src/components/Translator/FloatingTranslator.tsx
+++ b/src/components/Translator/FloatingTranslator.tsx
@@ -362,7 +362,7 @@ export default function FloatingTranslator() {
                         className={`fixed z-[9999] bg-[#121214]/98 border border-[#e6c487]/30 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-white overflow-hidden flex flex-col transition-all duration-300 ${
                             isExpanded
                                 ? 'inset-3 sm:inset-6 rounded-3xl'
-                                : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-32px)] sm:w-[460px] h-[640px] max-h-[90vh] rounded-3xl'
+                                : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw_-_32px)] sm:w-[460px] h-[640px] max-h-[calc(100dvh_-_3rem)] rounded-3xl'
                         }`}
                     >
                         {/* HEADER */}

diff --git a/src/components/invoice/PrintableInvoice.module.css b/src/components/invoice/PrintableInvoice.module.css
index 067683d..e36d483 100644
--- a/src/components/invoice/PrintableInvoice.module.css
+++ b/src/components/invoice/PrintableInvoice.module.css
@@ -98,7 +98,8 @@
 
 .row {
   display: grid;
-  grid-template-columns: 135px 1fr;
+  grid-template-columns: 135px minmax(0, 1fr);
+  overflow-wrap: anywhere;
   gap: 12px;
   padding: 4px 0;
   font-size: 14px;
@@ -123,6 +124,8 @@
   font-size: 14px;
 }
 
+.tableScroll { overflow-x: auto; }
+
 .invoiceTable th {
   text-align: left;
   font-size: 11px;
@@ -271,13 +274,15 @@
   .header { flex-direction: column; }
   .invoiceTitle { text-align: left; }
   .grid, .payment { grid-template-columns: 1fr; }
-  .row { grid-template-columns: 105px 1fr; }
-  .invoiceTable th:nth-child(5), .invoiceTable td:nth-child(5) { display: none; }
+  .row { grid-template-columns: 90px minmax(0, 1fr); }
+  .invoiceTable { min-width: 620px; }
   .page { width: min(100% - 16px, 920px); border-radius: 0; }
   .footer { flex-direction: column; }
 }
 
 @media print {
+  .tableScroll { overflow: visible; }
+  .invoiceTable { min-width: 0; }
 
   .invoiceContainer {
     background: #fff;

diff --git a/src/components/invoice/PrintableInvoice.tsx b/src/components/invoice/PrintableInvoice.tsx
index 0db7e4a..decabd6 100644
--- a/src/components/invoice/PrintableInvoice.tsx
+++ b/src/components/invoice/PrintableInvoice.tsx
@@ -364,6 +364,7 @@ export const PrintableInvoice = ({ config, bookingData, lang = 'vi' }: Printable
                     <div className={styles.customerDivider}></div>
 
                     <div className={styles.sectionTitle}>{t.serviceDetails}</div>
+                    <div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Invoice services">
                     <table className={styles.invoiceTable}>
                         <thead>
                             <tr>
@@ -417,6 +418,7 @@ export const PrintableInvoice = ({ config, bookingData, lang = 'vi' }: Printable
                             )}
                         </tbody>
                     </table>
+                    </div>
 
                     <div className={styles.totals}>
                         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', paddingTop: '10px' }}>
@@ -488,4 +490,3 @@ export const PrintableInvoice = ({ config, bookingData, lang = 'vi' }: Printable
         </div>
     );
 };
-

diff --git a/src/lib/deepBody.constants.ts b/src/lib/deepBody.constants.ts
index 5a3cb9b..53bc416 100644
--- a/src/lib/deepBody.constants.ts
+++ b/src/lib/deepBody.constants.ts
@@ -199,11 +199,11 @@ export const DEEP_BODY_TECHNIQUES: DeepBodyTechnique[] = [
   {
     id: 'mixofourtherapies',
     name: {
-      vi: '4 liệu trình (Ấn huyệt, Thái, Dầu & Đá Nóng)',
-      en: 'Mix of Four Therapies (Acupressure, Thai, Oil & Hot Stone)',
-      cn: '四重综合疗程（指压、泰式、精油与热石）',
-      jp: '4種融合トリートメント（指圧・タイ式・オイル・ホットストーン）',
-      kr: '4가지 복합 테라피 (지압, 타이, 오일 & 핫스톤)',
+      vi: 'Mix',
+      en: 'Mix',
+      cn: 'Mix',
+      jp: 'Mix',
+      kr: 'Mix',
     },
     shortDesc: {
       vi: 'Sự kết hợp tinh hoa giữa Tinh Dầu Dừa, Bấm Huyệt Thái, Shiatsu và Đá Nóng Bazan giúp phục hồi toàn diện.',

diff --git a/tsconfig.json b/tsconfig.json
index 77d934b..e6737f7 100644
--- a/tsconfig.json
+++ b/tsconfig.json
@@ -26,7 +26,7 @@
     ],
     "paths": {
       "@/*": [
-        "./src/*",
+        "./src/*"
       ]
     }
   },
@@ -37,10 +37,12 @@
     ".next/types/**/*.ts",
     "src/**/*.ts",
     "src/**/*.tsx",
-    ".next/dev/types/**/*.ts"
+    ".next/dev/types/**/*.ts",
+    ".next-responsive/types/**/*.ts",
+    ".next-responsive/dev/types/**/*.ts"
   ],
   "exclude": [
     "node_modules",
     "wrb-noi-bo-dev"
   ]
-}
\ No newline at end of file
+}
```

