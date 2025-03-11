import { close } from "@iffy/app/db";
import { updateProducts } from "./products";

async function main() {
  await updateProducts();
}

main()
  .then(() => {
    console.log("Updating products completed successfully.");
    close();
  })
  .catch((e) => {
    console.error(e);
    close();
    process.exit(1);
  });
