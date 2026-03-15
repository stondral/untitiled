import type { CollectionConfig } from 'payload'

export const CallLogs: CollectionConfig = {
    slug: 'call-logs',
    admin: {
        useAsTitle: 'result',
        defaultColumns: ['lead', 'calledAt', 'result', 'nextCall'],
    },
    fields: [
        {
            name: 'lead',
            type: 'relationship',
            relationTo: 'leads' as any,
            required: true,
        },
        {
            name: 'calledAt',
            type: 'date',
            required: true,
            defaultValue: () => new Date(),
        },
        {
            name: 'result',
            type: 'select',
            required: true,
            options: [
                { label: 'Interested', value: 'interested' },
                { label: 'Not Interested', value: 'not_interested' },
                { label: 'No Answer', value: 'no_answer' },
                { label: 'Callback Requested', value: 'callback' },
                { label: 'Wrong Number', value: 'wrong_number' },
            ],
        },
        {
            name: 'nextCall',
            type: 'date',
        },
        {
            name: 'notes',
            type: 'textarea',
        },
    ],
    timestamps: true,
}
