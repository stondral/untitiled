import { getPayload } from "payload";
import config from "@/payload.config";
import AITagsClient from "./AITagsClient";

export const dynamic = 'force-dynamic';

export default async function AITagsPage() {
  const payload = await getPayload({ config });

  // Fetch products that have tags or at least have media
  const { docs: products } = await payload.find({
    collection: 'products',
    limit: 100,
    depth: 2,
    sort: '-updatedAt'
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tighter">AI Discovery Engine</h1>
        <p className="text-slate-500 font-bold text-sm uppercase tracking-widest text-indigo-500/80">Monitor and Refine Machine Intelligence</p>
      </div>

      <AITagsClient products={JSON.parse(JSON.stringify(products))} />
    </div>
  );
}
