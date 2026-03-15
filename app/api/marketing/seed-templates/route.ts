/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
    try {
        const payload = await getPayload({ config });
        const templatesDir = path.join(process.cwd(), 'email-templates');

        if (!fs.existsSync(templatesDir)) {
            return new NextResponse('Templates directory not found', { status: 404 });
        }

        const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.html'));
        const seeded = [];

        for (const file of files) {
            const content = fs.readFileSync(path.join(templatesDir, file), 'utf-8');
            const name = file.replace('.html', '').split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

            // Check if exists
            const existing = await payload.find({
                collection: 'email-templates' as any,
                where: {
                    name: { equals: name }
                }
            });

            if (existing.docs.length === 0) {
                const doc = await payload.create({
                    collection: 'email-templates' as any,
                    data: {
                        name,
                        subject: `Intro: ${name}`,
                        body: content
                    }
                });
                seeded.push(name);
            }
        }

        return NextResponse.json({ message: 'Seeding complete', seeded });
    } catch (e: any) {
        console.error('Seed error:', e);
        return new NextResponse(e.message, { status: 500 });
    }
}
