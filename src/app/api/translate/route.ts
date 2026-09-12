import { NextRequest, NextResponse } from 'next/server';
import { translateText } from '@/lib/translationService';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            text,
            sourceLang,
            targetLang,
            conversationId,
            sender = 'customer',
            inputType = 'voice',
            speechDurationMs = 0,
        } = body;

        if (!text || typeof text !== 'string') {
            return NextResponse.json(
                { error: 'Field "text" is required' },
                { status: 400 }
            );
        }

        if (!sourceLang || !targetLang) {
            return NextResponse.json(
                { error: 'Fields "sourceLang" and "targetLang" are required' },
                { status: 400 }
            );
        }

        const result = await translateText({
            text,
            sourceLang,
            targetLang,
            conversationId,
            sender,
            inputType,
            speechDurationMs,
        });

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (err: any) {
        console.error('[API /api/translate] Translation error:', err);
        return NextResponse.json(
            { error: err.message || 'Internal translation server error' },
            { status: 500 }
        );
    }
}
