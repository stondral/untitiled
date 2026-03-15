/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";

// GET /api/meetings/availability — Fetch availability for a date range (public)
export async function GET(req: NextRequest) {
    try {
        const payload = await getPayload({ config });
        const { searchParams } = new URL(req.url);
        const month = searchParams.get("month"); // YYYY-MM format
        const date = searchParams.get("date"); // YYYY-MM-DD for single day

        const where: any = {};
        if (date) {
            where.date = { equals: date };
        } else if (month) {
            where.date = { like: `${month}%` };
        }

        const result = await payload.find({
            collection: "availability" as any,
            where,
            limit: 50,
            depth: 0,
        });

        return NextResponse.json({ availability: result.docs });
    } catch (error) {
        console.error("Availability fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch availability." },
            { status: 500 }
        );
    }
}

// POST /api/meetings/availability — Set availability for a day (admin only)
export async function POST(req: NextRequest) {
    try {
        const payload = await getPayload({ config });
        const { user } = await payload.auth({ headers: req.headers });

        if (!user || (user as any).role !== "admin") {
            return NextResponse.json(
                { error: "Admin access required." },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { date, isOpen, slots, note } = body;

        if (!date) {
            return NextResponse.json(
                { error: "Date is required." },
                { status: 400 }
            );
        }

        // Check if availability already exists for this date
        const existing = await payload.find({
            collection: "availability" as any,
            where: { date: { equals: date } },
            limit: 1,
        });

        let result;
        if (existing.docs.length > 0) {
            // Update existing
            result = await payload.update({
                collection: "availability" as any,
                id: existing.docs[0].id,
                data: {
                    isOpen: isOpen ?? true,
                    slots: slots || undefined,
                    note: note || undefined,
                },
            });
        } else {
            // Create new
            result = await payload.create({
                collection: "availability" as any,
                data: {
                    date,
                    isOpen: isOpen ?? true,
                    slots: slots || undefined,
                    note: note || undefined,
                },
            });
        }

        return NextResponse.json({ success: true, availability: result });
    } catch (error) {
        console.error("Availability update error:", error);
        return NextResponse.json(
            { error: "Failed to update availability." },
            { status: 500 }
        );
    }
}
