'use server';

import { getPayload } from "payload";
import config from "@/payload.config";
import { resolveMediaUrl } from "@/lib/media";

interface GetProductsParams {
    q?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
}

export async function getFilteredProducts(params: GetProductsParams) {
    const { q, category, minPrice, maxPrice, sort } = params;
    const payload = await getPayload({ config });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereQuery: any = {
        status: { equals: "live" },
        isActive: { equals: true },
    };

    if (q) {
        whereQuery.or = [
            { name: { contains: q } },
            { description: { contains: q } },
            { slug: { contains: q } },
            { 'tags.tag': { contains: q } },
        ];
    }

    if (category) {
        whereQuery.category = { equals: category };
    }

    if (minPrice || maxPrice) {
        whereQuery.basePrice = {};
        if (minPrice) whereQuery.basePrice.greater_than_equal = parseFloat(minPrice);
        if (maxPrice) whereQuery.basePrice.less_than_equal = parseFloat(maxPrice);
    }

    let sortOption = "-createdAt";
    if (sort === "price-asc") sortOption = "basePrice";
    if (sort === "price-desc") sortOption = "-basePrice";
    if (sort === "newest") sortOption = "-createdAt";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productsRes = await (payload as any).find({
        collection: "products",
        where: whereQuery,
        sort: sortOption,
        limit: 50,
        depth: 2,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const products = productsRes.docs.map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: (p.price && p.price > 0) ? p.price : p.basePrice,
        basePrice: p.basePrice,
        compareAtPrice: p.compareAtPrice,
        isActive: p.isActive,
        featured: p.featured,
        stock: p.stock,
        popularity: p.popularity,
        category: {
            id: typeof p.category === "object" ? p.category?.id : p.category,
            name: typeof p.category === "object" ? p.category?.name : "Uncategorized",
        },
        images: Array.isArray(p.media)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ? p.media.map((m: any) => resolveMediaUrl(m))
            : p.media
                ? [resolveMediaUrl(p.media)]
                : [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        variants: (p.variants || p.productVariants)?.map((v: any) => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            price: v.price,
            stock: v.stock,
            image: v.image ? resolveMediaUrl(v.image) : undefined,
            attributes: v.attributes ?? [],
        })) ?? [],
    }));

    return products;
}
