import { z } from "zod";

/**
 * Input validation schema for project creation
 */
export const CreateProjectSchema = z.object({
  project_name: z.string().min(3, {
    message: "Project name must be at least 3 characters long"
  }),

  project_context: z.string().optional(),
  documents: z.array(z.file()).min(1, {
    message: "Project must include at least one file"
  })
})
