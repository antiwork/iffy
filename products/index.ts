import { close } from "@iffy/app/db";
import { updateProducts, updateMeters } from "./products";

async function main() {
  await updateProducts();
  await updateMeters();
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
