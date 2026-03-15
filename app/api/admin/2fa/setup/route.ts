/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";
import { authenticator } from "@otplib/preset-default";
import * as QRCode from "qrcode";

// POST /api/admin/2fa/setup — Generate TOTP secret + QR code for admin
export async function POST(req: NextRequest) {
    try {
        const payload = await getPayload({ config });
        const { user } = await payload.auth({ headers: req.headers });

        if (!user || (user as any).role !== "admin") {
            return NextResponse.json({ error: "Admin access required." }, { status: 403 });
        }

        // Check if already enabled
        if ((user as any).twoFactorEnabled) {
            return NextResponse.json(
                { error: "2FA is already enabled. Disable it first to reconfigure." },
                { status: 400 }
            );
        }

        // Generate secret
        const secret = authenticator.generateSecret();
        const otpauthUrl = authenticator.keyuri(
            user.email,
            "Stond Admin",
            secret
        );

        // Generate QR code as data URL
        const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

        // Store secret temporarily (not yet enabled)
        await payload.update({
            collection: "users",
            id: user.id,
            data: { twoFactorSecret: secret } as any,
        });

        return NextResponse.json({
            secret,        // Show to admin for manual entry
            qrDataUrl,     // For scanning with Google Authenticator
            otpauthUrl,
        });
    } catch (error) {
        console.error("2FA setup error:", error);
        return NextResponse.json({ error: "Failed to setup 2FA." }, { status: 500 });
    }
}
