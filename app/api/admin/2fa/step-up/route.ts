/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";
import { authenticator } from "@otplib/preset-default";

const STEP_UP_VALIDITY_MS = 5 * 60 * 1000; // 5 minutes

// GET /api/admin/2fa/step-up — Check if admin has valid elevated session
export async function GET(req: NextRequest) {
    try {
        const payload = await getPayload({ config });
        const { user } = await payload.auth({ headers: req.headers });

        if (!user || (user as any).role !== "admin") {
            return NextResponse.json({ error: "Admin access required." }, { status: 403 });
        }

        if (!(user as any).twoFactorEnabled) {
            return NextResponse.json({
                elevated: false,
                twoFactorEnabled: false,
                message: "2FA not set up. Please enable 2FA first.",
            });
        }

        const lastStepUp = (user as any).lastStepUpAt
            ? new Date((user as any).lastStepUpAt).getTime()
            : 0;
        const isElevated = Date.now() - lastStepUp < STEP_UP_VALIDITY_MS;

        return NextResponse.json({
            elevated: isElevated,
            twoFactorEnabled: true,
            expiresIn: isElevated ? Math.max(0, STEP_UP_VALIDITY_MS - (Date.now() - lastStepUp)) : 0,
        });
    } catch (error) {
        console.error("Step-up check error:", error);
        return NextResponse.json({ error: "Check failed." }, { status: 500 });
    }
}

// POST /api/admin/2fa/step-up — Verify TOTP for step-up elevation (5 min window)
export async function POST(req: NextRequest) {
    try {
        const payload = await getPayload({ config });
        const { user } = await payload.auth({ headers: req.headers });

        if (!user || (user as any).role !== "admin") {
            return NextResponse.json({ error: "Admin access required." }, { status: 403 });
        }

        if (!(user as any).twoFactorEnabled) {
            return NextResponse.json(
                { error: "2FA is not enabled. Set it up in Settings first." },
                { status: 400 }
            );
        }

        const { token, action, targetId } = await req.json();
        const secret = (user as any).twoFactorSecret;

        if (!secret) {
            return NextResponse.json(
                { error: "2FA secret not found." },
                { status: 400 }
            );
        }

        // Verify TOTP
        const isValid = authenticator.verify({ token, secret });

        if (!isValid) {
            // Audit log: failed attempt
            console.warn(
                `[AUDIT] ❌ Failed step-up attempt by ${user.email} for action: ${action || "unknown"} | target: ${targetId || "N/A"}`
            );
            return NextResponse.json(
                { verified: false, error: "Invalid authenticator code." },
                { status: 401 }
            );
        }

        // Update last step-up timestamp
        await payload.update({
            collection: "users",
            id: user.id,
            data: { lastStepUpAt: new Date().toISOString() } as any,
        });

        // Audit log: successful step-up
        console.log(
            `[AUDIT] ✅ Step-up verified for ${user.email} | action: ${action || "unknown"} | target: ${targetId || "N/A"}`
        );

        return NextResponse.json({
            verified: true,
            elevatedUntil: new Date(Date.now() + STEP_UP_VALIDITY_MS).toISOString(),
        });
    } catch (error) {
        console.error("Step-up verification error:", error);
        return NextResponse.json({ error: "Step-up verification failed." }, { status: 500 });
    }
}
