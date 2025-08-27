import {z} from 'zod';

export const messagesSchema = z.object({
  app: z.object({ title: z.string() }),
  search: z.object({
    placeholder: z.string(),
    searching: z.string(),
    noResults: z.string()
  }),
  errors: z.object({
    search: z.string(),
    list: z.string(),
    create: z.string()
  }),
  create: z.object({
    title: z.string(),
    placeholder: z.object({
      title: z.string(),
      body: z.string(),
      tags: z.string()
    })
  }),
  actions: z.object({
    create: z.string(),
    delete: z.string()
  }),
  list: z.object({
    latest: z.string(),
    prev: z.string(),
    next: z.string(),
    perPage: z.string()
  })
});

export type Messages = z.infer<typeof messagesSchema>;
