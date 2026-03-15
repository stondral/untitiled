import nodemailer from 'nodemailer';

export async function sendMarketingEmail({
    to,
    subject,
    html,
    logId,
    lead,
}: {
    to: string;
    subject: string;
    html: string;
    logId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lead?: any;
}) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: process.env.SMTP_USER_MARKETING,
            pass: process.env.SMTP_USER_MARKETING_PASSWORD,
        },
    });

    // Variable replacement
    let finalHtml = html;
    let finalSubject = subject;

    if (lead) {
        finalHtml = finalHtml.replace(/{name}/g, lead.name || "").replace(/{company}/g, lead.company || "");
        finalSubject = finalSubject.replace(/{name}/g, lead.name || "").replace(/{company}/g, lead.company || "");
    }

    const trackingPixel = `<img src="${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/marketing/track?type=open&logId=${logId}" width="1" height="1" style="display:none" />`;

    // Simple link wrapping logic
    const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"([^>]*)>/gi;
    finalHtml = finalHtml.replace(linkRegex, (match, url, rest) => {
        if (url.startsWith('http')) {
            const trackedUrl = `${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/marketing/track?type=click&logId=${logId}&url=${encodeURIComponent(url)}`;
            return `<a href="${trackedUrl}"${rest}>`;
        }
        return match;
    });

    const bodyWithPixel = `${finalHtml}${trackingPixel}`;

    return transporter.sendMail({
        from: `"Stond Marketing" <${process.env.SMTP_USER_MARKETING}>`,
        to,
        subject: finalSubject,
        html: bodyWithPixel,
    });
}
