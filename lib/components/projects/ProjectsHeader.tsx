import { Button } from "@/components/ui/button";
import { Plus, Settings } from "lucide-react";
import { CreateProjectDialog } from "./CreateProjectDialog";
import { ConfigureModelsDrawer } from "./ConfigureModelsDrawer";

interface ProjectsHeaderProps {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  isSubmitting: boolean;
  submitStatus: "idle" | "loading" | "success" | "error";
  setSubmitStatus: (status: "idle" | "loading" | "success" | "error") => void;
  userId: string;
}

export default function ProjectsHeader({
  dialogOpen,
  setDialogOpen,
  isSubmitting,
  submitStatus,
  setSubmitStatus,
  userId,
}: ProjectsHeaderProps) {
  return (
    <div className="flex w-full justify-between">
      <h1 className="text-4xl font-bold text-foreground tracking-tighter">
        Active Projects
      </h1>
      <div className="flex gap-2 justify-center">
        <CreateProjectDialog
          dialogOpen={dialogOpen}
          setDialogOpen={setDialogOpen}
          isSubmitting={isSubmitting}
          submitStatus={submitStatus}
          setSubmitStatus={setSubmitStatus}
          userId={userId}
        />
        <ConfigureModelsDrawer />
      </div>
    </div>
  );
}
