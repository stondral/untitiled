/* eslint-disable @typescript-eslint/no-explicit-any */
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

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

export async function POST(req: Request) {
    try {
        const payload = await getPayload({ config: configPromise })
        const { leadId, templateId, customSubject, customBody } = await req.json()

        if (!leadId) {
            return NextResponse.json({ error: 'Missing leadId parameter' }, { status: 400 })
        }

        const lead = await payload.findByID({
            collection: 'leads' as any,
            id: leadId
        })

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
        }

        let subjectTemplate = customSubject
        let bodyTemplate = customBody

        if (templateId) {
            const template = await payload.findByID({
                collection: 'email-templates' as any,
                id: templateId
            })
            if (!template) {
                return NextResponse.json({ error: 'Template not found' }, { status: 404 })
            }
            subjectTemplate = template.subject
            bodyTemplate = template.body
        }

        if (!subjectTemplate || !bodyTemplate) {
             return NextResponse.json({ error: 'Missing subject or body template' }, { status: 400 })
        }

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

        const subject = renderTemplate(subjectTemplate, lead)
        const bodyHtml = renderTemplate(bodyTemplate, lead)

        // Log activity FIRST so we get a logId for tracking
        const log = await payload.create({
            collection: 'email-logs' as any,
            data: {
                lead: lead.id,
                sentAt: new Date().toISOString(),
                subject: subject || '(No Subject)',
                template: templateId || undefined,
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
                subject: subject || '(No Subject)',
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

        return NextResponse.json({ success: true, logId: log.id })
    } catch (e) {
        console.error('Send single email error:', e)
        return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
    }
}
