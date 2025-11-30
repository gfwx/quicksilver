"use client";

import { cn } from "@/lib/utils";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/lib/components/ui/table";

import { Trash2, Upload, BookOpen } from "lucide-react";

import type { PrismaModels } from "@/lib/instances";
import { Button } from "@/lib/components/ui/button";
import { useProjects } from "@/lib/hooks/useProjects";

interface ProjectTableProps {
  projects: PrismaModels["Project"][];
  onProjectDeleted?: (projectId: string) => void;
  onFilesUploaded?: (projectId: string) => void;
  profileId: string;
}

export const ProjectTable = ({
  projects,
  onProjectDeleted,
  onFilesUploaded,
  profileId,
}: ProjectTableProps) => {
  const {
    deletingProjectId,
    uploadingProjectId,
    isDragging,
    handleDeleteProject,
    handleFileUpload,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useProjects({
    profileId,
    onProjectDeleted,
    onFilesUploaded,
  });
  return (
    <Table className="w-[75%]">
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Date Created</TableHead>
          <TableHead>Last Updated</TableHead>
          <TableHead>Documents added</TableHead>
          <TableHead>Upload Files</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id} className="group">
            <TableCell>
              <p>{project.projectTitle}</p>
            </TableCell>
            <TableCell>
              {new Date(project.createdAt).toISOString().split("T")[0]}
            </TableCell>
            <TableCell>
              {new Date(project.updatedAt).toISOString().split("T")[0]}
            </TableCell>

            <TableCell>{project.fileCount}</TableCell>

            <TableCell>
              <div
                className={cn(
                  "relative border-2 border-dashed rounded-lg p-4 transition-colors",
                  isDragging === project.id
                    ? "border-primary bg-primary/10"
                    : "border-gray-300 hover:border-gray-400",
                  uploadingProjectId === project.id && "opacity-50",
                )}
                onDragOver={(e) => handleDragOver(e, project.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, project.id)}
              >
                <input
                  type="file"
                  multiple
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleFileUpload(project.id, e.target.files);
                    }
                  }}
                  disabled={uploadingProjectId === project.id}
                />
                <div className="flex items-center justify-center gap-2 pointer-events-none">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">
                    {uploadingProjectId === project.id
                      ? "Uploading..."
                      : "Drop files or click"}
                  </span>
                </div>
              </div>
            </TableCell>

            <TableCell>
              <div className="flex justify-center items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  className="cursor-pointer w-8 h-8"
                  onClick={() => handleDeleteProject(project.id)}
                  disabled={deletingProjectId === project.id}
                >
                  {deletingProjectId === project.id ? (
                    "Deleting..."
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  className="cursor-pointer w-8 h-8"
                  onClick={() =>
                    (window.location.href = `/projects/${project.id}`)
                  }
                >
                  <BookOpen className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
