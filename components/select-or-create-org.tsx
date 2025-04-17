"use client"

import { useState } from "react";
import { client } from "@/lib/auth-client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function OrganizationList() {
  const router = useRouter();
  const { data: organizations } = client.useListOrganizations();
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [orgLogo, setOrgLogo] = useState("");

  const handleCreateOrganization = async () => {
    if (!orgName || !orgSlug) return;

    setLoading(true);
    try {
      const newOrg = await client.organization.create({
        name: orgName,
        slug: orgSlug,
        logo: orgLogo
      });

      setOrgName("");
      setOrgSlug("");
      setShowCreateForm(false);

    } catch (error) {
      console.error("Failed to create organization:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetActiveOrg = async (organizationId) => {
    setLoading(true);
    try {
      await client.organization.setActive({
        organizationId: organizationId
      });
      router.push("/dashboard/moderations");
    } catch (error) {
      console.error("Failed to set active organization:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Your Organizations</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Select an organization or create a new one
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {organizations?.length > 0 ? (
            <div className="grid gap-2">
              {organizations.map(org => (
                <div key={org.id} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                  <p className="font-medium">{org.name}</p>
                  <Button
                    size="sm"
                    onClick={() => handleSetActiveOrg(org.id)}
                  >
                    Select
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-gray-500 py-4">No organizations found</p>
          )}

          {showCreateForm ? (
            <div className="grid gap-4 mt-4 border-t pt-4">
              <div className="grid gap-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="My Organization"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="org-slug">Organization Slug</Label>
                <Input
                  id="org-slug"
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                  placeholder="my-org"
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateOrganization}
                  disabled={loading || !orgName || !orgSlug}
                  className="gap-2"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Create"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="gap-2"
            >
              <Plus size={16} />
              Create Organization
            </Button>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex justify-center w-full border-t py-4">
          <p className="text-center text-xs text-neutral-500">
            Powered by{" "}
            <Link
              href="https://better-auth.com"
              className="underline"
              target="_blank"
            >
              <span className="dark:text-orange-200/90">better-auth.</span>
            </Link>
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}
