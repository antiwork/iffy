import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Plus, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setOpen(true);
    setCopied(true);
  };

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          onClick={handleCopy}
          onMouseEnter={() => setCopied(false)}
          onMouseLeave={() => setOpen(false)}
        >
          <Copy className="mr-2 h-4 w-4" />
          <pre>{text}</pre>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{copied ? "Copied" : "Copy"}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export const KeyCreationDialog = ({
  onCreate,
}: {
  onCreate: (name: string) => Promise<{ success: true; key: string } | { success: false }>;
}) => {
  const [raw, setRaw] = React.useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const response = await onCreate(data.name);
    if (response.success) {
      setRaw(response.key);
    }
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) {
          setRaw(null);
          form.reset();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="mt-4">
          <Plus className="mr-2 h-4 w-4" />
          Create API key
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[690px]">
        {raw ? (
          <>
            <DialogHeader>
              <DialogTitle>Copy API key</DialogTitle>
            </DialogHeader>
            <DialogDescription className="space-y-4">
              <p>
                Here&apos;s your key! Copy it before closing this dialog. You won&apos;t be able to access it again.
              </p>
              <CopyButton text={raw} />
            </DialogDescription>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create API key</DialogTitle>
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
                        <Input placeholder="Development" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Create</Button>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
