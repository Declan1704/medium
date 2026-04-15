import { Hono } from "hono";
import { Jwt } from "hono/utils/jwt";
import { signInSchema, signUpSchema } from "@declan31704/proj-common";

type Variables = {
  userId: string;
  prisma: any; // (we’ll improve typing later)
};
const route = new Hono<{ Variables: Variables }>();

const publicRoutes = ["/signup", "/signin"];

route.use("/*", async (c, next) => {
  const path = c.req.path;

  // ✅ EXACT match instead of includes
  if (path === "/api/v1/user/signup" || path === "/api/v1/user/signin") {
    return next();
  }

  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return c.json({ error: "Invalid token" }, 401);
  }

  try {
    const payload = await Jwt.verify(token, (c.env as any).JWT_SECRET, "HS256");

    c.set("userId", payload.userId as string);
    await next();
  } catch (err) {
    return c.json({ error: "Invalid token" }, 401);
  }
});

route.post("/signup", async (c) => {
  let body;
  try {
    body = await c.req.json();
    const { success } = signUpSchema.safeParse(body);
    if (!success) {
      return c.json({ error: "Invalid input", details: success }, 400);
    }
  } catch (err) {
    console.error("Error parsing JSON:", err);
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const { email, password } = body || {};
  const userid = c.get("userId");
  const prisma = c.get("prisma");

  const existingUser = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  if (existingUser) {
    return c.json({ error: "User already exists" }, 400);
  }

  const user = await prisma.user.create({
    data: {
      email,
      password,
    },
  });
  const token = await Jwt.sign(
    { userId: user.id },
    (c.env as any).JWT_SECRET,
    "HS256",
  );
  return c.json({ jwt: token });
});

route.post("/signin", async (c) => {
  const body = await c.req.json();
  const { success } = signInSchema.safeParse(body);
  if (!success) {
    return c.json({ error: "Invalid input", details: success }, 400);
  }
  const { email, password } = body;
  const prisma = c.get("prisma");

  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  if (!user || user.password !== password) {
    return c.json({ error: "Invalid credentials" }, 401);
  }
  const token = await Jwt.sign(
    { userId: user.id },
    (c.env as any).JWT_SECRET,
    "HS256",
  );
  return c.json({ jwt: token });
});
export default route;
