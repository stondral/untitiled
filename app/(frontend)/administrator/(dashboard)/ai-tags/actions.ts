"use server";

import { getPayload } from "payload";
import config from "@/payload.config";
import { generateTagsFromImage } from "@/lib/ai/utils/imageTagger";
import { resolveMediaUrl } from "@/lib/media";
import { revalidatePath } from "next/cache";

export async function updateProductTags(productId: string, tags: string[]) {
  const payload = await getPayload({ config });

  try {
    const formattedTags = tags.map(t => ({ tag: t.toLowerCase().trim() }));
    
    await payload.update({
      collection: 'products',
      id: productId,
      data: {
        tags: formattedTags
      }
    });

    revalidatePath('/administrator/ai-tags');
    return { success: true };
  } catch (err) {
    console.error(`[AI Action] Failed to update tags for ${productId}:`, err);
    throw new Error("Failed to update tags");
  }
}

export async function triggerProductTagRegeneration(productId: string) {
  const payload = await getPayload({ config });

  try {
    const product = await payload.findByID({
      collection: 'products',
      id: productId,
      depth: 1,
    });

    if (!product.media || !Array.isArray(product.media)) {
      throw new Error("No media found for product");
    }

    const allGeneratedTags = new Set<string>();

    for (const m of product.media) {
      const mediaId = typeof m === 'object' ? m.id : m;
      const mediaDoc = typeof m === 'object' ? m : await payload.findByID({
        collection: 'media',
        id: mediaId,
        depth: 0
      });

      const imageUrl = resolveMediaUrl(mediaDoc);
      const tags = await generateTagsFromImage(imageUrl);
      
      // Save tags to media doc too
      await payload.update({
        collection: 'media',
        id: mediaId,
        data: {
          tags: tags.map(t => ({ tag: t }))
        } as any,
        skipHooks: true
      } as any);

      tags.forEach(t => allGeneratedTags.add(t.toLowerCase().trim()));
    }

    // Update product with aggregated tags
    const finalTags = Array.from(allGeneratedTags).map(tag => ({ tag }));
    
    await payload.update({
      collection: 'products',
      id: productId,
      data: {
        tags: finalTags
      }
    });

    revalidatePath('/administrator/ai-tags');
    return { success: true, tags: Array.from(allGeneratedTags) };
  } catch (err) {
    console.error(`[AI Action] Regeneration failed for ${productId}:`, err);
    throw new Error("Regeneration failed");
  }
}
