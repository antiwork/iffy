"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Pencil, Users, Mail, Building2, Settings, MoreVertical, Trash2, Plus, X } from "lucide-react";
import { organization } from "@/lib/auth-client";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface OrganizationManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    meta?: Record<string, any>;
    members?: Array<{
      id: string;
      userId: string;
      role: string;
      createdAt: string;
      user: {
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
  };
}

interface InviteFormData {
  email: string;
  role: "member" | "admin";
}

export function OrganizationManagement({ open, onOpenChange, organization: org }: OrganizationManagementProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [activeSubTab, setActiveSubTab] = useState("members");
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormData>({
    defaultValues: {
      email: "",
      role: "member",
    },
  });
  const [formData, setFormData] = useState({
    name: org.name,
    slug: org.slug,
    logo: org.logo || "",
  });

  const handleLeave = async () => {
    try {
      const { error } = await organization.leave({ organizationId: org.id });
      if (error) throw error;
      router.refresh();
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to leave organization:", err);
    }
  };

  const handleUpdate = async () => {
    try {
      const { error } = await organization.update({
        organizationId: org.id,
        data: {
          name: formData.name,
          slug: formData.slug,
          logo: formData.logo || undefined,
        },
      });
      if (error) throw error;
      org.name = formData.name;
      org.slug = formData.slug;
      org.logo = formData.logo || null;
      router.refresh();
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update organization:", err);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const { error } = await organization.updateMemberRole({
        organizationId: org.id,
        memberId,
        role: newRole as "member" | "admin" | "owner",
      });
      if (error) throw error;
      router.refresh();
    } catch (err: unknown) {
      console.error("Failed to update member role:", err);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await organization.removeMember({
        organizationId: org.id,
        memberIdOrEmail: memberId,
      });
      if (error) throw error;
      router.refresh();
    } catch (err: unknown) {
      console.error("Failed to remove member:", err);
    }
  };

  const onSubmit = async (data: InviteFormData) => {
    try {
      setInviteError(null);
      const { error } = await organization.inviteMember({
        organizationId: org.id,
        email: data.email.trim(),
        role: data.role,
      });

      if (error) {
        setInviteError(error.message || "Failed to send invitation");
        return;
      }

      router.refresh();
      reset();
      setShowInviteForm(false);
    } catch (err) {
      setInviteError("An unexpected error occurred");
      console.error("Failed to invite member:", err);
    }
  };

  const filteredMembers = org.members?.filter(
    (member) =>
      member.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredInvitations = org.invitations?.filter((invitation) =>
    invitation.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[600px] max-w-4xl flex-col gap-0 p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>Manage organization</DialogTitle>
          </DialogHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full">
            <div className="h-full w-[240px] border-r bg-stone-100 dark:bg-stone-900">
              <TabsList className="h-auto w-full flex-col p-2">
                <TabsTrigger value="profile" className="w-full cursor-pointer justify-start px-3 py-2">
                  <Building2 className="mr-2 h-4 w-4" />
                  General
                </TabsTrigger>
                <TabsTrigger value="people" className="w-full cursor-pointer justify-start px-3 py-2">
                  <Users className="mr-2 h-4 w-4" />
                  Members
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="h-full flex-1 overflow-y-auto p-6">
              <TabsContent value="profile" className="mt-0">
                <div className="flex h-full flex-col">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={isEditing ? formData.logo || undefined : org.logo || undefined} />
                      <AvatarFallback>{isEditing ? formData.name[0] : org.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <h3 className="text-xl font-medium">{isEditing ? formData.name : org.name}</h3>
                      <p className="text-muted-foreground text-xs">{isEditing ? formData.slug : org.slug}</p>
                    </div>
                    {!isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto cursor-pointer"
                        onClick={() => setIsEditing(true)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    )}
                  </div>
                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={isEditing ? formData.name : org.name}
                        readOnly={!isEditing}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mb-4"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Slug</Label>
                      <Input
                        value={isEditing ? formData.slug : org.slug}
                        readOnly={!isEditing}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        className="mb-4"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Logo URL</Label>
                      <Input
                        value={isEditing ? formData.logo : org.logo || ""}
                        readOnly={!isEditing}
                        onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                        className="mb-4"
                      />
                    </div>
                  </div>
                  <div className="mt-auto flex justify-end gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            setFormData({ name: org.name, slug: org.slug, logo: org.logo || "" });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleUpdate}>Save changes</Button>
                      </>
                    ) : (
                      <Button variant="destructive" onClick={handleLeave}>
                        Leave organization
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="people" className="mt-0">
                <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
                  <TabsList className="w-full">
                    <TabsTrigger value="members" className="flex-1 cursor-pointer">
                      <Users className="mr-2 h-4 w-4" />
                      Members
                    </TabsTrigger>
                    <TabsTrigger value="invitations" className="flex-1 cursor-pointer">
                      <Mail className="mr-2 h-4 w-4" />
                      Invitations
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="members" className="mt-4">
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
                      {showInviteForm && (
                        <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-2">
                          <div className="relative max-w-[300px] flex-1">
                            <Input
                              placeholder="Enter email address"
                              className="h-8 text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
                              {...register("email", {
                                required: "Email is required",
                                pattern: {
                                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                  message: "Invalid email address",
                                },
                              })}
                            />
                          </div>
                          <Select defaultValue="member" {...register("role")}>
                            <SelectTrigger className="h-8 w-[100px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin" className="text-xs">
                                Admin
                              </SelectItem>
                              <SelectItem value="member" className="text-xs">
                                Member
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Button type="submit" className="h-8">
                            Send
                          </Button>
                        </form>
                      )}
                      {(errors.email || inviteError) && (
                        <div className="text-destructive mt-1 text-xs">{errors.email?.message || inviteError}</div>
                      )}
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
                                    <Select
                                      value={member.role}
                                      onValueChange={(value) => handleRoleChange(member.id, value)}
                                    >
                                      <SelectTrigger className="w-[100px] px-2 text-xs">
                                        <SelectValue placeholder={member.role} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="owner" className="px-2 text-xs">
                                          Owner
                                        </SelectItem>
                                        <SelectItem value="admin" className="px-2 text-xs">
                                          Admin
                                        </SelectItem>
                                        <SelectItem value="member" className="px-2 text-xs">
                                          Member
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
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
                                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                          onClick={() => handleRemoveMember(member.id)}
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
                  </TabsContent>
                  <TabsContent value="invitations" className="mt-4">
                    <div className="space-y-4">
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
                      {showInviteForm && (
                        <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-2">
                          <div className="relative max-w-[300px] flex-1">
                            <Input
                              placeholder="Enter email address"
                              className="h-8 text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
                              {...register("email", {
                                required: "Email is required",
                                pattern: {
                                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                  message: "Invalid email address",
                                },
                              })}
                            />
                          </div>
                          <Select defaultValue="member" {...register("role")}>
                            <SelectTrigger className="h-8 w-[100px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin" className="text-xs">
                                Admin
                              </SelectItem>
                              <SelectItem value="member" className="text-xs">
                                Member
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Button type="submit" className="h-8">
                            Send
                          </Button>
                        </form>
                      )}
                      {(errors.email || inviteError) && (
                        <div className="text-destructive mt-1 text-xs">{errors.email?.message || inviteError}</div>
                      )}
                      <div className="rounded-md border">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-muted-foreground p-4 text-left text-xs font-medium">Email</th>
                              <th className="text-muted-foreground p-4 text-right text-xs font-medium">Invited</th>
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
                                    {invitation.createdAt
                                      ? format(new Date(invitation.createdAt), "MMM d, yyyy")
                                      : "N/A"}
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
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
