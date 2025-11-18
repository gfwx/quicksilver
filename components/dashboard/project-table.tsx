"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Info, Trash2, Upload } from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { ProjectFilesDisplay } from "./ProjectFilesDisplay";
import type { PrismaModels } from "@/lib/instances";
import { useState, useCallback } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface ProjectTableProps {
  projects: PrismaModels["Project"][];
  onProjectDeleted?: (projectId: string) => void;
  onFilesUploaded?: (projectId: string) => void;
}

export const ProjectTable = ({
  projects,
  onProjectDeleted,
  onFilesUploaded,
}: ProjectTableProps) => {
  const { authState } = useAuth(); // I can get away with this because it's a client component.
  const [projectFileData, setProjectFileData] = useState<{
    [key: string]: PrismaModels["File"][];
  }>({});
  const [currentProjectFileData, setCurrentProjectFileData] = useState<
    PrismaModels["File"][]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openDrawerId, setOpenDrawerId] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(
    null,
  );
  const [uploadingProjectId, setUploadingProjectId] = useState<string | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState<string | null>(null);

  const fetchProjectFiles = async (projectId: string) => {
    if (projectFileData[projectId]) {
      setCurrentProjectFileData(projectFileData[projectId]);
      setError("");
    } else {
      console.log(projectFileData);
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/files?project=${projectId}&user=${authState.user?.id ?? ""}`,
          {
            method: "GET",
          },
        );

        if (!res.ok) {
          let errorMsg = "Failed to fetch files";
          try {
            const error = await res.json();
            errorMsg = error.error || `HTTP ${res.status}`;
          } catch {
            errorMsg = `HTTP ${res.status}`;
          }
          setError(errorMsg);
        } else {
          const files = await res.json();
          setProjectFileData((prev) => ({ ...prev, [projectId]: files }));
          setCurrentProjectFileData(files);
        }
      } catch (error) {
        setError(`Failed to fetch files: ${error}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) {
      return;
    }

    setDeletingProjectId(projectId);
    try {
      const res = await fetch("/api/projects", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          userId: authState.user?.id,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(`Failed to delete project: ${error.error}`);
      } else {
        onProjectDeleted?.(projectId);
      }
    } catch (error) {
      alert(`Failed to delete project: ${error}`);
    } finally {
      setDeletingProjectId(null);
      window.location.reload();
    }
  };

  const handleFileUpload = async (projectId: string, files: FileList) => {
    if (files.length === 0) return;

    setUploadingProjectId(projectId);
    setError("");

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      // fix this shit
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_EXPRESS_ENDPOINT || "http://localhost:3001"}/upload`,
        {
          method: "POST",
          headers: {
            "x-project-id": projectId,
          },
          body: formData,
          credentials: "include",
        },
      );

      if (!res.ok) {
        const error = await res.json();
        setError(`Failed to upload files: ${error.message || res.status}`);
      } else {
        // Invalidate cached file data for this project
        setProjectFileData((prev) => {
          const newData = { ...prev };
          delete newData[projectId];
          return newData;
        });
        onFilesUploaded?.(projectId);
      }
    } catch (error) {
      setError(`Failed to upload files: ${error}`);
    } finally {
      setUploadingProjectId(null);
    }
  };

  const handleDragOver = useCallback(
    (e: React.DragEvent, projectId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(projectId);
    },
    [],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(null);
  }, []);

  const handleDrop = (e: React.DragEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(null);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(projectId, files);
    }
  };
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
            <TableCell className={cn("font-medium flex gap-4 items-center")}>
              <Drawer
                direction="left"
                open={openDrawerId === project.id}
                onOpenChange={(open) => {
                  if (open) {
                    setOpenDrawerId(project.id);
                    fetchProjectFiles(project.id);
                  } else {
                    setOpenDrawerId(null);
                    setError("");
                  }
                }}
              >
                <DrawerTrigger asChild>
                  <Info className="cursor-pointer" />
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle className="text-2xl">
                      {project.projectTitle}
                    </DrawerTitle>
                    <DrawerDescription>
                      {project.projectContext}
                    </DrawerDescription>
                  </DrawerHeader>
                  {loading ? (
                    <div className="p-4">Loading files...</div>
                  ) : error ? (
                    <div className="p-4 text-red-500">{error}</div>
                  ) : currentProjectFileData.length > 0 ? (
                    <ProjectFilesDisplay files={currentProjectFileData} />
                  ) : (
                    <div className="p-4">No files found.</div>
                  )}
                </DrawerContent>
              </Drawer>
              <p>{project.projectTitle}</p>
              <Link
                href={`/projects/${project.id}`}
                className="
                              opacity-0 group-hover:opacity-100 pointer-events-none
                              group-hover:pointer-events-auto
                              transition-opacity duration-200 cursor-pointer"
              >
                OPEN
              </Link>
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
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteProject(project.id)}
                disabled={deletingProjectId === project.id}
              >
                {deletingProjectId === project.id ? (
                  "Deleting..."
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
