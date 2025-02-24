"use client";

import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { submitAppeal } from "./actions";
import { submitAppealSchema } from "./validation";
import { Checkbox } from "@/components/ui/checkbox";

const confirmSchema = z.object({
  confirm: z.literal<boolean>(true),
  text: z.string(),
});

export function AppealForm({ token }: { token: string }) {
  const submitAppealWithToken = submitAppeal.bind(null, token);
  const form = useForm<z.infer<typeof confirmSchema>>({
    mode: "onChange",
    resolver: zodResolver(confirmSchema),
    defaultValues: {
      confirm: false,
      text: "",
    },
  });

  async function handleSubmit(values: z.infer<typeof submitAppealSchema>) {
    const result = await submitAppealWithToken({ ...values });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="confirm"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  I have updated all of the flagged records above and removed any content that violates the rules
                </FormLabel>
                <FormDescription>
                  Appeals are only considered if all flagged records have been updated and all content that violates the
                  rules has been removed. If you are still certain that the moderation is in error, you may request a
                  human review below.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Appeal Text</FormLabel>
              <FormControl>
                <Textarea
                  disabled={!form.formState.isValid}
                  placeholder="Describe why you think the above records have been flagged incorrectly"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={!form.formState.isValid || form.formState.isSubmitting}>
          Submit Appeal
        </Button>
      </form>
    </Form>
  );
}
