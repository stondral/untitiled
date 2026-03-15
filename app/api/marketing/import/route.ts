/* eslint-disable @typescript-eslint/no-explicit-any */
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const payload = await getPayload({ config: configPromise })
        const { leads } = await req.json()

        if (!Array.isArray(leads)) {
            return NextResponse.json({ error: 'Invalid leads format' }, { status: 400 })
        }

        const results = {
            created: 0,
            duplicates: 0,
            errors: 0,
            duplicateEmails: [] as string[]
        }

        const leadsToProcess = leads.filter((l: any) => l.email && l.name);

        for (const lead of leadsToProcess) {
            try {
                // 1. Email Validation
                const emailRegex = /\S+@\S+\.\S+/;
                if (!emailRegex.test(lead.email)) {
                    results.errors++;
                    continue;
                }

                // 2. Duplicate detection (Default: Skip)
                const existing = await payload.find({
                    collection: 'leads' as any,
                    where: {
                        email: { equals: lead.email }
                    }
                })

                if (existing.docs.length > 0) {
                    results.duplicates++;
                    results.duplicateEmails.push(lead.email);
                    continue;
                }

                // 3. Extract standard fields and capture custom fields
                const standardKeys = [
                    'name', 'email', 'company', 'phone', 'linkedin',
                    'position', 'source', 'status', 'personalization',
                    'notes', 'followUpDate', 'assignedTo', 'college', 'industry'
                ];

                const leadData: any = {};
                const customFields: any = {};

                Object.keys(lead).forEach(key => {
                    const value = lead[key];
                    const normalizedKey = key.toLowerCase().replace(/ /g, '');

                    // Map common CSV names to schema fields
                    let fieldKey = key;
                    if (normalizedKey === 'leadsource') fieldKey = 'source';
                    if (normalizedKey === 'followupdate') fieldKey = 'followUpDate';
                    if (normalizedKey === 'assignedto') fieldKey = 'assignedTo';

                    if (standardKeys.includes(fieldKey)) {
                        leadData[fieldKey] = value;
                    } else if (value) {
                        customFields[key] = value;
                    }
                });

                await payload.create({
                    collection: 'leads' as any,
                    data: {
                        ...leadData,
                        status: leadData.status?.toLowerCase().replace(/ /g, '_') || 'new',
                        source: leadData.source?.toLowerCase().replace(/ /g, '_') || 'manual',
                        customFields: Object.keys(customFields).length > 0 ? customFields : undefined
                    }
                })
                results.created++;
            } catch (e) {
                console.error('Error importing lead:', e);
                results.errors++;
            }
        }

        return NextResponse.json({ success: true, results })
    } catch (e) {
        console.error('Import error:', e)
        return NextResponse.json({ error: 'Import failed' }, { status: 500 })
    }
}
