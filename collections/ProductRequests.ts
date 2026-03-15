import type { CollectionConfig } from 'payload'

export const ProductRequests: CollectionConfig = {
  slug: 'product-requests',
  admin: {
    useAsTitle: 'query',
    defaultColumns: ['query', 'user', 'status', 'createdAt'],
    group: 'AI Style Advisor',
  },
  access: {
    read: ({ req }) => (req.user as any)?.role === 'admin',
    create: () => true, // System/Actions can create
    update: ({ req }) => (req.user as any)?.role === 'admin',
    delete: ({ req }) => (req.user as any)?.role === 'admin',
  },
  fields: [
    {
      name: 'query',
      type: 'text',
      required: true,
      label: 'User Search Query',
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      label: 'Requesting User',
    },
    {
      name: 'history',
      type: 'json',
      label: 'Advisor Chat History',
      admin: {
        description: 'Partial conversation context for the request.',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending Review', value: 'pending' },
        { label: 'Acknowledged', value: 'acknowledged' },
        { label: 'In Production', value: 'in-production' },
        { label: 'Catalog Updated', value: 'completed' },
      ],
    },
  ],
  timestamps: true,
}
