import type { CollectionConfig } from 'payload'

export const EmailLogs: CollectionConfig = {
    slug: 'email-logs',
    admin: {
        useAsTitle: 'subject',
        defaultColumns: ['lead', 'subject', 'sentAt', 'opened', 'replied'],
    },
    fields: [
        {
            name: 'lead',
            type: 'relationship',
            relationTo: 'leads' as any,
            required: true,
        },
        {
            name: 'sentAt',
            type: 'date',
            required: true,
            defaultValue: () => new Date(),
        },
        {
            name: 'subject',
            type: 'text',
            required: true,
        },
        {
            name: 'template',
            type: 'text',
        },
        {
            name: 'opened',
            type: 'checkbox',
            defaultValue: false,
        },
        {
            name: 'clicked',
            type: 'checkbox',
            defaultValue: false,
        },
        {
            name: 'replied',
            type: 'checkbox',
            defaultValue: false,
        },
        {
            name: 'responseType',
            type: 'select',
            options: [
                { label: 'Positive', value: 'positive' },
                { label: 'Negative', value: 'negative' },
                { label: 'Neutral', value: 'neutral' },
            ],
        },
        {
            name: 'notes',
            type: 'textarea',
        },
        {
            name: 'trackingId',
            type: 'text',
            admin: {
                readOnly: true,
            },
        },
    ],
    timestamps: true,
}
