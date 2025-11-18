"use client";
import { useState } from "react";
import { ProjectTable } from "@/components/dashboard/project-table";
import { useProjects } from "@/lib/contexts/ProjectContext";
import type { PrismaModels } from "@/lib/instances";
import { useProfile } from "@/lib/hooks/useProfile";
import { redirect } from "next/navigation";
import { ProjectsHeader } from "@/lib/components/projects";

export default function Dashboard() {
  const { projects } = useProjects();
  const { currentProfile } = useProfile();

  if (!currentProfile) {
    console.error("[/projects] No active profile found!");
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
        userId={currentProfile.id}
      />
      <ProjectTable projects={projects as PrismaModels["Project"][]} />
    </section>
  );
}
