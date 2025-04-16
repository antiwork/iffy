"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useListOrganizations, useActiveOrganization, organization } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Plus, Building2, ChevronRight, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  logo: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export function OrganizationSwitcher() {
  const router = useRouter();
  const { data: organizations } = useListOrganizations();
  const { data: activeOrganization } = useActiveOrganization();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      logo: "",
    },
  });

  const handleSelect = async (orgId: string) => {
    const { error } = await organization.setActive({ organizationId: orgId });
    if (!error) {
      router.refresh();
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const { data, error } = await organization.create(values);
      if (error) throw error;
      setShowCreate(false);
      form.reset();
      router.refresh();
    } catch (err) {
      form.setError("root", {
        message: err instanceof Error ? err.message : "Failed to create organization",
      });
    }
  };

  if (!organizations?.length) return null;

  const otherOrganizations = organizations.filter((org) => org.id !== activeOrganization?.id);

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="focus-visible:ring-shadow-none flex items-center gap-2 px-2 focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={activeOrganization?.logo || undefined} />
              <AvatarFallback>
                <Building2 className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <span className="max-w-[200px] truncate">{activeOrganization?.name || "Select organization"}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="flex items-center justify-between p-2">
            <span className="text-xs font-medium text-stone-500">Organizations</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => {
                setIsOpen(false);
                setShowCreate(true);
              }}
            >
              <Plus className="mr-1 h-3 w-3" />
              Create
            </Button>
          </div>
          <DropdownMenuSeparator />
          {activeOrganization && (
            <DropdownMenuItem className="flex cursor-pointer items-center gap-2 px-2 py-1.5">
              <Avatar className="h-6 w-6">
                <AvatarImage src={activeOrganization.logo || undefined} />
                <AvatarFallback>
                  <Building2 className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="max-w-[200px] truncate">{activeOrganization.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-6 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push("/dashboard/settings");
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
                  onClick={() => handleSelect(org.id)}
                  className="flex cursor-pointer items-center gap-2 px-2 py-1.5"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={org.logo || undefined} />
                    <AvatarFallback>
                      <Building2 className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-[200px] truncate">{org.name}</span>
                  <ChevronRight className="ml-auto h-4 w-4 text-stone-500" />
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create organization</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Organization" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="my-org" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/logo.png" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.formState.errors.root && (
                <p className="text-sm text-red-500">{form.formState.errors.root.message}</p>
              )}
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                Create organization
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
