import { NextRequest } from "next/server";
import { ZodSchema, z } from "zod";
import { fromZodError } from "zod-validation-error";

export async function parseRequestBody<TInput, TOutput>(
  req: NextRequest,
  schema: ZodSchema<TOutput, z.ZodTypeDef, TInput>,
  adapter?: (data: unknown) => unknown,
): Promise<{ data: TOutput; error?: never } | { data?: never; error: { message: string } }> {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    if (adapter) {
      body = adapter(body);
    }
    const result = schema.safeParse(body);
    if (result.success) {
      return { data: result.data };
    }
    const { message } = fromZodError(result.error);
    return { error: { message } };
  } catch (error) {
    return { error: { message: "Invalid request body" } };
  }
}

export async function parseQueryParams<TInput, TOutput>(
  req: NextRequest,
  schema: ZodSchema<TOutput, z.ZodTypeDef, TInput>,
  adapter?: (data: Record<string, string>) => Record<string, string>,
): Promise<{ data: TOutput; error?: never } | { data?: never; error: { message: string } }> {
  try {
    let query = Object.fromEntries(req.nextUrl.searchParams);

    if (adapter) {
      query = adapter(query);
    }
    const result = schema.safeParse(query);
    if (result.success) {
      return { data: result.data };
    }
    const { message } = fromZodError(result.error);
    return { error: { message } };
  } catch (error) {
    return { error: { message: "Invalid query parameters" } };
  }
}
