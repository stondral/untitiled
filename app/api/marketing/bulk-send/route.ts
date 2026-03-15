/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { sendMarketingEmail } from '@/lib/marketing-email';

export async function POST(req: NextRequest) {
    try {
        const { leadIds, templateId } = await req.json();

        if (!leadIds || !Array.isArray(leadIds) || !templateId) {
            return new NextResponse('Missing parameters', { status: 400 });
        }

        const payload = await getPayload({ config });

        // Fetch template
        const template = await payload.findByID({
            collection: 'email-templates' as any,
            id: templateId,
        });

        if (!template) {
            return new NextResponse('Template not found', { status: 404 });
        }

        const results = {
            sent: 0,
            failed: 0,
        };

        // Sending with a small delay to avoid rate limits
        for (const id of leadIds) {
            try {
                const lead = await payload.findByID({
                    collection: 'leads' as any,
                    id,
                });

                if (!lead) continue;

                // Create log entry first
                const log = await payload.create({
                    collection: 'email-logs' as any,
                    data: {
                        lead: id,
                        subject: template.subject,
                        template: template.name,
                        sentAt: new Date().toISOString(),
                    },
                });

                await sendMarketingEmail({
                    to: lead.email,
                    subject: template.subject,
                    html: template.body,
                    logId: log.id,
                    lead,
                });

                results.sent++;

                // Rate limiting: 200ms delay between emails (~5 per second)
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (e) {
                console.error(`Failed to send to lead ${id}:`, e);
                results.failed++;
            }
        }

        return NextResponse.json(results);
    } catch (e: any) {
        console.error('Bulk send error:', e);
        return new NextResponse(e.message || 'Internal Server Error', { status: 500 });
    }
}
