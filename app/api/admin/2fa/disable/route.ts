/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";
import { authenticator } from "@otplib/preset-default";

// POST /api/admin/2fa/disable — Verify TOTP and Disable 2FA
export async function POST(req: NextRequest) {
    try {
        const payload = await getPayload({ config });
        const { user } = await payload.auth({ headers: req.headers });

        if (!user || (user as any).role !== "admin") {
            return NextResponse.json({ error: "Admin access required." }, { status: 403 });
        }

        const { token } = await req.json();
        const secret = (user as any).twoFactorSecret;

        if (!secret) {
            return NextResponse.json(
                { error: "2FA is not enabled on this account." },
                { status: 400 }
            );
        }

        // Verify token (mandatory fresh check)
        const isValid = authenticator.verify({ token, secret });

        if (!isValid) {
            console.warn(`[AUDIT] ❌ Failed 2FA disable attempt by ${user.email}`);
            return NextResponse.json(
                { verified: false, error: "Invalid authenticator code. 2FA remains active." },
                { status: 401 }
            );
        }

        // Disable 2FA
        await payload.update({
            collection: "users",
            id: user.id,
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
                lastStepUpAt: null,
            } as any,
        });

        console.log(`[AUDIT] 🛡️ 2FA disabled for ${user.email}`);

        // Optional: Send security email notification here

        return NextResponse.json({ success: true, message: "2FA has been disabled." });
    } catch (error) {
        console.error("2FA disable error:", error);
        return NextResponse.json({ error: "Failed to disable 2FA." }, { status: 500 });
    }
}
