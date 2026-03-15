/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";

// ─── RTO Risk Estimator (Creative: auto-generates seller context) ───
function estimateRTORisk(category: string): string {
    const riskMap: Record<string, string> = {
        electronics: "18% — Moderate (size/fragility issues)",
        fashion: "28% — High (sizing returns common)",
        beauty: "12% — Low (consumable, fewer returns)",
        home: "22% — Moderate (delivery damage risk)",
        jewellery: "15% — Low-Moderate (high-value, careful handling)",
        food: "8% — Very Low (perishable, non-returnable)",
        other: "20% — Average",
    };
    return riskMap[category] || riskMap.other;
}

// POST /api/meetings — Schedule a new meeting
export async function POST(req: NextRequest) {
    try {
        const payload = await getPayload({ config });
        const body = await req.json();
        const {
            name, brand, email, phone, category,
            date, time, duration,
            preMeetingNotes, meetingAgenda,
            createdByAdmin,
        } = body;

        if (!name || !email || !date || !time) {
            return NextResponse.json(
                { error: "Name, email, date and time are required." },
                { status: 400 }
            );
        }

        // Auto-generate seller context brief
        const sellerProfile = {
            riskScore: estimateRTORisk(category || "other"),
            estimatedVolume: "",
            notes: `Category: ${category || "Not specified"}. Brand: ${brand || "Not specified"}.`,
        };

        const meeting = await payload.create({
            collection: "meetings" as any,
            data: {
                name,
                brand: brand || "",
                email,
                phone: phone || "",
                category: category || undefined,
                date,
                time,
                duration: duration || 15,
                status: createdByAdmin ? "scheduled" : "unconfirmed",
                createdByAdmin: createdByAdmin || false,
                preMeetingNotes: preMeetingNotes || "",
                meetingAgenda: meetingAgenda || "",
                sellerProfile,
            },
        });

        console.log("📅 Stond Meet Scheduled:", meeting.id);

        return NextResponse.json({ success: true, meeting });
    } catch (error) {
        console.error("Meeting scheduling error:", error);
        return NextResponse.json(
            { error: "Failed to schedule meeting." },
            { status: 500 }
        );
    }
}

// GET /api/meetings — Fetch meetings
export async function GET(req: NextRequest) {
    try {
        const payload = await getPayload({ config });
        const { user } = await payload.auth({ headers: req.headers });

        if (!user) {
            return NextResponse.json(
                { error: "Authentication required." },
                { status: 401 }
            );
        }

        const isAdmin = (user as any).role === "admin";
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");

        // Build query
        const where: any = {};
        if (!isAdmin) {
            where.email = { equals: (user as any).email };
        }
        if (status && status !== "all") {
            where.status = { equals: status };
        }

        const result = await payload.find({
            collection: "meetings" as any,
            where,
            sort: "-date",
            page,
            limit,
            depth: 0,
        });

        return NextResponse.json({
            meetings: result.docs,
            totalDocs: result.totalDocs,
            totalPages: result.totalPages,
            page: result.page,
        });
    } catch (error) {
        console.error("Meetings fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch meetings." },
            { status: 500 }
        );
    }
}

// PATCH /api/meetings — Update meeting (admin or owner for reschedule)
export async function PATCH(req: NextRequest) {
    try {
        const payload = await getPayload({ config });
        const { user } = await payload.auth({ headers: req.headers });

        if (!user) {
            return NextResponse.json(
                { error: "Authentication required." },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { meetingId, ...updates } = body;

        if (!meetingId) {
            return NextResponse.json(
                { error: "Meeting ID is required." },
                { status: 400 }
            );
        }

        const isAdmin = (user as any).role === "admin";

        // Non-admin: verify ownership and restrict to reschedule/cancel only
        if (!isAdmin) {
            const meeting = await payload.findByID({
                collection: "meetings" as any,
                id: meetingId,
            });
            if ((meeting as any).email !== (user as any).email) {
                return NextResponse.json(
                    { error: "You can only modify your own meetings." },
                    { status: 403 }
                );
            }
            // Users can only reschedule (date + time) or cancel
            const allowed: Record<string, boolean> = { date: true, time: true, status: true };
            const safeUpdates: any = {};
            for (const key of Object.keys(updates)) {
                if (allowed[key]) safeUpdates[key] = updates[key];
            }
            // Only allow cancel or rescheduled status from user
            if (safeUpdates.status && !["cancelled", "rescheduled"].includes(safeUpdates.status)) {
                delete safeUpdates.status;
            }
            const updated = await payload.update({
                collection: "meetings" as any,
                id: meetingId,
                data: safeUpdates,
            });
            return NextResponse.json({ success: true, meeting: updated });
        }

        const updated = await payload.update({
            collection: "meetings" as any,
            id: meetingId,
            data: updates,
        });

        return NextResponse.json({ success: true, meeting: updated });
    } catch (error) {
        console.error("Meeting update error:", error);
        return NextResponse.json(
            { error: "Failed to update meeting." },
            { status: 500 }
        );
    }
}

// DELETE /api/meetings — Cancel/delete a meeting (admin only)
export async function DELETE(req: NextRequest) {
    try {
        const payload = await getPayload({ config });
        const { user } = await payload.auth({ headers: req.headers });

        if (!user || (user as any).role !== "admin") {
            return NextResponse.json(
                { error: "Admin access required." },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(req.url);
        const meetingId = searchParams.get("id");

        if (!meetingId) {
            return NextResponse.json(
                { error: "Meeting ID is required." },
                { status: 400 }
            );
        }

        await payload.delete({
            collection: "meetings" as any,
            id: meetingId,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Meeting delete error:", error);
        return NextResponse.json(
            { error: "Failed to delete meeting." },
            { status: 500 }
        );
    }
}
