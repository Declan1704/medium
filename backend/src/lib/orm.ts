import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaClient } from "../generated/prisma/client";

export function getPrisma(env: { DATABASE_URL: string }) {
  return new PrismaClient({ accelerateUrl: env.DATABASE_URL }).$extends(
    withAccelerate(),
  );
}
