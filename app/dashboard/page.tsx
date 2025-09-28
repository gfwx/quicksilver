"use client"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { Plus, Settings, X, Loader2, Check, AlertCircle } from "lucide-react";
import { useState } from "react";
// import { TableCaption, TableCell } from "@/components/ui/table"

// form validation imports
import { CreateProjectSchema } from "@/lib/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod"

// form ui imports
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/file-upload";
import { ProjectTable } from "@/components/dashboard/project-table";
import { useProjects } from "@/lib/contexts/ProjectContext";
import type { PrismaModels } from "@/lib/instances";

export default function Dashboard() {
  const { projects } = useProjects();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [dialogOpen, setDialogOpen] = useState(false);
  console.log('Projects:', projects);

  // form function (with zod validation)
  const form = useForm<z.infer<typeof CreateProjectSchema>>({
    resolver: zodResolver(CreateProjectSchema),
    defaultValues: {
      project_name: "",
      project_context: "",
      documents: []
    }
  })

  // form submission handler
  const onSubmit = async (values: z.infer<typeof CreateProjectSchema>) => {
    setIsSubmitting(true);
    setSubmitStatus('loading');

    try {
      const formData = new FormData();

      // Add files to FormData
      if (values.documents && values.documents.length > 0) {
        values.documents.forEach((file) => {
          formData.append('files', file);
        });
      }

      // Debug: Log the files being sent
      console.log('Files to upload:', values.documents);
      values.documents?.forEach((file, index) => {
        console.log(`File ${index}:`, file.name, file.type, file.size);
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_EXPRESS_SERVER_PATH}/api/upload`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'x-project-name': values.project_name,
          'x-project-context': values.project_context || ''
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      setSubmitStatus('success');
      form.reset();

      // Close dialog after a brief delay to show success
      setTimeout(() => {
        setDialogOpen(false);
        setSubmitStatus('idle');
      }, 1500);

      // Refresh page to show updated projects list
      window.location.reload();

    } catch (error) {
      console.error('Error creating project:', error);
      setSubmitStatus('error');

      // Reset error state after 3 seconds
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="flex flex-col gap-9 text-foreground">
      <div className="flex w-full justify-between">
        <h1 className="text-4xl font-bold text-foreground tracking-tighter">Active Projects</h1>
        <div className="flex gap-2 justify-center">

          {/*Create project dialog*/}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="hover:cursor-pointer" variant="default"><Plus /> Create a project</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-foreground text-2xl tracking-tight">Create a project</DialogTitle>
                {
                  /**
                   * The actual project creation form.
                   * Component Nesting:
                   *
                   * <Form>
                   *  <form>
                   *    <FormField>
                   *    <Button type="submit" />
                   */
                }
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 text-foreground ">
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
                            <Textarea {...field} placeholder="A brief description, specific instructions, etc." />
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
                        variant={submitStatus === 'success' ? 'default' : submitStatus === 'error' ? 'destructive' : 'default'}
                      >
                        {submitStatus === 'loading' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {submitStatus === 'success' && <Check className="w-4 h-4 mr-2" />}
                        {submitStatus === 'error' && <AlertCircle className="w-4 h-4 mr-2" />}
                        {submitStatus === 'idle' && <Plus className="w-4 h-4 mr-2" />}
                        {submitStatus === 'loading' && 'Creating...'}
                        {submitStatus === 'success' && 'Created!'}
                        {submitStatus === 'error' && 'Failed'}
                        {submitStatus === 'idle' && 'Submit'}
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

          <Drawer>
            <DrawerTrigger asChild>
              <Button className="hover:cursor-pointer" variant="outline"><Settings /> Configure models</Button>
            </DrawerTrigger>
            <DrawerContent className="items-center">
              <DrawerHeader>
                <DrawerTitle>
                  Available Models
                </DrawerTitle>
                <DrawerDescription>
                  A set of available models, as per the Ollama API
                </DrawerDescription>
              </DrawerHeader>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button className="w-fit" variant="destructive">Close</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      {/*Active projects table*/}
      <ProjectTable projects={projects as PrismaModels['Project'][]} />
    </section>
  );
}
