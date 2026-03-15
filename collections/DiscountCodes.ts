import type { CollectionConfig } from "payload"

export const DiscountCodes: CollectionConfig = {
  slug: "discount-codes",

  access: {
    // Admins and Sellers can read codes (sellers need to see what's applicable)
    read: ({ req: { user } }) => {
      if (!user) return false;
      const role = (user as any)?.role;
      return role === "admin" || role === "seller";
    },
    create: ({ req: { user } }) => (user as any)?.role === "admin",
    update: ({ req: { user } }) => (user as any)?.role === "admin",
    delete: ({ req: { user } }) => (user as any)?.role === "admin",
  },

  admin: {
    useAsTitle: "code",
    defaultColumns: ["code", "type", "value", "isActive", "usedCount", "expiresAt"],
  },

  fields: [
    {
      name: "discountSource",
      type: "select",
      required: true,
      defaultValue: "store",
      options: [
        { label: "Store-wide Discount", value: "store" },
        { label: "Seller-specific Discount", value: "seller" },
      ],
      admin: {
        description: "Choose whether this is a general store discount or specific to a seller.",
      },
    },
    {
      name: "seller",
      type: "relationship",
      relationTo: "users",
      admin: {
        condition: (data) => data?.discountSource === "seller",
        description: "Select the seller this discount applies to.",
      },
      filterOptions: {
        role: { equals: "seller" },
      },
    },
    {
      name: "code",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description: "Discount code (will be auto-converted to uppercase)",
      },
    },
    {
      name: "description",
      type: "textarea",
      admin: {
        description: "Internal description for admins",
      },
    },
    {
      name: "type",
      type: "select",
      required: true,
      options: [
        { label: "Percentage (%)", value: "percentage" },
        { label: "Fixed Amount (₹)", value: "fixed" },
      ],
      defaultValue: "percentage",
    },
    {
      name: "value",
      type: "number",
      required: true,
      min: 0,
      admin: {
        description: "Discount value (e.g., 10 for 10% or ₹10 off)",
      },
    },
    {
      name: "minOrderValue",
      type: "number",
      min: 0,
      admin: {
        description: "Minimum cart subtotal required (optional)",
      },
    },
    {
      name: "maxDiscount",
      type: "number",
      min: 0,
      admin: {
        description: "Maximum discount cap for percentage-based codes (optional)",
      },
    },
    {
      name: "usageLimit",
      type: "number",
      min: 0,
      admin: {
        description: "Total number of times code can be used (leave empty for unlimited)",
      },
    },
    {
      name: "oneTimeUsePerUser",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description: "If enabled, each user can only use this code once.",
        position: "sidebar",
      },
    },
    {
      name: "minItemsCount",
      type: "number",
      min: 0,
      admin: {
        description: "Minimum number of items required in cart (optional)",
      },
    },
    {
      name: "applicableCategories",
      type: "relationship",
      relationTo: "categories",
      hasMany: true,
      admin: {
        description: "Limit this discount to specific categories (optional)",
      },
    },
    {
      name: "usedCount",
      type: "number",
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: "Number of times this code has been used",
      },
    },
    {
      name: "expiresAt",
      type: "date",
      admin: {
        description: "Expiration date (optional)",
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
    {
      name: "isActive",
      type: "checkbox",
      defaultValue: true,
      admin: {
        description: "Enable or disable this discount code",
      },
    },
    {
      name: "createdBy",
      type: "relationship",
      relationTo: "users",
      admin: {
        position: "sidebar",
        readOnly: true,
      },
    },
  ],

  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        // Auto-uppercase the code
        if (data.code) {
          data.code = data.code.toUpperCase().trim();
        }

        // Set createdBy on creation
        if (operation === "create" && req.user) {
          data.createdBy = req.user.id;
        }

        return data;
      },
    ],
    afterChange: [
      ({ doc, operation, req }) => {
        // Log discount code creation/updates for audit trail
        const action = operation === "create" ? "created" : "updated";
        console.log(
          `[Discount Code] ${action.toUpperCase()}: ${doc.code} by ${(req.user as any)?.email || "system"}`
        );
      },

      // Redis Cache Invalidation
      async ({ doc, operation }) => {
        if (operation === 'create' || operation === 'update') {
          try {
            const { invalidateDiscountCode } = await import('@/lib/redis/discount');
            await invalidateDiscountCode(doc.code);
            console.log(`✅ Invalidated discount code cache: ${doc.code}`);
          } catch (error) {
            console.error('Failed to invalidate discount code cache:', error);
          }
        }
      },
    ],
  },
}
