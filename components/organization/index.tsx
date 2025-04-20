"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Building2, Users } from "lucide-react";
import { organization, useActiveOrganization, useListOrganizations, useSession } from "@/lib/auth-client";
import { ProfileTab } from "./profile-tab";
import { MembersTab } from "./members-tab";
import { InvitationsTab } from "./invitations-tab";
import { useToast } from "@/hooks/use-toast";

interface OrganizationManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrganizationManagement({ open, onOpenChange }: OrganizationManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const { refetch: refetchActiveOrganization, data: activeOrganization } = useActiveOrganization();
  const [activeTab, setActiveTab] = useState("profile");
  const [activeSubTab, setActiveSubTab] = useState("members");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  const isOwner = useMemo(
    () => activeOrganization?.members?.find((member) => member.userId === session?.user.id)?.role === "owner",
    [session?.user.id, activeOrganization],
  );

  const handleLeave = async () => {
    if (!activeOrganization) return;
    try {
      const { error } = await organization.leave({ organizationId: activeOrganization.id });
      if (error) throw error;
      router.refresh();
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to leave organization:", err);
    }
  };

  const handleDelete = async () => {
    if (!activeOrganization) return;
    try {
      const { error } = await organization.delete({ organizationId: activeOrganization.id });
      if (error) throw error;
      router.refresh();
      refetchActiveOrganization();
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to delete organization:", err);
    }
  };

  const handleUpdate = async (data: { name: string; slug: string; logo: string }) => {
    if (!activeOrganization) return;
    try {
      const { error } = await organization.update({ organizationId: activeOrganization.id, data });
      if (error) throw error;
      refetchActiveOrganization();
    } catch (err) {
      if (err instanceof Error) {
        toast({
          title: "Failed to update organization",
          description: err.message,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[600px] max-w-4xl flex-col gap-0 p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>Manage organization</DialogTitle>
          </DialogHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full overflow-hidden">
            <div className="h-full w-[240px] border-r bg-stone-100 dark:bg-stone-900">
              <TabsList className="h-auto w-full flex-col p-2">
                <TabsTrigger value="profile" className="w-full cursor-pointer justify-start rounded px-3 py-2">
                  <Building2 className="mr-2 h-4 w-4" />
                  General
                </TabsTrigger>
                <TabsTrigger value="people" className="w-full cursor-pointer justify-start rounded px-3 py-2">
                  <Users className="mr-2 h-4 w-4" />
                  Members
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="flex h-full flex-1 flex-col overflow-y-auto">
              <div className="flex-1 p-6">
                <TabsContent value="profile" className="mt-0 h-full">
                  <ProfileTab
                    onLeaveOrDelete={() => (isOwner ? setShowDeleteDialog(true) : setShowLeaveDialog(true))}
                    isOwner={isOwner}
                    onUpdate={handleUpdate}
                  />
                </TabsContent>
                <TabsContent value="people" className="mt-0 h-full">
                  <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="h-full">
                    <TabsList className="w-full rounded">
                      <TabsTrigger value="members" className="flex-1 cursor-pointer rounded">
                        <Users className="mr-2 h-4 w-4" />
                        Members
                      </TabsTrigger>
                      <TabsTrigger value="invitations" className="flex-1 cursor-pointer rounded">
                        <Users className="mr-2 h-4 w-4" />
                        Invitations
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="members" className="mt-4 h-full">
                      <MembersTab />
                    </TabsContent>
                    <TabsContent value="invitations" className="mt-4 h-full">
                      <InvitationsTab />
                    </TabsContent>
                  </Tabs>
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent className="flex flex-col gap-6 rounded-xl p-6">
          <div className="space-y-2">
            <DialogTitle className="text-xl font-semibold">Leave organization</DialogTitle>
            <DialogDescription className="text-gray-500">
              Are you sure you want to leave this organization? You will lose access to all organization data.
            </DialogDescription>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowLeaveDialog(false)} className="flex-1 cursor-pointer">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLeave} className="flex-1 cursor-pointer">
              Leave organization
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="flex flex-col gap-6 rounded-xl p-6">
          <div className="space-y-2">
            <DialogTitle className="text-xl font-semibold">Delete organization</DialogTitle>
            <DialogDescription className="text-gray-500">
              Are you sure you want to delete this organization? This action cannot be undone. All organization data
              will be permanently deleted.
            </DialogDescription>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="flex-1 cursor-pointer">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="flex-1 cursor-pointer">
              Delete organization
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
