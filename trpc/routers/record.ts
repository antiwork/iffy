import db from "@/db";
import protectedProcedure from "../procedures/protected";
import { router } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as schema from "@/db/schema";
import { eq, inArray, ilike, asc, desc, and, or, lt, gt, isNull, sql } from "drizzle-orm";

const paginationSchema = z.object({
  clerkOrganizationId: z.string(),
  cursor: z.object({ sort: z.number().int().optional(), skip: z.number().int().optional() }).default({}),
  limit: z.union([z.literal(10), z.literal(20), z.literal(30), z.literal(40), z.literal(50)]).default(50),
  sorting: z.array(z.object({ id: z.string(), desc: z.boolean() })).default([{ id: "sort", desc: true }]),
  search: z.string().optional(),
  statuses: z.enum(schema.records.moderationStatus.enumValues).array().optional(),
  entities: z.array(z.string()).optional(),
  userId: z.string().optional(),
});

const getWhereInput = (
  input: z.infer<typeof paginationSchema>,
  clerkOrganizationId: string,
  cursorValue?: number,
  sortingOrder?: boolean,
) => {
  const { search, statuses, entities, userId } = input;

  return (records: typeof schema.records) => {
    const conditions = [eq(records.clerkOrganizationId, clerkOrganizationId), isNull(records.deletedAt)];

    if (userId) {
      conditions.push(eq(records.userId, userId));
    }

    if (statuses?.length) {
      conditions.push(inArray(records.moderationStatus, statuses));
    }

    if (entities?.length) {
      conditions.push(inArray(records.entity, entities));
    }

    if (search) {
      conditions.push(or(ilike(records.name, `%${search}%`), eq(records.clientId, search)) ?? sql`true`);
    }

    if (cursorValue !== undefined && sortingOrder !== undefined) {
      if (sortingOrder) {
        conditions.push(lt(records.sort, cursorValue));
      } else {
        conditions.push(gt(records.sort, cursorValue));
      }
    }

    return and(...conditions);
  };
};

export const recordRouter = router({
  infinite: protectedProcedure.input(paginationSchema).query(async ({ input, ctx }) => {
    const { cursor, limit, sorting } = input;
    const { sort, skip } = cursor;
    const { clerkOrganizationId } = ctx;

    if (clerkOrganizationId !== input.clerkOrganizationId) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const supportsCursorPagination = sorting.length === 1 && sorting[0]?.id === "sort";

    let records;
    let nextCursor;

    // Cursor pagination is more performant, but only works with a single sort field
    if (supportsCursorPagination) {
      const sortingOrder = sorting[0]?.desc;
      const orderBy = sortingOrder ? desc(schema.records.sort) : asc(schema.records.sort);
      const where = getWhereInput(input, clerkOrganizationId, sort, sortingOrder);

      records = await db.query.records.findMany({
        where: where(schema.records),
        limit: limit + 1,
        orderBy: [orderBy],
        with: {
          moderations: {
            orderBy: [desc(schema.moderations.createdAt)],
            limit: 1,
            with: {
              moderationsToRules: {
                with: {
                  rule: {
                    with: {
                      preset: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (records.length > limit) {
        const nextItem = records.pop();
        nextCursor = { sort: nextItem!.sort };
      } else {
        nextCursor = undefined;
      }

      return { records, nextCursor };
    }

    // Offset pagination is more flexible, but less performant
    const offsetValue = skip ?? 0;
    const where = getWhereInput(input, clerkOrganizationId);

    records = await db.query.records.findMany({
      where: where(schema.records),
      limit: limit + 1,
      offset: offsetValue,
      orderBy: (recordsTable, { asc, desc }) =>
        sorting
          .map(({ id, desc: isDesc }) =>
            isDesc
              ? [desc(recordsTable[id as keyof typeof recordsTable])]
              : [asc(recordsTable[id as keyof typeof recordsTable])],
          )
          .flat(),
      with: {
        moderations: {
          orderBy: [desc(schema.moderations.createdAt)],
          limit: 1,
          with: {
            moderationsToRules: {
              with: {
                rule: {
                  with: {
                    preset: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (records.length > limit) {
      records.pop();
      nextCursor = { skip: offsetValue + limit };
    } else {
      nextCursor = undefined;
    }

    return { records, nextCursor };
  }),
});
