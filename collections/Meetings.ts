import type { CollectionConfig } from "payload";

export const Meetings: CollectionConfig = {
    slug: "meetings",
    admin: {
        useAsTitle: "name",
        defaultColumns: ["name", "brand", "date", "time", "status", "createdAt"],
        group: "Platform",
        description: "Stond Meet™ — Seller onboarding strategy sessions",
    },
    access: {
        // Anyone can create a meeting (public scheduling)
        create: () => true,
        // Only admins can read all meetings; users can read their own
        read: ({ req: { user } }) => {
            if (!user) return false;
            if ((user as any).role === "admin") return true;
            return { email: { equals: (user as any).email } };
        },
        // Only admins can update (add notes, change status)
        update: ({ req: { user } }) =>
            !!user && (user as any).role === "admin",
        // Only admins can delete
        delete: ({ req: { user } }) =>
            !!user && (user as any).role === "admin",
    },
    fields: [
        // ─── Contact Info ─────────────────────────
        {
            name: "name",
            type: "text",
            required: true,
            admin: { description: "Full name of the person scheduling" },
        },
        {
            name: "brand",
            type: "text",
            admin: { description: "Brand or business name" },
        },
        {
            name: "email",
            type: "email",
            required: true,
        },
        {
            name: "phone",
            type: "text",
        },
        {
            name: "category",
            type: "select",
            options: [
                { label: "Electronics", value: "electronics" },
                { label: "Fashion & Apparel", value: "fashion" },
                { label: "Health & Beauty", value: "beauty" },
                { label: "Home & Furniture", value: "home" },
                { label: "Jewellery & Accessories", value: "jewellery" },
                { label: "Food & Beverages", value: "food" },
                { label: "Other", value: "other" },
            ],
        },

        // ─── Schedule ─────────────────────────────
        {
            name: "date",
            type: "text",
            required: true,
            admin: { description: "Meeting date (YYYY-MM-DD)" },
        },
        {
            name: "time",
            type: "text",
            required: true,
            admin: { description: "Meeting time slot (e.g., 10:00 AM)" },
        },
        {
            name: "duration",
            type: "number",
            defaultValue: 15,
            admin: { description: "Duration in minutes" },
        },

        // ─── Status & Tracking ────────────────────
        {
            name: "status",
            type: "select",
            defaultValue: "unconfirmed",
            required: true,
            options: [
                { label: "⏳ Unconfirmed", value: "unconfirmed" },
                { label: "🟡 Scheduled", value: "scheduled" },
                { label: "✅ Confirmed", value: "confirmed" },
                { label: "🔵 In Progress", value: "in-progress" },
                { label: "🟢 Completed", value: "completed" },
                { label: "🔴 Cancelled", value: "cancelled" },
                { label: "⚪ No Show", value: "no-show" },
                { label: "🟠 Rescheduled", value: "rescheduled" },
            ],
        },
        {
            name: "createdByAdmin",
            type: "checkbox",
            defaultValue: false,
            admin: { description: "Was this meeting created by admin (outbound invite)?" },
        },

        // ─── Admin Notes & Context ────────────────
        {
            name: "preMeetingNotes",
            type: "textarea",
            admin: {
                description:
                    "Preparation notes for the call — seller context, research, key questions to ask, agenda items",
            },
        },
        {
            name: "postMeetingNotes",
            type: "textarea",
            admin: {
                description:
                    "Outcomes, action items, follow-up tasks, and decisions made during the call",
            },
        },
        {
            name: "meetingAgenda",
            type: "textarea",
            admin: {
                description: "Structured agenda: topics to cover during the session",
            },
        },

        // ─── Smart Context (Auto-filled) ──────────
        {
            name: "sellerProfile",
            type: "group",
            admin: {
                description: "Auto-generated seller context brief",
            },
            fields: [
                {
                    name: "estimatedVolume",
                    type: "text",
                    admin: { description: "Seller's estimated monthly order volume" },
                },
                {
                    name: "riskScore",
                    type: "text",
                    admin: { description: "Estimated RTO risk based on category" },
                },
                {
                    name: "notes",
                    type: "textarea",
                    admin: { description: "Additional seller intel or background" },
                },
            ],
        },

        // ─── Follow-up ────────────────────────────
        {
            name: "followUpDate",
            type: "date",
            admin: { description: "Scheduled follow-up date after the meeting" },
        },
        {
            name: "followUpAction",
            type: "textarea",
            admin: { description: "What needs to happen after the call?" },
        },
        {
            name: "outcome",
            type: "select",
            options: [
                { label: "Seller Onboarded", value: "onboarded" },
                { label: "Follow-up Needed", value: "follow-up" },
                { label: "Not a Fit", value: "rejected" },
                { label: "Pending Decision", value: "pending" },
            ],
            admin: { description: "Meeting outcome for tracking pipeline" },
        },
    ],
    timestamps: true,
};
