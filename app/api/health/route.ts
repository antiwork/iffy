import { NextResponse } from "next/server";
import db from "@/db";

export async function GET() {
  try {
    await db.query.records.findFirst();
    return NextResponse.json({ status: "healthy" });
  } catch (error) {
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
} 