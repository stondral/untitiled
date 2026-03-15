import type { CollectionConfig } from "payload"
import { getEmailTemplate } from "@/lib/email-templates"

const frontendURL = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"

export const Users: CollectionConfig = {
  slug: "users",

  // ✅ 1. Enable Native Auth & Verification
  auth: {
    // ✅ Store token in a httpOnly cookie for server-side middleware
    tokenExpiration: 7 * 24 * 60 * 60, // 7 days
    maxLoginAttempts: 5,
    verify: {
      generateEmailSubject: () => "Verify your Stond Emporium account",
      generateEmailHTML: (args: any) => {
        const { token, user } = args || {};
        const url = `${frontendURL}/auth/verify?token=${token}`

        return getEmailTemplate('welcome-mail', {
          username: user?.username || "there",
          verifyUrl: url
        });
      },
    },
    forgotPassword: {
      generateEmailSubject: () => "Reset your Stond Emporium password",
      generateEmailHTML: (args: any) => {
        const { token, user } = args || {};
        const url = `${frontendURL}/auth/reset-password?token=${token}`

        return getEmailTemplate('forgot-password-mail', {
          username: user?.username || "there",
          resetUrl: url
        });
      },
    },
  },

  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "role", "username"],
  },

  // ✅ 2. Simplified Access Control
  // ✅ 2. Simplified Access Control
  access: {
    read: async ({ req }) => {
      const { user } = req;
      const authUser = user as any
      // 1. If no user is logged in, only allow reading sellers (for frontend/middleware)
      if (!authUser) {
        return {
          role: {
            in: ["seller", "sellerEmployee"],
          },
        } as any
      }

      // 2. If Admin, allow reading everything
      if (authUser.role === "admin") {
        return true
      }

      // 3. Allow sellers and sellerEmployees to read their teammates
      if (authUser.role === "seller" || authUser.role === "sellerEmployee") {
        const memberships = await req.payload.find({
          collection: 'seller-members',
          where: { user: { equals: authUser.id } },
          limit: 100,
          depth: 0,
          overrideAccess: true,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mySellerIds = memberships.docs.map((m: any) => m.seller);

        const teammateIds = new Set<string>();
        teammateIds.add(String(authUser.id));

        if (mySellerIds.length > 0) {
          const teammateMemberships = await req.payload.find({
            collection: 'seller-members',
            where: { seller: { in: mySellerIds } },
            limit: 500,
            depth: 0,
            overrideAccess: true,
          });

          teammateMemberships.docs.forEach((m: any) => {
            const uid = typeof m.user === 'object' ? m.user?.id : m.user;
            if (uid) teammateIds.add(String(uid));
          });
        }

        return {
          id: {
            in: Array.from(teammateIds),
          },
        } as any;
      }

      // 4. Keep the "User sees only self" rule for regular users
      return {
        id: {
          equals: authUser.id,
        },
      } as any
    },
    create: () => true,
    update: ({ req: { user } }) => {
      const authUser = user as any
      if (!authUser) return false
      // Only admins can update users
      return authUser.role === "admin"
    },
    delete: ({ req: { user } }) => (user as any)?.role === "admin",
  },

  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data.plan === "starter") {
          data.theme = {
            ...(data.theme || {}),
            preset: "default",
          }
          data.customDomain = {
            ...(data.customDomain || {}),
            enabled: false,
          }
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        // Detect Role Transition: user -> seller
        const isRoleUpgrade = operation === 'update' &&
          doc.role === 'seller' &&
          previousDoc?.role === 'user';

        if (isRoleUpgrade) {
          const { payload } = req;
          try {
            const emailHtml = getEmailTemplate('seller-welcome', {
              username: doc.username || 'Partner',
              dashboardUrl: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/seller`
            });

            await payload.sendEmail({
              to: doc.email,
              subject: "You're officially a Stond Seller! 🎉",
              html: emailHtml,
            });
            console.log(`Seller Welcome email sent to ${doc.email}`);
          } catch (err) {
            console.error('Failed to send Seller Welcome email:', err);
          }
        }
      }
    ]
  },

  fields: [
    {
      name: "username",
      type: "text",
      required: true,
      unique: true,
    },
    {
      name: "phone",
      type: "text",
      required: true,
      access: {
        read: ({ req, doc }) =>
          (req.user as any)?.role === "admin" || doc?.id === req.user?.id,
      },
    },
    {
      name: "role",
      type: "select",
      defaultValue: "user",
      required: true,
      options: [
        { label: "Admin", value: "admin" },
        { label: "Seller", value: "seller" },
        { label: "Team Member", value: "sellerEmployee" },
        { label: "User", value: "user" },
      ],
      index: true,
      access: {
        update: ({ req }) => (req.user as any)?.role === "admin",
      },
    },
    {
      name: "plan",
      type: "select",
      defaultValue: "starter",
      options: [
        { label: "Starter", value: "starter" },
        { label: "Pro", value: "pro" },
        { label: "Elite", value: "elite" },
      ],
      admin: {
        position: 'sidebar',
      }
    },
    {
      name: "billingCycle",
      type: "select",
      options: [
        { label: "Monthly", value: "monthly" },
        { label: "Yearly", value: "yearly" },
      ],
      admin: {
        position: 'sidebar',
      }
    },
    {
      name: "subscriptionId",
      type: "text",
      index: true,
      admin: {
        position: 'sidebar',
      }
    },
    {
      name: "subscriptionStatus",
      type: "select",
      defaultValue: "inactive",
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Pending", value: "pending" },
        { label: "Cancelled", value: "cancelled" },
      ],
      admin: {
        position: 'sidebar',
      }
    },
    {
      name: "nextBillingDate",
      type: "date",
      admin: {
        position: 'sidebar',
      }
    },
    {
      name: "razorpayCustomerId",
      type: "text",
      admin: {
        position: 'sidebar',
      }
    },
    {
      name: "theme",
      type: "group",
      fields: [
        {
          name: "preset",
          type: "select",
          defaultValue: "default",
          options: [
            { label: "Default", value: "default" },
            { label: "Modern", value: "modern" },
            { label: "Luxury", value: "luxury" },
          ],
        },
        {
          name: "colors",
          type: "json",
        },
        {
          name: "fonts",
          type: "json",
        },
        {
          name: "layoutVersion",
          type: "number",
          defaultValue: 1,
        },
      ],
    },
    {
      name: "customDomain",
      type: "group",
      fields: [
        {
          name: "enabled",
          type: "checkbox",
          defaultValue: false,
        },
        {
          name: "domain",
          type: "text",
          unique: true,
        },
        {
          name: "verifiedAt",
          type: "date",
        },
      ],
    },
    // ❌ Removed: emailVerified, emailVerifyToken, emailVerifyExpires
    // Payload handles these internally now.

    // ─── 2FA / TOTP Step-Up Authentication ───
    {
      name: "twoFactorEnabled",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "Whether TOTP 2FA is enabled for this user",
      },
    },
    {
      name: "twoFactorSecret",
      type: "text",
      admin: {
        position: "sidebar",
        description: "TOTP secret (encrypted). Do not edit manually.",
        readOnly: true,
      },
      access: {
        read: ({ req }) => (req.user as any)?.role === "admin",
      },
    },
    {
      name: "lastStepUpAt",
      type: "date",
      admin: {
        position: "sidebar",
        description: "Last time the user verified TOTP for step-up auth",
        readOnly: true,
      },
    },
  ],
}