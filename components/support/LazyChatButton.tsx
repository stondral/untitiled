"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const ChatButton = dynamic(
  () => import("@/components/support/ChatButton").then((mod) => ({ default: mod.ChatButton })),
  { ssr: false, loading: () => null }
);

export default function LazyChatButton() {
  const pathname = usePathname();
  const isOrdersPage = pathname?.startsWith("/orders") || 
                       pathname?.startsWith("/order-success") || 
                       pathname?.startsWith("/order-failure");

  if (!isOrdersPage) return null;

  return <ChatButton />;
}
