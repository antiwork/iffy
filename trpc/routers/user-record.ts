import db from "@/db";
import protectedProcedure from "../procedures/protected";
import { router } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, inArray, ilike, asc, desc, and, or, lt, gt, sql } from "drizzle-orm";
import * as schema from "@/db/schema";

const paginationSchema = z.object({
  organizationId: z.string(),
  cursor: z.object({ sort: z.number().int().optional(), skip: z.number().int().optional() }).default({}),
  limit: z.union([z.literal(10), z.literal(20), z.literal(30), z.literal(40), z.literal(50)]).default(20),
  sorting: z.array(z.object({ id: z.string(), desc: z.boolean() })).default([{ id: "sort", desc: true }]),
  search: z.string().optional(),
  statuses: z.enum(schema.userActions.status.enumValues).array().optional(),
});

const getWhereInput = (
  input: z.infer<typeof paginationSchema>,
  organizationId: string,
  cursorValue?: number,
  sortingOrder?: boolean,
) => {
  const { search, statuses } = input;

  return (userRecords: typeof schema.userRecords) => {
    const conditions = [eq(userRecords.organizationId, organizationId)];

    if (statuses?.length) {
      conditions.push(inArray(userRecords.actionStatus, statuses));
    }

    if (search) {
      conditions.push(
        or(
          ilike(userRecords.username, `%${search}%`),
          ilike(userRecords.email, `%${search}%`),
          ilike(userRecords.name, `%${search}%`),
          ilike(userRecords.clientId, `%${search}%`),
        ) ?? sql`true`,
      );
    }

    if (cursorValue !== undefined && sortingOrder !== undefined) {
      const cursorSort = cursorValue;
      if (sortingOrder) {
        conditions.push(lt(userRecords.sort, cursorSort));
      } else {
        conditions.push(gt(userRecords.sort, cursorSort));
      }
    }

    return and(...conditions);
  };
};

export const userRecordRouter = router({
  infinite: protectedProcedure.input(paginationSchema).query(async ({ input, ctx }) => {
    const { cursor, limit, sorting } = input;
    const { organizationId } = ctx;

    if (organizationId !== input.organizationId) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const supportsCursorPagination = sorting.length === 1 && sorting[0]?.id === "sort";
    let userRecords;
    let nextCursor;

    // Cursor pagination is more performant, but only works with a single sort field
    if (supportsCursorPagination) {
      const { sort } = cursor;
      const sortingOrder = sorting[0]?.desc;
      const orderBy = sortingOrder ? desc(schema.userRecords.sort) : asc(schema.userRecords.sort);
      const where = getWhereInput(input, organizationId, sort, sortingOrder);

      userRecords = await db.query.userRecords.findMany({
        where: where(schema.userRecords),
        limit: limit + 1,
        orderBy: [orderBy],
        with: {
          actions: {
            orderBy: [desc(schema.userActions.createdAt)],
            limit: 1,
          },
        },
      });

      if (userRecords.length > limit) {
        const nextItem = userRecords.pop();
        nextCursor = { sort: nextItem!.sort };
      } else {
        nextCursor = undefined;
      }

      return { userRecords, nextCursor };
    }

    // Offset pagination is more flexible, but less performant
    const { skip } = cursor;
    const offsetValue = skip ?? 0;
    const where = getWhereInput(input, organizationId);

    userRecords = await db.query.userRecords.findMany({
      where: where(schema.userRecords),
      limit: limit + 1,
      offset: offsetValue,
      orderBy: (usersTable, { asc, desc }) =>
        sorting
          .map(({ id, desc: isDesc }) =>
            id === "name"
              ? isDesc
                ? [desc(usersTable.name), desc(usersTable.email)]
                : [asc(usersTable.name), asc(usersTable.email)]
              : isDesc
                ? [desc(usersTable[id as keyof typeof usersTable])]
                : [asc(usersTable[id as keyof typeof usersTable])],
          )
          .flat(),
      with: {
        actions: {
          orderBy: [desc(schema.userActions.createdAt)],
          limit: 1,
        },
      },
    });

    if (userRecords.length > limit) {
      userRecords.pop();
      nextCursor = { skip: offsetValue + limit };
    } else {
      nextCursor = undefined;
    }

    return { userRecords, nextCursor };
  }),
});
