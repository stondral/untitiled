import type { CollectionConfig } from "payload";

export const Availability: CollectionConfig = {
    slug: "availability",
    admin: {
        useAsTitle: "date",
        defaultColumns: ["date", "isOpen", "updatedAt"],
        group: "Platform",
        description: "Admin daily availability for Stond Meet™ scheduling",
    },
    access: {
        // Anyone can read availability (needed for calendar display)
        create: ({ req: { user } }) => !!user && (user as any).role === "admin",
        read: () => true,
        update: ({ req: { user } }) => !!user && (user as any).role === "admin",
        delete: ({ req: { user } }) => !!user && (user as any).role === "admin",
    },
    fields: [
        {
            name: "date",
            type: "text",
            required: true,
            unique: true,
            admin: { description: "Date in YYYY-MM-DD format" },
        },
        {
            name: "isOpen",
            type: "checkbox",
            defaultValue: true,
            required: true,
            admin: { description: "Is the admin available on this day?" },
        },
        {
            name: "slots",
            type: "json",
            admin: {
                description:
                    'Custom time slots for this day as JSON array, e.g. ["10:00 AM","2:00 PM"]. Leave empty to use default slots.',
            },
        },
        {
            name: "note",
            type: "text",
            admin: { description: "Optional note (e.g., \"Out for conference\")" },
        },
    ],
    timestamps: true,
};
