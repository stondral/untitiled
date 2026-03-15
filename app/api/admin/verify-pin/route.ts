/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";

// POST /api/admin/verify-pin — Verify admin secure PIN
export async function POST(req: NextRequest) {
    try {
        const payload = await getPayload({ config });
        const { user } = await payload.auth({ headers: req.headers });

        if (!user || (user as any).role !== "admin") {
            return NextResponse.json({ error: "Admin access required." }, { status: 403 });
        }

        const { pin } = await req.json();
        const expectedPin = process.env.ADMIN_SECURE_PIN;

        if (!expectedPin) {
            return NextResponse.json({ error: "PIN not configured on server." }, { status: 500 });
        }

        if (pin !== expectedPin) {
            return NextResponse.json({ verified: false, error: "Incorrect PIN." }, { status: 401 });
        }

        return NextResponse.json({ verified: true });
    } catch (error) {
        console.error("PIN verification error:", error);
        return NextResponse.json({ error: "Verification failed." }, { status: 500 });
    }
}
