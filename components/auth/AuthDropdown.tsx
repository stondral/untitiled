"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  LogOut, 
  Settings, 
  ChevronRight,
  Package,
  Heart,
  Store,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "./AuthContext";

export default function AuthDropdown() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />;
  }

  if (!isAuthenticated) {
    return (
      <Button
        size="sm"
        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 px-4"
        onClick={() => router.push("/auth")}
      >
        Sign In
      </Button>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-500";
      case "seller":
        return "bg-purple-500";
      default:
        return "bg-green-500";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrator";
      case "seller":
        return "Seller Account";
      case "sellerEmployee":
        return "Team Member";
      default:
        return "Member";
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-orange-200 transition-all duration-200"
        >
          <Avatar className="h-9 w-9 shadow-md">
            <AvatarImage src="" alt={user?.username} />
            <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white text-sm font-semibold">
              {user?.username ? getInitials(user.username) : "U"}
            </AvatarFallback>
          </Avatar>
          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 ${getRoleColor(user?.role || "user")} rounded-full border-2 border-white`} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        className="w-72 p-0 shadow-xl border-0 rounded-xl overflow-hidden" 
        align="end" 
        sideOffset={8}
        forceMount
      >
        {/* Profile Header - Clerk Style */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 shadow-lg ring-2 ring-white">
              <AvatarImage src="" alt={user?.username} />
              <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white text-lg font-semibold">
                {user?.username ? getInitials(user.username) : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white truncate">
                {user?.username}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {user?.email}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-2 h-2 rounded-full ${getRoleColor(user?.role || "user")}`} />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {getRoleLabel(user?.role || "user")}
                </span>
              </div>
            </div>
          </div>

          {/* Manage Account Button - Clerk Style */}
          <Link href="/profile">
            <div className="mt-3 flex items-center justify-between p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-orange-300 hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors cursor-pointer group">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Manage account</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-orange-500 transition-colors" />
            </div>
          </Link>
        </div>

        <DropdownMenuSeparator className="m-0" />

        {/* Menu Items */}
        <div className="p-2">
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/orders" className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                <Package className="h-4 w-4 text-gray-500" />
                <span className="font-medium">My Orders</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href="/wishlist" className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                <Heart className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Wishlist</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>

          {(user?.role === "seller" || user?.role === "admin" || user?.role === "sellerEmployee") && (
            <>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/seller/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                    <Store className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">Seller Dashboard</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}

          {user?.role === "admin" && (
            <>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/administrator" className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                    <Shield className="h-4 w-4 text-red-500" />
                    <span className="font-medium">Admin Panel</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}
        </div>

        <DropdownMenuSeparator className="m-0" />

        {/* Sign Out */}
        <div className="p-2">
          <DropdownMenuItem
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:bg-red-50 focus:text-red-600"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span className="font-medium">Sign out</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
