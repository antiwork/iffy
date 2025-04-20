"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { useActiveOrganization } from "@/lib/auth-client";
import { InviteUser } from "./invite-user";
import { format } from "date-fns";

export function InvitationsTab() {
  const { data: activeOrganization, refetch: refetchActiveOrganization } = useActiveOrganization();
  const [searchQuery, setSearchQuery] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);

  const filteredInvitations =
    activeOrganization?.invitations?.filter((invitation) =>
      invitation.email.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2">
        <div className="relative max-w-[300px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search invitations..."
            className="h-8 pl-9 text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {!showInviteForm ? (
          <Button onClick={() => setShowInviteForm(true)} className="h-8">
            Invite
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => setShowInviteForm(false)} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <InviteUser show={showInviteForm} setShow={setShowInviteForm} />
      <div className="mt-4 rounded-md border">
        <table className="w-full">
          <thead className="bg-background">
            <tr className="border-b">
              <th className="text-muted-foreground p-4 text-left text-xs font-medium">Email</th>
              <th className="text-muted-foreground p-4 text-right text-xs font-medium">Expires At</th>
              <th className="text-muted-foreground p-4 text-right text-xs font-medium">Role</th>
              <th className="text-muted-foreground p-4 text-right text-xs font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvitations?.map((invitation) => (
              <tr key={invitation.id} className="border-b last:border-b-0">
                <td className="p-4">
                  <div className="text-sm font-medium">{invitation.email}</div>
                </td>
                <td className="p-4">
                  <div className="text-muted-foreground text-right text-xs">
                    {invitation.expiresAt ? format(new Date(invitation.expiresAt), "MMM d, yyyy") : "N/A"}
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-right text-xs capitalize">{invitation.role}</div>
                </td>
                <td className="p-4">
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        invitation.status === "pending"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"
                          : invitation.status === "accepted"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                      }`}
                    >
                      {invitation.status}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
