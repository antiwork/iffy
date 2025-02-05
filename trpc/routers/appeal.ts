import db from "@/db";
import protectedProcedure from "../procedures/protected";
import { router } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, inArray, ilike, asc, desc, and, or, lt, gt, sql, exists, count } from "drizzle-orm";
import * as schema from "@/db/schema";

const paginationSchema = z.object({
  clerkOrganizationId: z.string(),
  cursor: z.number().int().optional(),
  limit: z.union([z.literal(10), z.literal(20), z.literal(30), z.literal(40), z.literal(50)]).default(50),
  sort: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
  statuses: z.enum(schema.appealActionStatus.enumValues).array().optional(),
});

export const appealRouter = router({
  infinite: protectedProcedure.input(paginationSchema).query(async ({ input, ctx }) => {
    const { cursor, limit, sort, search, statuses } = input;
    const { clerkOrganizationId } = ctx;

    if (clerkOrganizationId !== input.clerkOrganizationId) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const sortingOrder = sort === "desc";
    const orderBy = sortingOrder ? desc(schema.appeals.sort) : asc(schema.appeals.sort);

    const conditions = [eq(schema.appeals.clerkOrganizationId, clerkOrganizationId)];

    if (statuses?.length) {
      conditions.push(inArray(schema.appeals.actionStatus, statuses));
    }

    if (cursor !== undefined) {
      if (sortingOrder) {
        conditions.push(lt(schema.appeals.sort, cursor));
      } else {
        conditions.push(gt(schema.appeals.sort, cursor));
      }
    }

    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          // Search in messages
          exists(
            db
              .select({ 1: sql`1` })
              .from(schema.messages)
              .where(
                and(
                  eq(schema.messages.appealId, schema.appeals.id),
                  or(ilike(schema.messages.subject, searchPattern), ilike(schema.messages.text, searchPattern)),
                ),
              ),
          ),
          // Search in users
          exists(
            db
              .select({ 1: sql`1` })
              .from(schema.users)
              .innerJoin(schema.userActions, eq(schema.userActions.userId, schema.users.id))
              .where(
                and(
                  eq(schema.userActions.id, schema.appeals.userActionId),
                  or(
                    ilike(schema.users.username, searchPattern),
                    ilike(schema.users.email, searchPattern),
                    ilike(schema.users.name, searchPattern),
                    ilike(schema.users.clientId, searchPattern),
                  ),
                ),
              ),
          ),
        ) ?? sql`true`,
      );
    }

    const appeals = await db.query.appeals.findMany({
      where: and(...conditions),
      limit: limit + 1,
      orderBy: [orderBy],
      with: {
        userAction: {
          with: {
            user: true,
          },
        },
        messages: {
          orderBy: [desc(schema.messages.createdAt)],
          limit: 1,
          with: {
            from: true,
          },
        },
      },
    });

    let nextCursor: typeof cursor | undefined = undefined;
    if (appeals.length > limit) {
      const nextItem = appeals.pop();
      nextCursor = nextItem!.sort;
    }

    const [total, current] = await Promise.all([
      db
        .select({ count: count() })
        .from(schema.appeals)
        .where(eq(schema.appeals.clerkOrganizationId, clerkOrganizationId)),
      db
        .select({ count: count() })
        .from(schema.appeals)
        .where(and(...conditions)),
    ]);
    return { appeals, total, current, nextCursor };
  }),
});
