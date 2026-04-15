import { Hono } from "hono";
import route from "./router/user";
import blog from "./router/blog";
import { getPrisma } from "./lib/orm";

type HonoEnv = {
  Variables: {
    prisma: ReturnType<typeof getPrisma>;
  };
};

const app = new Hono<HonoEnv>();

app.onError((err, c) => {
  console.error("🔥 GLOBAL ERROR:", err.stack);
  return c.json({ error: "Internal Error" }, 500);
});
app.use("*", async (c, next) => {
  const prisma = getPrisma(c.env as { DATABASE_URL: string });
  c.set("prisma", prisma); // ✅ critical
  await next();
});

app.route("/api/v1/user", route);
app.route("/api/v1/blog", blog);
export default app;
