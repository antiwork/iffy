import { Control, FieldError, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StrategyFormValues, RuleFormValues } from "./schema";
import { X, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConfirm } from "@/components/ui/confirm";

interface StrategiesListProps {
  control: Control<RuleFormValues>;
  strategies: StrategyFormValues[];
  onChange: (strategies: StrategyFormValues[]) => void;
}

function Blocklist({
  value,
  onChange,
  onBlur,
  error,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  onBlur: () => void;
  error?: FieldError;
}) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputValue.trim()) {
        onChange([...value, inputValue.trim()]);
        setInputValue("");
        onBlur();
      }
    }
  };

  return (
    <div className={`border-input rounded-md border px-3 py-2 ${error ? "border-destructive" : ""}`}>
      <div className="flex flex-wrap gap-2" onClick={() => inputRef.current?.focus()}>
        {value.map((word, index) => (
          <div key={index} className="flex items-center rounded-full bg-gray-200 px-2 py-1 text-sm">
            <span>{word}</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-1 h-4 w-4 rounded-full p-0 transition-colors hover:bg-red-200"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange(value.filter((w) => w !== word));
                onBlur();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Input
          type="text"
          placeholder={value.length === 0 ? "Add words to blocklist" : ""}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={onBlur}
          ref={inputRef}
          className="flex-grow border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
    </div>
  );
}

function BlocklistStrategy({ control, index }: { control: Control<RuleFormValues>; index: number }) {
  return (
    <div className="space-y-2">
      <FormField
        control={control}
        name={`strategies.${index}.options.blocklist`}
        render={({ field, fieldState }) => (
          <FormItem>
            <FormControl>
              <Blocklist value={field.value} onChange={field.onChange} onBlur={field.onBlur} error={fieldState.error} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`strategies.${index}.options.matcher.exactMatch`}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center space-x-2">
            <FormControl>
              <input
                type="checkbox"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                onBlur={field.onBlur}
                className="h-4 w-4 rounded border-gray-300"
              />
            </FormControl>
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Exact match</div>
              <div className="text-sm text-gray-500">When checked, only full-word occurrences will trigger a block</div>
            </div>
          </FormItem>
        )}
      />
    </div>
  );
}

function PromptStrategy({ control, index }: { control: Control<RuleFormValues>; index: number }) {
  return (
    <div className="space-y-2">
      <FormField
        control={control}
        name={`strategies.${index}.options.topic`}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input placeholder="Topic" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`strategies.${index}.options.prompt`}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Textarea placeholder="Prompt" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`strategies.${index}.options.skipImages`}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center space-x-2">
            <FormControl>
              <input
                type="checkbox"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                onBlur={field.onBlur}
                className="h-4 w-4 rounded border-gray-300"
              />
            </FormControl>
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Skip images</div>
              <div className="text-sm text-gray-500">Ignore images when processing content</div>
            </div>
          </FormItem>
        )}
      />
    </div>
  );
}

function OpenAIStrategy({ control, index }: { control: Control<RuleFormValues>; index: number }) {
  return <div className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-500">Hidden Thresholds</div>;
}

export function StrategiesList({ control }: StrategiesListProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "strategies",
  });
  const confirm = useConfirm();

  const handleRemove = async (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      await confirm({
        title: "Remove strategy",
        description: "Are you sure you want to remove this strategy? This action cannot be undone.",
      })
    ) {
      remove(index);
    }
  };

  return (
    <FormField
      control={control}
      name="strategies"
      render={() => (
        <FormItem>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Strategies</h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add strategy
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-[var(--radix-dropdown-menu-content-available-height)] w-[var(--radix-dropdown-menu-trigger-width)]">
                  <DropdownMenuItem
                    onClick={() => append({ type: "Blocklist", options: { blocklist: [], exactMatch: false } })}
                  >
                    Blocklist
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => append({ type: "Prompt", options: { topic: "", prompt: "", skipImages: false } })}
                  >
                    Prompt
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="divide-y *:py-8 first:*:pt-0 last:*:pb-0">
              {fields.length > 0 ? (
                fields.map((field, index) => (
                  <div key={field.id} className="space-y-4">
                    <div className="flex flex-row items-center justify-between">
                      <div className="font-medium">{field.type}</div>
                      <Button variant="ghost" size="xs" onClick={(e) => handleRemove(index, e)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      {field.type === "Blocklist" && <BlocklistStrategy control={control} index={index} />}
                      {field.type === "Prompt" && <PromptStrategy control={control} index={index} />}
                      {field.type === "OpenAI" && <OpenAIStrategy control={control} index={index} />}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
                  <p className="text-sm text-gray-500">No strategies yet</p>
                </div>
              )}
            </div>
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  );
}
