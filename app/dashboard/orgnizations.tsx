"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useListOrganizations, organization } from "@/lib/auth-client";
import CreateOrganization from "./create-organization";

export default function OrganizationList() {
  const [showCreate, setShowCreate] = useState(false);
  const router = useRouter();
  const { data: organizations } = useListOrganizations();

  const handleSelect = async (orgId: string) => {
    const { error } = await organization.setActive({ organizationId: orgId });
    if (!error) {
      router.push("/dashboard");
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Select an organization</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showCreate ? (
          <CreateOrganization />
        ) : (
          <>
            <div className="space-y-2">
              {organizations?.map((org) => (
                <Button
                  key={org.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleSelect(org.id)}
                >
                  {org.name}
                </Button>
              ))}
            </div>
            <Button className="w-full" onClick={() => setShowCreate(true)}>
              Create organization
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
