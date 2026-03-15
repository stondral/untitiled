import type { CollectionConfig } from "payload";
import { resolveMediaUrl } from "@/lib/media";
import { generateTagsFromImage } from "@/lib/ai/utils/imageTagger";

export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    useAsTitle: "filename",
  },
  access: {
    read: () => true, // public media
  },
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        // Only run on creation or if tags are empty
        if ((operation === 'create' || operation === 'update') && (!doc.tags || doc.tags.length === 0)) {
          const url = resolveMediaUrl(doc);
          if (!url) return;

          try {
            const tags = await generateTagsFromImage(url);
            if (tags && tags.length > 0) {
              console.log(`[Media Hook] Generated ${tags.length} tags for ${doc.id}`);
              
              // Prevent infinite loops by using a flag or checking content
              await req.payload.update({
                collection: 'media',
                id: doc.id,
                data: {
                  tags: tags.map(t => ({ tag: t })),
                } as any,
              });
            }
          } catch (error) {
            console.error(`[Media Hook] Failed to auto-tag:`, error);
          }
        }
      }
    ]
  },
  upload: {
    // 🔑 IMPORTANT: let S3/R2 handle everything
    disableLocalStorage: true,

    mimeTypes: [
      "image/*",
      "video/*",
      "application/pdf",
      "application/octet-stream",
    ],

    imageSizes: [
      {
        name: "thumbnail",
        width: 300,
        height: 300,
        position: "centre",
      },
      {
        name: "card",
        width: 600,
        height: 600,
        position: "centre",
      },
      {
        name: "hero",
        width: 1200,
        height: 1200,
        position: "centre",
      },
    ],
  },

  fields: [
    {
      name: "alt",
      type: "text",
      required: false,
    },
    {
      name: "folder",
      type: "relationship",
      relationTo: "media-folders" as never,
      required: false,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "tags",
      type: "array",
      label: "AI Generated Tags",
      fields: [
        {
          name: "tag",
          type: "text",
        },
      ],
      admin: {
        description: "Keywords automatically extracted from the image",
      },
    },
  ],
};
