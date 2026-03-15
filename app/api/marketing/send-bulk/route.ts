/* eslint-disable @typescript-eslint/no-explicit-any */
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: Request) {
    try {
        const payload = await getPayload({ config: configPromise })
        const { leadIds, templateId } = await req.json()

        if (!leadIds || !templateId) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
        }

        const template = await payload.findByID({
            collection: 'email-templates' as any,
            id: templateId
        })

        if (!template) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 })
        }

        const leads = await payload.find({
            collection: 'leads' as any,
            where: {
                id: { in: leadIds }
            }
        })

        // Use marketing SMTP credentials
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER_MARKETING || process.env.SMTP_USER,
                pass: process.env.SMTP_USER_MARKETING_PASSWORD || process.env.SMTP_PASS,
            },
        })

        const results = { sent: 0, failed: 0 }

        for (const lead of leads.docs) {
            try {
                const renderTemplate = (text: string | undefined | null, lead: any) => {
                    let rendered = text || "";
                    if (!rendered) return rendered;
                    const firstName = lead.name?.split(" ")[0] || "";
                    const greeting = firstName ? `Hi ${firstName}` : "Hi there";
                    rendered = rendered.replace(/Hi {Name}|Hello {Name}|Hey {Name}/gi, greeting);
                    rendered = rendered.replace(/{Name}/g, lead.name || "");
                    rendered = rendered.replace(/{Company}/g, lead.company || "your company");
                    rendered = rendered.replace(/{College}/g, lead.college || "your university");
                    rendered = rendered.replace(/{Industry}/g, lead.industry || "your industry");
                    rendered = rendered.replace(/{Personalization}/g, lead.personalization || "");
                    rendered = rendered.replace(/{Position}/g, lead.position || "your role");
                    return rendered;
                }

                const subject = renderTemplate(template.subject, lead)
                const bodyHtml = renderTemplate(template.body, lead)

                // Log activity FIRST so we get a logId for tracking
                const log = await payload.create({
                    collection: 'email-logs' as any,
                    data: {
                        lead: lead.id,
                        sentAt: new Date().toISOString(),
                        subject: subject || template.subject || '(No Subject)',
                        template: template.id,
                    }
                })

                // Inject tracking pixel for open detection
                const baseUrl = process.env.NEXT_PUBLIC_PAYLOAD_URL || 'http://localhost:3000'
                const trackingPixel = `<img src="${baseUrl}/api/marketing/track?type=open&logId=${log.id}" width="1" height="1" style="display:none" />`
                const htmlWithTracking = `${bodyHtml || ''}${trackingPixel}`

                // Attempt actual email send
                try {
                    await transporter.sendMail({
                        from: `"Stond Marketing" <${process.env.SMTP_USER_MARKETING || process.env.SMTP_USER}>`,
                        to: lead.email,
                        subject: subject || template.subject || '(No Subject)',
                        html: htmlWithTracking
                    })
                } catch (emailErr) {
                    console.error(`SMTP send failed for ${lead.email} (activity still logged):`, emailErr)
                }

                // Update lead: set lastEmailed and auto-transition status
                const updateData: any = { lastEmailed: new Date().toISOString() }
                if (lead.status === 'not_mailed' || lead.status === 'new') {
                    updateData.status = 'awaiting_reply'
                }
                await payload.update({
                    collection: 'leads' as any,
                    id: lead.id,
                    data: updateData,
                })

                results.sent++
            } catch (e) {
                console.error(`Failed to process lead ${lead.email}:`, e)
                results.failed++
            }
        }

        return NextResponse.json({ success: true, results })
    } catch (e) {
        console.error('Bulk send error:', e)
        return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
    }
}
