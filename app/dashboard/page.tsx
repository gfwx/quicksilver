"use client"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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
import { Plus, Settings, X } from "lucide-react";
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

export default function Dashboard() {
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
  const onSubmit = (values: z.infer<typeof CreateProjectSchema>) => {
    console.log(values);
  }

  return (
    <section className="flex flex-col gap-9 text-foreground">
      <div className="flex w-full justify-between">
        <h1 className="text-4xl font-bold text-foreground tracking-tighter">Active Projects</h1>
        <div className="flex gap-2 justify-center">

          {/*Create project dialog*/}
          <Dialog>
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
                      <Button type="submit"><Plus /> Submit</Button>
                      <DialogTrigger asChild>
                        <Button className="hover:cursor-pointer" variant="destructive"><X /> Cancel</Button>
                      </DialogTrigger>
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
      <Table className="">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Name</TableHead>
            <TableHead>Date Created</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead>Documents added</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>

            {/*This is where data goes*/}

          </TableRow>
        </TableBody>
      </Table>
    </section>
  );
}
