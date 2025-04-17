import { faker } from "@faker-js/faker";
import sample from "lodash/sample";
import db from "../index";
import * as schema from "../schema";

const COUNT = 50;

export async function seedUsers(authOrganizationId: string) {
  const users = await db
    .insert(schema.endUsers)
    .values(
      [...Array(COUNT)].map(() => {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        return {
          authOrganizationId,
          clientId: `user_${faker.string.nanoid(10)}`,
          email: faker.internet.email({ firstName, lastName }).toLocaleLowerCase(),
          name: faker.person.fullName({ firstName, lastName }),
          username: faker.internet.userName({ firstName, lastName }).toLocaleLowerCase(),
          metadata: {
            totalSales: faker.commerce.price({ max: 1000 }),
          },
          createdAt: faker.date.recent({ days: 10 }),
          protected: sample([true, false, false, false, false]),
        };
      }),
    )
    .returning();
  console.log("Seeded Users");

  return users;
}
