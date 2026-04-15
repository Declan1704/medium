import { Hono } from "hono";
import { Jwt } from "hono/utils/jwt";
import { createBlog, updateBlog } from "@declan31704/proj-common";

type Variables = {
  userId: string;
  prisma: any; // (we’ll improve typing later)
};

const blog = new Hono<{ Variables: Variables }>();

blog.use("/*", async (c, next) => {
  const authHeader = c.req.header("Authorization");

  console.log("AUTH HEADER:", authHeader); // 🔥 debug

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized - Missing or invalid header" }, 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = await Jwt.verify(token, (c.env as any).JWT_SECRET, "HS256");

    c.set("userId", payload.userId as string);
    await next();
  } catch (err) {
    console.error("JWT ERROR:", err);
    return c.json({ error: "Invalid token" }, 401);
  }
});

blog.get("/", async (c) => {
  const userId = c.get("userId");
  const prisma = c.get("prisma");
  try {
    console.log("Fetching posts for userId:", userId);
    const posts = await prisma.post.findFirst({
      where: {
        authorId: userId,
      },
    });
    console.log("Fetched posts:", posts);
    return c.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return c.json({ error: "Failed to fetch posts" }, 411);
  }
});

blog.get("/bulk", async (c) => {
  const prisma = c.get("prisma");
  try {
    const posts = await prisma.post.findMany();
    return c.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return c.json({ error: "Failed to fetch posts" }, 411);
  }
});

blog.get("/:id", async (c) => {
  const userId = c.req.param("id");
  const prisma = c.get("prisma");
  try {
    console.log("Fetching posts for userId:", userId);
    const posts = await prisma.post.findFirst({
      where: {
        id: userId,
      },
    });
    console.log("Fetched posts:", posts);
    return c.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return c.json({ error: "Failed to fetch posts" }, 411);
  }
});

blog.post("/", async (c) => {
  const userId = c.get("userId");
  const prisma = c.get("prisma");
  const body = await c.req.json();
  const { success } = createBlog.safeParse(body);
  if (!success) {
    return c.json({ error: "Invalid input", details: success }, 400);
  }
  const { title, content } = body;
  try {
    const post = await prisma.post.create({
      data: {
        title,
        content,
        authorId: userId,
      },
    });
    return c.json(post);
  } catch (err) {
    console.error("Error creating post:", err);
    return c.json({ error: "Failed to create post" }, 411);
  }
});

blog.put("/", async (c) => {
  const userId = c.get("userId");
  const prisma = c.get("prisma");
  const body = await c.req.json();
  const { success } = updateBlog.safeParse(body);
  if (!success) {
    return c.json({ error: "Invalid input", details: success }, 400);
  }
  try {
    const post = await prisma.post.update({
      where: {
        id: userId,
      },
      data: {
        title: body.title,
        content: body.content,
      },
    });
    return c.json(post.id);
  } catch (error) {
    console.error("Error updating post:", error);
    return c.json({ error: "Failed to update post" }, 411);
  }
});

export default blog;
