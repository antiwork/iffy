"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Plus, ChevronRight, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useListOrganizations, useActiveOrganization, organization } from "@/lib/auth-client";
import { CreateOrganization } from "@/components/create-organization";
import { OrganizationManagement } from "@/components/organization-management";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  meta?: Record<string, any>;
  createdAt: Date;
  members?: Array<{
    id: string;
    userId: string;
    role: string;
    createdAt: string;
    organizationId: string;
    teamId?: string;
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
    };
  }>;
  invitations?: Array<{
    id: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
  }>;
}

export function OrganizationSwitcher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const { data: organizations } = useListOrganizations();
  const { data: activeOrganization } = useActiveOrganization();

  const handleSelect = async (org: Organization) => {
    const { error } = await organization.setActive({ organizationId: org.id });
    if (!error) {
      router.refresh();
    }
  };

  const formatOrganization = (org: any): Organization => ({
    ...org,
    members: org.members?.map((member: any) => ({
      ...member,
      createdAt: member.createdAt.toISOString(),
    })),
    invitations: org.invitations?.map((invitation: any) => ({
      ...invitation,
      createdAt: invitation.expiresAt.toISOString(),
    })),
  });

  if (!organizations?.length) return null;

  const otherOrganizations = organizations.filter((org) => org.id !== activeOrganization?.id);

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="w-[10rem] justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={activeOrganization?.logo || undefined} />
                <AvatarFallback>{activeOrganization?.name?.[0]}</AvatarFallback>
              </Avatar>
              <span className="truncate">{activeOrganization?.name || "Select organization"}</span>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[200px]">
          <DropdownMenuLabel>Organizations</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {activeOrganization && (
            <DropdownMenuItem
              className="flex items-center gap-2 px-2 py-1.5 focus:bg-transparent"
              onSelect={(e) => e.preventDefault()}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={activeOrganization.logo || undefined} />
                <AvatarFallback>{activeOrganization.name[0]}</AvatarFallback>
              </Avatar>
              <span className="max-w-[200px] truncate">{activeOrganization.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-5 px-1.5 text-xs hover:bg-stone-200 dark:hover:bg-stone-700"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentOrg(formatOrganization(activeOrganization));
                  setManageOpen(true);
                }}
              >
                <Settings className="mr-1 h-3 w-3" />
                Manage
              </Button>
            </DropdownMenuItem>
          )}
          {otherOrganizations.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {otherOrganizations.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => handleSelect(formatOrganization(org))}
                  className="flex cursor-pointer items-center gap-2 px-2 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={org.logo || undefined} />
                    <AvatarFallback>{org.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="max-w-[200px] truncate">{org.name}</span>
                  <ChevronRight className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </DropdownMenuItem>
              ))}
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCreateOpen(true)} className="hover:bg-stone-100 dark:hover:bg-stone-800">
            <Plus className="mr-2 h-4 w-4" />
            Create organization
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateOrganization open={createOpen} onOpenChange={setCreateOpen} />
      {currentOrg && (
        <OrganizationManagement open={manageOpen} onOpenChange={setManageOpen} organization={currentOrg} />
      )}
    </>
  );
}
