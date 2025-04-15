import { TRPCError } from "@trpc/server";
import { middleware, procedure } from "../trpc";

const protectedProcedure = procedure.use(
  middleware(async ({ ctx, next }) => {
    const { organizationId, userId } = ctx;
    if (!organizationId || !userId) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return next({
      ctx: {
        organizationId,
        userId,
      },
    });
  }),
);

export default protectedProcedure;
