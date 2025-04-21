"use client";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import { organization, useActiveOrganization } from "@/lib/auth-client";

interface InviteUserInput {
  show: boolean;
  setShow: React.Dispatch<boolean>;
}

interface InviteFormData {
  email: string;
  role: "admin" | "member" | "owner";
}

export const InviteUser = ({ show, setShow }: InviteUserInput) => {
  const { data: activeOrganization } = useActiveOrganization();
  const [inviteError, setInviteError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<InviteFormData>({
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  const onSubmit = async (data: InviteFormData) => {
    if (!activeOrganization) return;
    try {
      const { error } = await organization.inviteMember({
        organizationId: activeOrganization.id,
        email: data.email.trim(),
        role: data.role,
      });
      setInviteError(null);
      reset();
      setShow(false);
    } catch (err) {
      setInviteError("An unexpected error occurred");
      console.error("Failed to invite member:", err);
    }
  };

  if (!show) return null;

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-2 flex items-center gap-2">
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
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
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
          )}
        />
        <Button type="submit" className="h-8">
          Send
        </Button>
      </form>
      {(errors.email || inviteError) && (
        <div className="mt-1 text-xs text-red-500">{errors.email?.message || inviteError}</div>
      )}
    </>
  );
};
