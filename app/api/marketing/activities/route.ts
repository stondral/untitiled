/* eslint-disable @typescript-eslint/no-explicit-any */
import { getPayload } from "payload";
import config from "@payload-config";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const payload = await getPayload({ config });
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get("leadId");

    if (!leadId) {
        return NextResponse.json({ error: "Lead ID required" }, { status: 400 });
    }

    try {
        // Fetch email logs and call logs
        const [emailLogs, callLogs] = await Promise.all([
            payload.find({
                collection: "email-logs" as any,
                where: {
                    lead: { equals: leadId }
                },
                sort: "-sentAt",
                limit: 50
            }),
            payload.find({
                collection: "call-logs" as any,
                where: {
                    lead: { equals: leadId }
                },
                sort: "-calledAt",
                limit: 50
            })
        ]);

        // Transform into unified activity format
        const activities: any[] = [];

        emailLogs.docs.forEach((log: any) => {
            // Email sent event
            activities.push({
                id: log.id,
                type: "email_sent",
                content: `Sent: ${log.subject}`,
                createdAt: log.sentAt
            });
            // Email opened event
            if (log.opened) {
                activities.push({
                    id: `${log.id}-opened`,
                    type: "email_opened",
                    content: `Opened: ${log.subject}`,
                    createdAt: log.updatedAt || log.sentAt
                });
            }
            // Email clicked event
            if (log.clicked) {
                activities.push({
                    id: `${log.id}-clicked`,
                    type: "email_clicked",
                    content: `Clicked a link in: ${log.subject}`,
                    createdAt: log.updatedAt || log.sentAt
                });
            }
        });

        callLogs.docs.forEach((log: any) => {
            activities.push({
                id: log.id,
                type: "call_logged",
                content: `Call: ${log.result?.replace(/_/g, ' ') || 'Logged'}`,
                createdAt: log.calledAt
            });
        });

        activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json({ docs: activities });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
    }
}
