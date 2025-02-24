"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, Edit, Eye, EyeOff } from "lucide-react";
import { KeyCreationDialog } from "./key-creation-dialog";
import { KeyDeletionDialog } from "./key-deletion-dialog";
import { createWebhook, updateWebhookUrl, createApiKey, deleteApiKey, updateOrganizationSettings } from "./actions";
import * as schema from "@/db/schema";
import { DayFull } from "@/components/date";

export type Key = Omit<typeof schema.apiKeys.$inferSelect, "encryptedKey"> & {
  previewKey: string;
  createdBy: string;
};

const KeyRow = ({ value, onDelete }: { value: Key; onDelete: (id: string) => void }) => (
  <TableRow>
    <TableCell className="font-medium">{value.name}</TableCell>
    <TableCell>
      <pre>{value.previewKey}</pre>
    </TableCell>
    <TableCell>{value.lastUsedAt ? <DayFull date={value.lastUsedAt} /> : "Never"}</TableCell>
    <TableCell>
      <DayFull date={value.createdAt} />
    </TableCell>
    <TableCell>{value.createdBy}</TableCell>
    <TableCell>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={(evt) => evt.preventDefault()}>
            <KeyDeletionDialog value={value} onDelete={onDelete} />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TableCell>
  </TableRow>
);

export const Settings = ({
  keys: initialKeys,
  webhookEndpoint: initialWebhookEndpoint,
  organizationSettings: initialOrganizationSettings,
}: {
  keys: Key[];
  webhookEndpoint?: { id: string; url: string; secret: string };
  organizationSettings: {
    stripeApiKey: boolean;
  };
}) => {
  const [keys, setKeys] = React.useState(initialKeys);
  const [webhookEndpoint, setWebhookEndpoint] = React.useState(initialWebhookEndpoint);
  const [isEditingWebhook, setIsEditingWebhook] = React.useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = React.useState(false);
  const [webhookUrl, setWebhookUrl] = React.useState(webhookEndpoint?.url || "");
  const [stripeApiKey, setStripeApiKey] = React.useState("");
  const [isStripeApiKeySet, setIsStripeApiKeySet] = React.useState(!!initialOrganizationSettings.stripeApiKey);
  const [hasStripeApiKeyError, setHasStripeApiKeyError] = React.useState(false);
  const [showStripeApiKey, setShowStripeApiKey] = React.useState(false);

  const handleCreateKey = async (name: string): Promise<{ success: true; key: string } | { success: false }> => {
    try {
      const result = await createApiKey({ name });
      const data = result?.data;
      if (data) {
        const { key, decryptedKey } = data;
        setKeys((prevKeys) => [...prevKeys, key]);
        return { success: true, key: decryptedKey };
      }
    } catch (error) {
      console.error("Error creating API key:", error);
    }
    return { success: false };
  };

  const handleDeleteKey = async (id: string) => {
    const deleteApiKeyWithId = deleteApiKey.bind(null, id);
    try {
      await deleteApiKeyWithId();
      setKeys((prevKeys) => prevKeys.filter((k) => k.id !== id));
    } catch (error) {
      console.error("Error deleting API key:", error);
    }
  };

  const handleWebhookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (webhookEndpoint) {
      const updateWebhookWithId = updateWebhookUrl.bind(null, webhookEndpoint.id);
      const result = await updateWebhookWithId({ url: webhookUrl });
      const data = result?.data;
      if (data) {
        setWebhookEndpoint(data);
      } else {
        console.error("Failed to update webhook");
      }
    } else {
      const result = await createWebhook({ url: webhookUrl });
      const data = result?.data;
      if (data) {
        setWebhookEndpoint(data);
      } else {
        console.error("Failed to update webhook");
      }
    }
    setIsEditingWebhook(false);
  };

  const isValidStripeApiKey = (key: string) => {
    return /^(sk_test_|sk_live_)[0-9a-zA-Z]{24,}$/.test(key);
  };

  const handleStripeApiKeyChange = async (e: React.FocusEvent<HTMLInputElement>) => {
    if (isStripeApiKeySet) return;
    const newKey = e.target.value;
    if (isValidStripeApiKey(newKey)) {
      try {
        const result = await updateOrganizationSettings({ stripeApiKey: newKey });
        if (result?.data) {
          setIsStripeApiKeySet(true);
          setStripeApiKey(newKey);
          setHasStripeApiKeyError(false);
        }
      } catch (error) {
        console.error("Error updating Stripe API key:", error);
        setHasStripeApiKeyError(true);
      }
    } else {
      setHasStripeApiKeyError(true);
    }
  };

  const handleClearStripeApiKey = async () => {
    try {
      const result = await updateOrganizationSettings({ stripeApiKey: "" });
      if (result?.data) {
        setIsStripeApiKeySet(false);
        setStripeApiKey("");
        setHasStripeApiKeyError(false);
      }
    } catch (error) {
      console.error("Error clearing Stripe API key:", error);
    }
  };

  return (
    <div className="text-gray-950 dark:text-stone-50">
      <h2 className="mb-2 text-2xl font-bold">Webhook</h2>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Receive moderation and user status updates as events in your application
      </p>
      <div className="mb-8">
        {isEditingWebhook ? (
          <form onSubmit={handleWebhookSubmit} className="flex items-center gap-4">
            <Input
              type="url"
              placeholder="Enter webhook URL"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="grow"
            />
            <Button type="submit" disabled={!webhookUrl.trim()}>
              Save webhook
            </Button>
          </form>
        ) : (
          <div className="flex items-center gap-4">
            <div className="grow text-xs">
              <div className="text-sm">
                <strong className="text-base">URL:</strong> {webhookEndpoint?.url || "No webhook set"}
              </div>
              {webhookEndpoint && (
                <div className="mt-1 flex items-center text-sm">
                  <strong className="text-base">Secret:</strong>
                  <span className="ml-2 font-mono">
                    {showWebhookSecret ? webhookEndpoint.secret : "*".repeat(webhookEndpoint.secret.length)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                    className="ml-auto"
                  >
                    {showWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </div>
            <Button onClick={() => setIsEditingWebhook(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit webhook
            </Button>
          </div>
        )}
      </div>

      <h2 className="mb-2 text-2xl font-bold">API Keys</h2>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Create and manage API keys to authenticate API requests
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead>Preview</TableHead>
            <TableHead>Last used</TableHead>
            <TableHead>Created at</TableHead>
            <TableHead>Created by</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {keys.map((value) => (
            <KeyRow key={value.id} value={value} onDelete={handleDeleteKey} />
          ))}
        </TableBody>
      </Table>
      <KeyCreationDialog onCreate={handleCreateKey} />

      <h2 className="mt-8 mb-2 text-2xl font-bold">Stripe Integration</h2>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Connect a Stripe API key to enable Iffy to pause payments and payouts for users with connected accounts who are
        suspended or banned
      </p>
      <div>
        <label htmlFor="stripeApiKey" className="block text-sm font-medium text-gray-950 dark:text-stone-50">
          API key
        </label>
        <div className="relative mt-1 rounded-md shadow-xs">
          <Input
            id="stripeApiKey"
            type={showStripeApiKey ? "text" : "password"}
            value={isStripeApiKeySet ? "*".repeat(24) : stripeApiKey}
            onChange={(e) => {
              if (!isStripeApiKeySet) {
                setStripeApiKey(e.target.value);
                setHasStripeApiKeyError(false);
              }
            }}
            onBlur={handleStripeApiKeyChange}
            className={`pr-20 ${hasStripeApiKeyError ? "border-red-500" : ""}`}
            placeholder="sk_live_1234567890abcdefghijklmnop"
            readOnly={isStripeApiKeySet}
          />
          <div className="absolute inset-y-0 right-0 flex items-center">
            {!isStripeApiKeySet && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStripeApiKey(!showStripeApiKey)}
                className="h-full px-2 dark:text-stone-50"
                type="button"
              >
                {showStripeApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            )}
            {isStripeApiKeySet && (
              <Button variant="link" size="sm" onClick={handleClearStripeApiKey} className="h-full px-2" type="button">
                Clear
              </Button>
            )}
          </div>
        </div>
        {hasStripeApiKeyError && <p className="mt-2 text-sm text-red-600">Invalid key</p>}
      </div>
    </div>
  );
};
