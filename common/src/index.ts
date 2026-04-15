import z from "zod";
import { id } from "zod/locales";

export const signUpSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  username: z.string().optional(),
});

export const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export const createBlog = z.object({
  title: z.string(),
  content: z.string(),
});

export const updateBlog = z.object({
  id: z.string(),
  title: z.string().optional(),
  content: z.string().optional(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type CreateBlogInput = z.infer<typeof createBlog>;
export type UpdateBlogInput = z.infer<typeof updateBlog>;
