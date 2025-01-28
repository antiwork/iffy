import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Iffy",
};

export default function Dashboard() {
  redirect("/dashboard/moderations");
}
