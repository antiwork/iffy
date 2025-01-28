import { Appeal } from "./appeal";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Appeals Inbox | Iffy",
};

const Inbox = async () => {
  return <div className="text-muted-foreground flex h-full items-center justify-center p-8">No appeal selected</div>;
};

export default Inbox;
