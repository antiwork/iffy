import { TRPCError } from "@trpc/server";
import { middleware, procedure } from "../trpc";

const protectedProcedure = procedure.use(
  middleware(async ({ ctx, next }) => {
    const { authOrganizationId, authUserId } = ctx;
    if (!authOrganizationId || !authUserId) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return next({
      ctx: {
        authOrganizationId,
        authUserId,
      },
    });
  }),
);

export default protectedProcedure;
