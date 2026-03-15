"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CircleAlert as AlertCircle, RefreshCw, ShoppingCart, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";

function OrderFailureContent() {
  const searchParams = useSearchParams();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _orderId = searchParams?.get("orderId");

  return (
    <div className="min-h-screen bg-white py-20 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
        </div>

        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
          Payment Failed
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          We couldn&apos;t process your payment. Don&apos;t worry, no money was deducted from your account.
        </p>

        <div className="bg-red-50 rounded-2xl p-8 border border-red-100 mb-12 text-left">
          <h2 className="text-lg font-bold text-red-900 mb-4">Common reasons for failure:</h2>
          <ul className="space-y-3">
            {[
              "Incorrect card details or UPI ID",
              "Insufficient funds in your account",
              "Transaction declined by your bank",
              "Payment session timed out",
            ].map((reason, i) => (
              <li key={i} className="flex items-center gap-3 text-red-700">
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                {reason}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-700 h-14 px-8 text-lg font-semibold rounded-xl transition-all">
            <Link href="/checkout">
              <RefreshCw className="w-5 h-5 mr-2" />
              Retry Payment
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg font-semibold rounded-xl border-gray-200 hover:bg-gray-50 transition-all">
            <Link href="/cart">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Back to Cart
            </Link>
          </Button>
        </div>

        <div className="mt-12 text-gray-500 flex items-center justify-center gap-2">
           <MessageSquare className="w-4 h-4" />
           <span>Need help? <Link href="/contact" className="text-orange-600 hover:underline">Contact Customer Support</Link></span>
        </div>
      </div>
    </div>
  );
}

export default function OrderFailurePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white py-20 px-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <OrderFailureContent />
    </Suspense>
  );
}
