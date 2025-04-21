import { router } from "../trpc";

import { userRecordRouter } from "./user-record";
import { recordRouter } from "./record";
import { appealRouter } from "./appeal";

export const appRouter = router({
  userRecord: userRecordRouter,
  record: recordRouter,
  appeal: appealRouter,
});

export type AppRouter = typeof appRouter;
