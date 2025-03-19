"use client";

import { Button } from "@/components/ui/button";
import { createPortalSession } from "./actions";

export const ManageSubscription = () => {
  const handlePortalClick = async () => {
    await createPortalSession();
  };

  return <Button onClick={handlePortalClick}>Manage subscription</Button>;
};
