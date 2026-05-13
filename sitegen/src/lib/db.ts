import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const LEAD_STATUS = {
  NEW: "NEW",
  MOCKED: "MOCKED",
  CONTACTED: "CONTACTED",
  REPLIED: "REPLIED",
  PAID: "PAID",
  DELIVERED: "DELIVERED",
  REJECTED: "REJECTED",
} as const;

export type LeadStatus = (typeof LEAD_STATUS)[keyof typeof LEAD_STATUS];
