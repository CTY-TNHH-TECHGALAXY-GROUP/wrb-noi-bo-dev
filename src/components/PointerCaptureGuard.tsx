'use client';

import { useEffect } from 'react';

export default function PointerCaptureGuard() {
    useEffect(() => {
        if (typeof Element === 'undefined') return;

        const originalReleasePointerCapture = Element.prototype.releasePointerCapture;
        if (!originalReleasePointerCapture) return;

        Element.prototype.releasePointerCapture = function guardedReleasePointerCapture(pointerId: number) {
            if (typeof this.hasPointerCapture === 'function' && !this.hasPointerCapture(pointerId)) {
                return;
            }

            try {
                originalReleasePointerCapture.call(this, pointerId);
            } catch (error) {
                if (error instanceof DOMException && error.name === 'NotFoundError') {
                    return;
                }
                throw error;
            }
        };

        return () => {
            Element.prototype.releasePointerCapture = originalReleasePointerCapture;
        };
    }, []);

    return null;
}
