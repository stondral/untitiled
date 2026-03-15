/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";
import { authenticator } from "@otplib/preset-default";

// POST /api/admin/2fa/verify — Verify TOTP code and enable 2FA
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
                { error: "No 2FA setup found. Please run setup first." },
                { status: 400 }
            );
        }

        // Verify the TOTP token
        const isValid = authenticator.verify({ token, secret });

        if (!isValid) {
            return NextResponse.json(
                { verified: false, error: "Invalid authenticator code. Please try again." },
                { status: 401 }
            );
        }

        // Enable 2FA
        await payload.update({
            collection: "users",
            id: user.id,
            data: {
                twoFactorEnabled: true,
                lastStepUpAt: new Date().toISOString(),
            } as any,
        });

        return NextResponse.json({ verified: true, message: "2FA enabled successfully." });
    } catch (error) {
        console.error("2FA verify error:", error);
        return NextResponse.json({ error: "Verification failed." }, { status: 500 });
    }
}
