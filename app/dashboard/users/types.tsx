import * as schema from "@/db/schema";

type User = typeof schema.users.$inferSelect & {
  actions: (typeof schema.userActions.$inferSelect)[];
};

type UserDetail = typeof schema.users.$inferSelect & {
  actions: (typeof schema.userActions.$inferSelect & {
    appeal: typeof schema.appeals.$inferSelect | null;
  })[];
};

export type { User, UserDetail };
