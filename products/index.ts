import { close } from "@iffy/app/db";
import { updateProducts, updateMeters } from "./products";
import { env } from "@/lib/env";

async function main() {
  if (env.ENABLE_BILLING) {
    await updateProducts();
    await updateMeters();
  }
}

main()
  .then(() => {
    close();
  })
  .catch((e) => {
    console.error(e);
    close();
    process.exit(1);
  });
