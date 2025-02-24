import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RuleFormValues, ruleFormSchema } from "./schema";
import type { RuleWithStrategies } from "@/services/rules";
import type * as schema from "@/db/schema";
import { StrategiesList } from "./strategies-list";
import { useCallback, useEffect } from "react";

interface RuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RuleFormValues) => void;
  initialData?: RuleWithStrategies;
  presets: (typeof schema.presets.$inferSelect)[];
}

export function RuleDialog({ open, onOpenChange, onSubmit, initialData, presets }: RuleDialogProps) {
  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      type: "Preset",
      presetId: "",
    },
  });

  const reset = useCallback(() => {
    if (initialData) {
      form.reset(
        initialData
          ? initialData.preset
            ? {
                type: "Preset",
                presetId: initialData.preset?.id,
              }
            : {
                type: "Custom",
                name: initialData.name ?? undefined,
                description: initialData.description ?? undefined,
                strategies: initialData.strategies,
              }
          : {
              type: "Preset",
              presetId: "",
            },
      );
    } else {
      form.reset({
        type: "Preset",
        presetId: "",
      });
    }
  }, [form, initialData]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
    }
    onOpenChange(open);
  };

  useEffect(() => {
    reset();
  }, [form, reset]);

  const type = form.watch("type");

  const availablePresets = initialData?.preset ? [initialData.preset, ...presets] : presets;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90%] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit rule" : "New rule"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!initialData}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Preset">Preset</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {type === "Preset" && (
              <FormField
                control={form.control}
                name="presetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preset</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={availablePresets.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={availablePresets.length === 0 ? "No remaining presets" : "Select preset"}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availablePresets.map((preset) => (
                          <SelectItem key={preset.id} value={preset.id}>
                            {preset.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {type === "Custom" && (
              <>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="My Rule" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Content that is against our terms of service" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <StrategiesList
                  control={form.control}
                  strategies={form.watch("strategies") || []}
                  onChange={(strategies) => form.setValue("strategies", strategies)}
                />
              </>
            )}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{initialData ? "Save changes" : "Create rule"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
