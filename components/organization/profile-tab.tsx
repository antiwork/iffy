"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pencil } from "lucide-react";
import { useActiveOrganization } from "@/lib/auth-client";
import { Skeleton } from "../ui/skeleton";

interface ProfileTabProps {
  isOwner: boolean;
  onUpdate: (data: { name: string; slug: string; logo: string }) => Promise<void>;
  onLeaveOrDelete: () => void;
}

type FormData = {
  name: string;
  slug: string;
  logo: string;
};

type FieldKey = keyof FormData;

export function ProfileTab({ isOwner, onUpdate, onLeaveOrDelete }: ProfileTabProps) {
  const { data: org } = useActiveOrganization();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    slug: "",
    logo: "",
  });

  useEffect(() => {
    if (org) {
      setFormData({
        name: org.name,
        slug: org.slug,
        logo: org.logo || "",
      });
    }
  }, [org]);

  if (!org) {
    return (
      <div className="p-4">
        <Skeleton className="h-[200px]" />
      </div>
    );
  }

  const fields: FieldKey[] = ["name", "slug", "logo"];

  return (
    <div className="flex min-h-full flex-col">
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={formData.logo} />
            <AvatarFallback>{formData.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-medium">{formData.name}</div>
            <div className="text-muted-foreground text-xs">{formData.slug}</div>
          </div>
        </div>

        <div className="rounded-lg border p-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium">Organization details</div>
            {!isEditing && (
              <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setIsEditing(true)}>
                <Pencil className="h-3 w-3" />
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {fields.map((field) => (
              <div key={field}>
                {isEditing ? (
                  <div>
                    <div className="text-muted-foreground mb-1.5 text-xs">
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </div>
                    <Input
                      value={formData[field]}
                      onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                      placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                      className="h-8 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="text-muted-foreground text-xs">
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </div>
                    <div className="text-sm">{formData[field] || "Not set"}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
          {isEditing && (
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                onClick={() => onUpdate(formData).then(() => setIsEditing(false))}
                className="focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(false)}
                className="focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto flex justify-end pt-6">
        <Button
          size="sm"
          variant="destructive"
          onClick={onLeaveOrDelete}
          className="focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          {isOwner ? "Delete organization" : "Leave organization"}
        </Button>
      </div>
    </div>
  );
}
