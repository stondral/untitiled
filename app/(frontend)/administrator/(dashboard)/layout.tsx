import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopNav } from "@/components/admin/AdminTopNav";


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#020617] transition-colors duration-300">
      <AdminSidebar user={user} className="hidden lg:flex shadow-2xl z-50 h-full shrink-0" />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <AdminTopNav user={user} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative transition-all duration-300 custom-scrollbar">
          <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-[calc(100vh-200px)]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
