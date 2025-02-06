import { NextRequest } from "next/server";
import { ZodSchema } from "zod";
import { fromZodError } from "zod-validation-error";

export async function parseRequestDataWithSchema<T>(
  req: NextRequest,
  schema: ZodSchema<T>,
  adapter?: (data: unknown) => unknown,
): Promise<{ data: T; error?: never } | { data?: never; error: { message: string } }> {
  try {
    let body = await req.json();
    if (adapter) {
      body = adapter(body);
    }
    const result = schema.safeParse(body);
    if (result.success) {
      return { data: result.data };
    }
    const { message } = fromZodError(result.error);
    return { error: { message } };
  } catch {
    return { error: { message: "Invalid request body" } };
  }
}
