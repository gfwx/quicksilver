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

import { Info } from "lucide-react";

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
import { useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";

interface ProjectTableProps {
  projects: PrismaModels["Project"][];
}

export const ProjectTable = ({ projects }: ProjectTableProps) => {
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

  const fetchProjectFiles = async (projectId: string) => {
    if (projectFileData[projectId]) {
      setCurrentProjectFileData(projectFileData[projectId]);
      setError("");
    } else {
      console.log(projectFileData);
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/files", {
          method: "GET",
          headers: {
            "x-project-id": projectId,
            "x-encrypted-user-id": authState.user?.id ?? "",
          },
        });

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
  return (
    <Table className="w-[75%]">
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Date Created</TableHead>
          <TableHead>Last Updated</TableHead>
          <TableHead>Documents added</TableHead>
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
                href={`/p/${project.id}`}
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
