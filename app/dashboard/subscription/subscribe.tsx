"use client";

import { Pricing } from "@/components/pricing";
import { ProductsCatalog } from "@/products/types";
import { createCheckoutSession } from "./actions";
import { useCallback } from "react";
import { useRouter } from "next/navigation";

export function Subscribe({ products }: { products: ProductsCatalog }) {
  const router = useRouter();

  const handleSelect = useCallback(
    async (tier: keyof ProductsCatalog) => {
      const result = await createCheckoutSession({ tier, term: "monthly" });
      if (result?.data) {
        router.push(result.data);
      }
    },
    [router],
  );

  return <Pricing products={products} onSelect={handleSelect} />;
}
