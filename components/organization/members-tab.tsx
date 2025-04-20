"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MoreVertical, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { organization, useActiveOrganization } from "@/lib/auth-client";
import { InviteUser } from "./invite-user";
import { useToast } from "@/hooks/use-toast";

export function MembersTab() {
  const { data: activeOrganization, refetch: refetchActiveOrganization } = useActiveOrganization();
  const [searchQuery, setSearchQuery] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const { toast } = useToast();

  const filteredMembers = useMemo(() => {
    if (!activeOrganization || !activeOrganization.members) return [];
    return activeOrganization.members.filter(
      (member) =>
        member.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.user.email.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [activeOrganization, searchQuery]);

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!activeOrganization) return;
    try {
      const { error } = await organization.updateMemberRole({
        organizationId: activeOrganization.id,
        memberId,
        role: newRole as "member" | "admin" | "owner",
      });
      if (error) throw new Error(error.message);
      refetchActiveOrganization();
    } catch (err) {
      if (err instanceof Error)
        toast({ title: "Unable to Update Role", description: err.message, variant: "destructive" });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!activeOrganization) return;
    try {
      const { error } = await organization.removeMember({
        organizationId: activeOrganization.id,
        memberIdOrEmail: memberId,
      });
      if (error) throw error;
      refetchActiveOrganization();
    } catch (err: unknown) {
      console.error("Failed to update member role:", err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative max-w-[300px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder="Search members..."
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
      {showInviteForm && <InviteUser show={showInviteForm} setShow={setShowInviteForm} />}
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-muted-foreground p-4 text-left text-xs font-medium">Member</th>
              <th className="text-muted-foreground p-4 text-right text-xs font-medium">Joined</th>
              <th className="text-muted-foreground p-4 text-right text-xs font-medium">Role</th>
              <th className="text-muted-foreground p-4 text-right text-xs font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers?.map((member) => (
              <tr key={member.id} className="border-b last:border-b-0">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={member.user.image || undefined} />
                      <AvatarFallback>{member.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">{member.user.name}</div>
                      <div className="text-muted-foreground text-xs">{member.user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-muted-foreground text-right text-xs">
                    {member.createdAt ? format(new Date(member.createdAt), "MMM d, yyyy") : "N/A"}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex justify-end">
                    {member.role !== "owner" ? (
                      <Select value={member.role} onValueChange={(value) => handleRoleChange(member.id, value)}>
                        <SelectTrigger className="w-[100px] px-2 text-xs">
                          <SelectValue placeholder={member.role} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin" className="px-2 text-xs">
                            Admin
                          </SelectItem>
                          <SelectItem value="member" className="px-2 text-xs">
                            Member
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs font-thin">Owner</span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className={
                            member.role === "owner"
                              ? "text-muted-foreground"
                              : "text-destructive focus:text-destructive focus:bg-destructive/10"
                          }
                          onClick={() => member.role !== "owner" && handleRemoveMember(member.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
