import type { CollectionConfig, CollectionSlug } from 'payload'
import { getSellersWithPermission, hasPermission } from '@/lib/rbac/permissions'

export const Products: CollectionConfig = {
  slug: 'products',
  versions: true,

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'status', 'featured', 'seller', 'isActive'],
  },

  /* ─────────────────────────────
     ACCESS CONTROL
  ───────────────────────────── */

  access: {
    read: async ({ req }) => {
      // Public storefront
      if (!req.user) {
        return {
          status: { equals: 'live' },
          isActive: { equals: true },
        } as any
      }

      const role = (req.user as any).role
      if (role === 'admin') return true

      // Sellers/Employees with product.view permission
      const allowedSellers = await getSellersWithPermission(req.payload, req.user.id, 'product.view')

      if (allowedSellers.length > 0) {
        return {
          or: [
            {
              and: [
                { status: { equals: 'live' } },
                { isActive: { equals: true } },
              ]
            },
            {
              seller: { in: allowedSellers }
            }
          ]
        } as any
      }

      // Default: only live products
      return {
        status: { equals: 'live' },
        isActive: { equals: true },
      } as any
    },

    create: async ({ req }) => {
      if (!req.user) return false
      if ((req.user as any).role === 'admin') return true

      // In Payload, 'create' access doesn't always have access to the 'data' being submitted.
      // So we check if the user has permission for AT LEAST ONE seller to allow the UI to show the 'Create' button.
      // Strict validation for the SPECIFIC seller is handled in the beforeChange hook below.
      const allowedSellers = await getSellersWithPermission(req.payload, req.user.id, 'product.create')
      return allowedSellers.length > 0
    },

    update: async ({ req }) => {
      if (!req.user) return false
      if ((req.user as any).role === 'admin') return true

      const allowedSellers = await getSellersWithPermission(req.payload, req.user.id, 'product.edit')
      if (allowedSellers.length === 0) return false

      return {
        seller: { in: allowedSellers },
      } as any
    },

    delete: async ({ req }) => {
      if (!req.user) return false
      if ((req.user as any).role === 'admin') return true

      const allowedSellers = await getSellersWithPermission(req.payload, req.user.id, 'product.delete')
      if (allowedSellers.length === 0) return false

      return {
        seller: { in: allowedSellers },
      } as any
    },
  },

  /* ─────────────────────────────
     HOOKS
  ───────────────────────────── */

  hooks: {
    beforeChange: [
      // Auto-assign seller + enforce pending state
      async ({ req, data, originalDoc, operation }) => {
        if (operation === 'create' && req.user) {
          // 1. Mandatory Security Check: Ensure seller is provided and user has permission for it
          const sellerId = data.seller;
          if (!sellerId) {
            throw new Error("Seller organization is required");
          }

          if ((req.user as any)?.role !== 'admin') {
            const hasCreatePermission = await hasPermission(req.payload, req.user.id, sellerId, 'product.create');
            if (!hasCreatePermission) {
              throw new Error("You do not have permission to create products for this organization");
            }

            // Non-admins must always have their products start as pending
            data.status = 'pending'
          }
        }

        if (operation === 'update' && req.user && (req.user as any)?.role !== 'admin') {
          // 2. Mandatory Security Check: Ensure they aren't trying to change the seller to one they don't own
          if (data.seller && data.seller !== originalDoc.seller) {
            const hasCreatePermission = await hasPermission(req.payload, req.user.id, data.seller, 'product.create');
            if (!hasCreatePermission) {
              throw new Error("You cannot transfer a product to an organization you do not manage");
            }
          }
        }

        // Auto-generate slug
        if (data.name && !data.slug) {
          data.slug = data.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
        }

        return data
      },

      async ({ data, originalDoc, operation, req }) => {
        if (operation !== 'update') return data
        if (!originalDoc?.variants || !data?.variants) return data

        const removedVariants = originalDoc.variants.filter(
          (oldVar: any) =>
            !data.variants.some((v: any) => v.id === oldVar.id)
        )

        for (const variant of removedVariants) {
          const orders = await req.payload.find({
            collection: 'orders' as CollectionSlug,
            where: {
              'items.variantId': { equals: variant.id },
            },
            limit: 1,
          })

          if (orders.totalDocs > 0) {
            throw new Error(
              `Variant "${variant.name}" cannot be deleted — already used in orders`
            )
          }
        }

        return data
      },

      // Approval Audit Logic
      async ({ req, data, originalDoc, operation }) => {
        if (operation === 'update' && data.status && data.status !== originalDoc.status) {
          // If status is changing to live or rejected, and user is admin
          if (req.user && (req.user as any)?.role === 'admin') {
            if (data.status === 'live' || data.status === 'rejected') {
              data.approvedBy = req.user.id;
              data.approvedAt = new Date().toISOString();
            }
          }
        }
        return data
      },

      // 🔥 AUTO-AGGREGATE TAGS FROM MEDIA
      async ({ data, req }) => {
        if (data.media && Array.isArray(data.media) && data.media.length > 0) {
          try {
            const mediaDocs = await Promise.all(
              data.media.map((m: any) => {
                const id = typeof m === 'object' ? m.id : m;
                return req.payload.findByID({
                  collection: 'media',
                  id,
                  depth: 0,
                });
              })
            );

            const allTags = new Set<string>();
            mediaDocs.forEach((m: any) => {
              if (m.tags && Array.isArray(m.tags)) {
                m.tags.forEach((t: any) => {
                  if (t.tag) allTags.add(t.tag.toLowerCase().trim());
                });
              }
            });

            if (allTags.size > 0) {
              data.tags = Array.from(allTags).map(tag => ({ tag }));
              console.log(`[Product Hook] Aggregated ${allTags.size} tags for product`);
            }
          } catch (err) {
            console.error('[Product Hook] Failed to aggregate tags:', err);
          }
        }
        return data;
      },
    ],

    // Redis Cache Invalidation
    afterChange: [
      async ({ doc, operation }) => {
        // Invalidate product cache when product is created or updated
        if (operation === 'create' || operation === 'update') {
          try {
            const { invalidateProduct, invalidateCategory } = await import('@/lib/redis/product');

            // Invalidate the specific product
            await invalidateProduct(doc.id);
            console.log(`✅ Invalidated product cache: ${doc.id}`);

            // Invalidate category cache if category exists
            if (doc.category) {
              const categoryId = typeof doc.category === 'string' ? doc.category : doc.category.id;
              await invalidateCategory(categoryId);
              console.log(`✅ Invalidated category cache: ${categoryId}`);
            }
          } catch (error) {
            // Don't fail the operation if cache invalidation fails
            console.error('Failed to invalidate product cache:', error);
          }
        }
      },
    ],

    // 🔥 AUTO-EXPIRE FEATURED PRODUCTS (NO CRON)
    beforeRead: [
      async ({ req }) => {
        const now = new Date().toISOString()

        // Guard: only run if expired featured products exist
        const expired = await req.payload.find({
          collection: 'products' as CollectionSlug,
          where: {
            featured: { equals: true },
            featuredUntil: { less_than: now },
          },
          limit: 1,
        })
        if (expired.totalDocs > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (req.payload as any).update({
            collection: 'products',
            where: {
              featured: { equals: true },
              featuredUntil: { less_than: now },
            },
            data: {
              featured: false,
            },
          })
        }
      },
    ],
    // 🔥 AUTO-UPDATE RATINGS
    afterRead: [
      ({ doc }) => {
        // We could calculate this on the fly or rely on hooks. 
        // For now, let's just make sure fields exist.
        return doc;
      }
    ]
  },

  /* ─────────────────────────────
     FIELDS
  ───────────────────────────── */

  fields: [
    /* FEATURED (ADMIN-ONLY, PAID VISIBILITY) */

    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      access: {
        create: ({ req }) => (req.user as any)?.role === 'admin',
        update: ({ req }) => (req.user as any)?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
        description: 'Featured products appear on the home page',
      },
    },

    {
      name: 'averageRating',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },

    {
      name: 'reviewCount',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'ratingDistribution',
      type: 'json',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },

    {
      name: 'featuredUntil',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'Feature expires automatically after this date',
        condition: (_, siblingData) => siblingData?.featured === true,
      },
    },

    /* CORE */

    {
      name: 'name',
      type: 'text',
      required: true,
      index: true,
    },

    {
      name: 'slug',
      type: 'text',
      access: {
        create: ({ req }) => (req.user as any)?.role === 'admin',
        update: ({ req }) => (req.user as any)?.role === 'admin',
      },
      unique: true,
      index: true,
      admin: {
        description: 'Auto-generated from product name',
      },
    },

    {
      name: 'description',
      type: 'textarea',
      required: true,
    },

    /* PRICING */

    {
      name: 'basePrice',
      type: 'number',
      required: true,
      min: 0,
    },

    {
      name: 'compareAtPrice',
      type: 'number',
      min: 0,
    },

    /* INVENTORY */

    {
      name: 'sku',
      type: 'text',
      admin: {
        description: 'Unique stock keeping unit',
      },
    },

    {
      name: 'stock',
      type: 'number',
      required: false,
      min: 0,
      defaultValue: 0,
      admin: {
        description: 'Stock quantity for main product (when no variants)',
      },
    },

    /* SHIPPING DIMENSIONS */
    {
      name: 'weight',
      type: 'number',
      admin: {
        description: 'Weight of the product in grams',
        position: 'sidebar',
      },
    },
    {
      name: 'dimensions',
      type: 'group',
      admin: {
        position: 'sidebar',
      },
      fields: [
        { name: 'length', type: 'number', admin: { description: 'Length in cm' } },
        { name: 'breadth', type: 'number', admin: { description: 'Breadth in cm' } },
        { name: 'height', type: 'number', admin: { description: 'Height in cm' } },
      ],
    },

    /* VISIBILITY */

    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      index: true,
    },

    /* SELLER & STATUS */

    {
      name: 'seller',
      type: 'relationship',
      relationTo: 'sellers' as any,
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
        position: 'sidebar',
      }
    },

    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      index: true,
      access: {
        update: ({ req }) => (req.user as any)?.role === 'admin',
      },
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Pending Approval', value: 'pending' },
        { label: 'Live', value: 'live' },
        { label: 'Rejected', value: 'rejected' },
      ],
      admin: {
        position: 'sidebar',
      },
    },

    {
      name: 'approvedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (_, siblingData) => ['live', 'rejected'].includes(siblingData?.status),
      },
    },

    {
      name: 'approvedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (_, siblingData) => ['live', 'rejected'].includes(siblingData?.status),
      },
    },

    {
      name: 'rejectedReason',
      type: 'textarea',
      admin: {
        position: 'sidebar',
        condition: (_, siblingData) => siblingData?.status === 'rejected',
      },
    },

    /* RELATIONS */

    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories' as CollectionSlug,
      required: true,
    },
    {
      name: 'tags',
      type: 'array',
      index: true,
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
      admin: {
        description: 'Keywords for search matching (auto-synced from image tags)',
      },
    },

    {
      name: 'media',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
    },

    /* VARIANTS (OPTIONAL) */

    {
      name: 'variants',
      type: 'array',
      required: false,
      minRows: 0,
      fields: [
        {
          name: 'name',
          type: 'text',
          required: false,
        },
        {
          name: 'sku',
          type: 'text',
          required: false,
        },
        {
          name: 'price',
          type: 'number',
          required: false,
          min: 0,
        },
        {
          name: 'stock',
          type: 'number',
          required: false,
          min: 0,
        },
        {
          name: 'image',
          type: 'relationship',
          relationTo: 'media',
        },
        {
          name: 'attributes',
          type: 'array',
          fields: [
            { name: 'name', type: 'text', required: true },
            { name: 'value', type: 'text', required: true },
          ],
        },
      ],
    },

    /* ATTRIBUTES */

    {
      name: 'attributes',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'value', type: 'text', required: true },
      ],
    },

    /* REFUND POLICY */

    {
      name: 'refundPolicy',
      type: 'select',
      options: [
        '14-Days',
        '7-Days',
        '5-Days',
        'Contact Customer Care',
      ],
    },

    /* SEO */

    {
      name: 'seo',
      type: 'group',
      fields: [
        { name: 'title', type: 'text' },
        { name: 'description', type: 'textarea' },
      ],
    },
  ],
}
