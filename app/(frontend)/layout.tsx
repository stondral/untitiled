  import React from "react";
import "@/app/globals.css";
import { AuthProvider } from "@/components/auth/AuthContext";
import { CartProvider } from "@/components/cart/CartContext";
import { WishlistProvider } from "@/components/products/WishlistContext";
import ConditionalLayout from "@/app/(frontend)/conditional-layout";
import LazyChatButton from "@/components/support/LazyChatButton";
import StyleAdvisor from "@/components/support/StyleAdvisor";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <div className="relative z-0 flex flex-col min-h-screen bg-background">
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </div>
          <LazyChatButton />
          <StyleAdvisor />
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
};

export default Layout;
