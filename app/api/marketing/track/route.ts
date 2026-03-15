/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const logId = searchParams.get('logId');
    const url = searchParams.get('url');

    if (!logId) return new NextResponse('Missing logId', { status: 400 });

    const payload = await getPayload({ config });

    if (type === 'open') {
        await payload.update({
            collection: 'email-logs' as any,
            id: logId,
            data: {
                opened: true,
            },
        });

        // Return a 1x1 transparent pixel
        const pixel = Buffer.from(
            'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
            'base64'
        );
        return new NextResponse(pixel, {
            headers: {
                'Content-Type': 'image/gif',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        });
    }

    if (type === 'click' && url) {
        await payload.update({
            collection: 'email-logs' as any,
            id: logId,
            data: {
                clicked: true,
            },
        });

        return NextResponse.redirect(url);
    }

    return new NextResponse('Invalid request', { status: 400 });
}
