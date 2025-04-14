import { TRPCError } from "@trpc/server";
import { middleware, procedure } from "../trpc";

const protectedProcedure = procedure.use(
  middleware(async ({ ctx, next }) => {
    const { organizationId, clerkUserId } = ctx;
    if (!organizationId || !clerkUserId) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return next({
      ctx: {
        organizationId,
        clerkUserId,
      },
    });
  }),
);

export default protectedProcedure;
