import type { CollectionConfig } from 'payload'

export const Leads: CollectionConfig = {
    slug: 'leads',
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'company', 'email', 'status', 'leadScore'],
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
        },
        {
            name: 'company',
            type: 'text',
        },
        {
            name: 'email',
            type: 'email',
            required: true,
            unique: true,
        },
        {
            name: 'phone',
            type: 'text',
        },
        {
            name: 'linkedin',
            type: 'text',
            label: 'LinkedIn Profile',
        },
        {
            name: 'position',
            type: 'text',
        },
        {
            name: 'personalization',
            type: 'textarea',
            admin: {
                description: 'Used for dynamic variable injection in email campaigns.'
            }
        },
        {
            name: 'source',
            type: 'select',
            defaultValue: 'manual',
            options: [
                { label: 'LinkedIn', value: 'linkedin' },
                { label: 'Cold Email', value: 'cold_email' },
                { label: 'Event', value: 'event' },
                { label: 'Website', value: 'website' },
                { label: 'Referral', value: 'referral' },
                { label: 'Manual', value: 'manual' },
                { label: 'Instagram', value: 'instagram' },
            ],
        },
        {
            name: 'status',
            type: 'select',
            defaultValue: 'not_mailed',
            options: [
                { label: 'Not Mailed', value: 'not_mailed' },
                { label: 'Awaiting Reply', value: 'awaiting_reply' },
                { label: 'No Reply', value: 'no_reply' },
                { label: 'Replied', value: 'replied' },
                { label: 'Interested', value: 'interested' },
                { label: 'Not Interested', value: 'not_interested' },
                { label: 'Converted', value: 'converted' },
                { label: 'Follow Up', value: 'follow_up' },
            ],
        },
        {
            name: 'college',
            type: 'text',
        },
        {
            name: 'industry',
            type: 'text',
        },
        {
            name: 'leadScore',
            type: 'number',
            defaultValue: 0,
        },
        {
            name: 'assignedTo',
            type: 'relationship',
            relationTo: 'users',
        },
        {
            name: 'lastReplyAt',
            type: 'date',
        },
        {
            name: 'notes',
            type: 'textarea',
        },
        {
            name: 'lastEmailed',
            type: 'date',
        },
        {
            name: 'lastCalled',
            type: 'date',
        },
        {
            name: 'followUpDate',
            type: 'date',
        },
        {
            name: 'customFields',
            type: 'json',
            admin: {
                description: 'Capture extra columns from Excel import.'
            }
        }
    ],
    timestamps: true,
}
