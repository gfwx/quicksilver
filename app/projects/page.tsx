"use client";
import { useState } from "react";
import { ProjectTable, ProjectsHeader } from "@/lib/components/projects";
import { useProjects } from "@/lib/contexts/ProjectContext";
import type { PrismaModels } from "@/lib/instances";
import { useProfile } from "@/lib/hooks/useProfile";

export default function Dashboard() {
  const { projects } = useProjects();
  const { currentProfile } = useProfile();
  const [isSubmitting] = useState(false);
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
        userId={currentProfile?.id ?? ""}
      />
      <ProjectTable
        profileId={currentProfile?.id ?? ""}
        projects={projects as PrismaModels["Project"][]}
      />
    </section>
  );
}
