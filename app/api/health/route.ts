import { NextResponse } from "next/server";
import db from "@/db";

export type SystemStatus = "healthy" | "degraded" | "unhealthy";

export type SubSystem = {
  name: string;
  status: SystemStatus;
  message: string;
  details?: Record<string, unknown>;
};

export type HealthResponse = {
  status: SystemStatus;
  message: string;
  timestamp: string;
  subsystems: SubSystem[];
};

export async function GET() {
  const subsystems: SubSystem[] = [];
  let overallStatus: SystemStatus = "healthy";

  subsystems.push({
    name: "api",
    status: "healthy",
    message: "",
  });

  try {
    await Promise.race([
      db.query.records.findFirst(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Database health check timeout")), 5000)
      )
    ]);
    
    subsystems.push({
      name: "database",
      status: "healthy",
      message: "",
    });
  } catch (error) {
    overallStatus = "unhealthy";
    subsystems.push({
      name: "database",
      status: "unhealthy",
      message: error instanceof Error ? error.message : "Unknown database error",
    });
  }

  const response: HealthResponse = {
    status: overallStatus,
    message: overallStatus === "healthy" ? "" : "One or more systems are experiencing issues",
    timestamp: new Date().toISOString(),
    subsystems,
  };

  return NextResponse.json(response, { 
    status: overallStatus === "healthy" ? 200 : 503 
  });
}