"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, X, Loader2, Check, AlertCircle } from "lucide-react";
import { CreateProjectSchema } from "@/lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/file-upload";

interface CreateProjectDialogProps {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  isSubmitting: boolean;
  submitStatus: "idle" | "loading" | "success" | "error";
  setSubmitStatus: (status: "idle" | "loading" | "success" | "error") => void;
  userId: string;
}

export function CreateProjectDialog({
  dialogOpen,
  setDialogOpen,
  isSubmitting,
  submitStatus,
  setSubmitStatus,
  userId,
}: CreateProjectDialogProps) {
  const form = useForm<z.infer<typeof CreateProjectSchema>>({
    resolver: zodResolver(CreateProjectSchema),
    defaultValues: {
      project_name: "",
      project_context: "",
      documents: [],
    },
  });

  const onSubmit = async (values: z.infer<typeof CreateProjectSchema>) => {
    setSubmitStatus("loading");

    try {
      const formData = new FormData();

      if (values.documents && values.documents.length > 0) {
        values.documents.forEach((file) => {
          formData.append("files", file);
        });
      }

      console.log("Files to upload:", values.documents);
      values.documents?.forEach((file, index) => {
        console.log(`File ${index}:`, file.name, file.type, file.size);
      });

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectTitle: values.project_name,
          projectContext: values.project_context ?? "",
          userId: userId,
        }),
      });

      if (!res.ok) {
        throw new Error(
          `Failed to create project: ${res.status} ${res.statusText}`,
        );
      }

      const project = await res.json();

      if (!project) {
        throw new Error("Failed to create project");
      }

      console.log("Project ID being sent:", project.id);
      console.log("FormData contents:");
      for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }

      console.log("Making fetch request to Next.js API...");

      const response = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        headers: {
          "x-project-id": project.id,
        },
        body: formData,
      });

      console.log("Response received:", {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        let errorText = "";
        try {
          errorText = await response.text();
        } catch (e) {
          console.log(e);
          errorText = "Could not read error response";
        }
        console.error(
          "Upload failed:",
          response.status,
          response.statusText,
          errorText,
        );
        throw new Error(
          `Upload failed: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const responseData = await response.json();
      console.log("Upload successful:", responseData);

      setSubmitStatus("success");
      form.reset();

      setTimeout(() => {
        setDialogOpen(false);
        setSubmitStatus("idle");
      }, 1500);

      window.location.reload();
    } catch (error) {
      console.error("Error creating project:", error);

      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }

      if (error instanceof TypeError && error.message.includes("fetch")) {
        console.error("This appears to be a network/API error. Check:");
        console.error("1. Next.js API server is running");
        console.error("2. Authentication is properly configured");
        console.error("3. API routes are accessible");
      }

      setSubmitStatus("error");

      setTimeout(() => {
        setSubmitStatus("idle");
      }, 3000);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button className="hover:cursor-pointer" variant="default">
          <Plus /> Create a project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-foreground text-2xl tracking-tight">
            Create a project
          </DialogTitle>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8 text-foreground "
            >
              <FormField
                control={form.control}
                name="project_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="project_context"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Context</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="A brief description, specific instructions, etc."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="documents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Documents</FormLabel>
                    <FormControl>
                      <FileUpload
                        value={field.value}
                        onChange={field.onChange}
                        error={form.formState.errors.documents?.message}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  variant={
                    submitStatus === "success"
                      ? "default"
                      : submitStatus === "error"
                        ? "destructive"
                        : "default"
                  }
                >
                  {submitStatus === "loading" && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {submitStatus === "success" && (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {submitStatus === "error" && (
                    <AlertCircle className="w-4 h-4 mr-2" />
                  )}
                  {submitStatus === "idle" && <Plus className="w-4 h-4 mr-2" />}
                  {submitStatus === "loading" && "Creating..."}
                  {submitStatus === "success" && "Created!"}
                  {submitStatus === "error" && "Failed"}
                  {submitStatus === "idle" && "Submit"}
                </Button>
                <Button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="hover:cursor-pointer"
                  variant="destructive"
                  disabled={isSubmitting}
                >
                  <X /> Cancel
                </Button>
              </div>
            </form>
          </Form>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
