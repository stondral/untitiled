import type { CollectionConfig } from 'payload'

export const EmailTemplates: CollectionConfig = {
    slug: 'email-templates',
    admin: {
        useAsTitle: 'name',
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
        },
        {
            name: 'subject',
            type: 'text',
            required: true,
        },
        {
            name: 'body',
            type: 'textarea',
            required: true,
            admin: {
                description: 'Variables: {name}, {company}, {college}, {industry}',
            },
        },
        {
            name: 'isStandard',
            type: 'checkbox',
            defaultValue: false,
            admin: {
                position: 'sidebar',
            }
        },
        {
            name: 'plainContent',
            type: 'textarea',
            admin: {
                description: 'The raw text content when using a standard shell',
            }
        },
    ],
    timestamps: true,
}
