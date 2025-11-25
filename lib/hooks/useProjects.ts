import { useState, useCallback } from "react";
import type { PrismaModels } from "@/lib/instances";

interface UseProjectsProps {
  profileId: string;
  onProjectDeleted?: (projectId: string) => void;
  onFilesUploaded?: (projectId: string) => void;
}

export const useProjects = ({
  profileId,
  onProjectDeleted,
  onFilesUploaded,
}: UseProjectsProps) => {
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
        // Client-side fetch uses relative URL
        const res = await fetch(
          `/api/files?project=${projectId}&user=${profileId}`,
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
      // Client-side fetch uses relative URL
      const res = await fetch("/api/projects", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          userId: profileId,
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

      // Client-side fetch uses relative URL to Next.js API
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "x-project-id": projectId,
        },
        body: formData,
        credentials: "include",
      });

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

  return {
    // State
    projectFileData,
    currentProjectFileData,
    loading,
    error,
    openDrawerId,
    deletingProjectId,
    uploadingProjectId,
    isDragging,
    // Setters
    setOpenDrawerId,
    setError,
    // Functions
    fetchProjectFiles,
    handleDeleteProject,
    handleFileUpload,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
};
