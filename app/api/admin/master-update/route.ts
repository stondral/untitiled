/* eslint-disable @typescript-eslint/no-explicit-any */
import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
    try {
        const payload = await getPayload({ config });
        const requestHeaders = await headers();
        const { user } = await payload.auth({ headers: requestHeaders });

        // Verify Admin Role
        if (!user || (user as any).role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized - Admin Access Required" }, { status: 401 });
        }

        const { collection, docId, data, operation = 'update' } = await req.json();

        if (!collection || (operation !== 'create' && !docId)) {
            return NextResponse.json({ error: "Collection and docId are required" }, { status: 400 });
        }

        // Allowed collections for master update
        const allowedCollections = ['users', 'sellers', 'discount-codes', 'reviews', 'warehouses', 'orders', 'feedback'];
        if (!allowedCollections.includes(collection)) {
            return NextResponse.json({ error: `Collection ${collection} is not manageable via master-update` }, { status: 403 });
        }

        logger.info({ adminId: user.id, collection, docId, operation }, "🛠️ Admin performing master update");

        let result;
        if (operation === 'create') {
            result = await payload.create({
                collection: collection as any,
                data: data,
                overrideAccess: true,
            });
        } else if (operation === 'update') {
            result = await payload.update({
                collection: collection as any,
                id: docId as string,
                data: data,
                overrideAccess: true,
            });
        } else if (operation === 'delete') {
            result = await payload.delete({
                collection: collection as any,
                id: docId as string,
                overrideAccess: true,
            });
        } else {
            return NextResponse.json({ error: "Unsupported operation" }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: `${collection} record ${operation === 'create' ? 'created' : operation + 'd'} successfully`,
            data: result
        });

    } catch (error: unknown) {
        logger.error({ err: error }, "Admin Master Update Error");
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
