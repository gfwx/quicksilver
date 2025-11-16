"use client";
import { useState } from "react";
import { ProjectTable } from "@/components/dashboard/project-table";
import { useProjects } from "@/lib/contexts/ProjectContext";
import type { PrismaModels } from "@/lib/instances";
import { useAuth } from "@/lib/contexts/AuthContext";
import { redirect } from "next/navigation";
import { ProjectsHeader } from "@/lib/components/projects";

export default function Dashboard() {
  const { projects } = useProjects();
  const { authState } = useAuth();
  const user = authState.user;

  if (!user) {
    console.error("[/projects] No valid user found!");
    redirect("/");
  }

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <section className="flex flex-col gap-9 text-foreground">
      <ProjectsHeader
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        isSubmitting={isSubmitting}
        submitStatus={submitStatus}
        setSubmitStatus={setSubmitStatus}
        userId={user.id}
      />
      <ProjectTable projects={projects as PrismaModels["Project"][]} />
    </section>
  );
}
