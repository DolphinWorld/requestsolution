import { z } from "zod/v4";

export const submitIdeaSchema = z.object({
  rawInputText: z
    .string()
    .min(20, "Idea must be at least 20 characters")
    .max(5000, "Idea must be under 5000 characters"),
  targetUsers: z.string().max(500).optional(),
  platform: z.string().max(100).optional(),
  constraints: z.string().max(1000).optional(),
});

export const commentSchema = z.object({
  body: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment must be under 2000 characters"),
});

export const taskStatusSchema = z.object({
  status: z.enum(["open", "in_progress", "done"]),
});

export const taskLinkSchema = z.object({
  url: z.url("Must be a valid URL"),
  label: z.string().max(200).optional(),
});

export const nicknameSchema = z.object({
  nickname: z.string().min(1).max(30),
});

export const specSchema = z.object({
  title: z.string(),
  problemStatement: z.string(),
  tags: z.array(z.string()),
  features: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
    })
  ),
  tasks: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      acceptanceCriteria: z.string(),
      effort: z.enum(["S", "M", "L", "XL"]),
    })
  ),
  openQuestions: z.array(z.string()),
});

export type SubmitIdeaInput = z.infer<typeof submitIdeaSchema>;
export type SpecOutput = z.infer<typeof specSchema>;
