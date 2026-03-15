/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: request.headers });

    if (!user || (typeof user === 'object' && 'role' in user && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const type = request.nextUrl.searchParams.get('type') || 'orders';
    const customerId = request.nextUrl.searchParams.get('customerId');

    logger.debug({ type, customerId }, "📦 Admin fetching data");

    if (type === 'users') {
      const { docs: users } = await payload.find({
        collection: 'users',
        sort: '-createdAt',
        limit: 1000,
        overrideAccess: true,
      });
      return NextResponse.json({ users });
    }

    if (type === 'sellers') {
      const { docs: sellers } = await payload.find({
        collection: 'sellers',
        sort: '-createdAt',
        limit: 1000,
        depth: 1, // Get owner details
        overrideAccess: true,
      });
      return NextResponse.json({ sellers });
    }

    if (type === 'warehouses') {
      const { docs: warehouses } = await payload.find({
        collection: 'warehouses',
        sort: '-createdAt',
        limit: 1000,
        depth: 1, // Get seller details
        overrideAccess: true,
      });
      return NextResponse.json({ warehouses });
    }

    if (type === 'discounts') {
      const { docs: discounts } = await payload.find({
        collection: 'discount-codes',
        sort: '-createdAt',
        limit: 1000,
        overrideAccess: true,
      });
      return NextResponse.json({ discounts });
    }

    if (type === 'reviews') {
      const { docs: reviews } = await payload.find({
        collection: 'reviews',
        sort: '-createdAt',
        limit: 1000,
        depth: 2, // Get user and product details
        overrideAccess: true,
      });
      return NextResponse.json({ reviews });
    }

    if (type === 'categories') {
      const { docs: categories } = await payload.find({
        collection: 'categories',
        sort: 'name',
        limit: 1000,
        overrideAccess: true,
      });
      return NextResponse.json({ categories });
    }

    if (type === 'feedback') {
      const { docs: feedback } = await payload.find({
        collection: 'feedback',
        sort: '-createdAt',
        limit: 1000,
        overrideAccess: true,
      });
      return NextResponse.json({ feedback });
    }

    // Default: Fetch orders
    const query: any = {};
    if (customerId) {
      query.user = { equals: customerId };
    }

    const { docs: orders } = await payload.find({
      collection: 'orders',
      where: query,
      sort: '-createdAt',
      limit: 1000,
      depth: 1,
      overrideAccess: true,
    });

    return NextResponse.json({
      docs: orders || [],
      total: orders?.length || 0,
      orders: orders || [], // Maintain backward compatibility for some frontend parts
    });
  } catch (error) {
    logger.error({ err: error }, '❌ Failed to fetch admin data');
    return NextResponse.json(
      { error: 'Failed to fetch admin data' },
      { status: 500 }
    );
  }
}
