"use client"

import { cn } from "@/lib/utils"
import { getFiles } from "@/app/actions/files"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Info } from "lucide-react"

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

import { Button } from "@/components/ui/button"
import type { PrismaModels } from "@/lib/instances"
import { useState } from "react"

interface ProjectTableProps {
  projects: PrismaModels['Project'][];
}

export const ProjectTable = ({ projects }: ProjectTableProps) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchProjectFiles = async (projectId: string) => {
    setLoading(true);
    setError("");

    try {
      const files = await getFiles(projectId);
      if (!files) {
        setError('No files found!');
      }
      else {
        setData(files)
      }
    }
  }
  projects.forEach(project => {
    console.log(project.fileCount);
  });
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

              <Drawer direction="left">
                <DrawerTrigger asChild>
                  <Info className='cursor-pointer' />
                </DrawerTrigger>

                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle className='text-2xl'>
                      {project.projectTitle}
                    </DrawerTitle>
                    <DrawerDescription>
                      {project.projectContext}
                    </DrawerDescription>
                  </DrawerHeader>
                </DrawerContent>
              </Drawer>
              <p>
                {project.projectTitle}
              </p>
              <Button variant="default" className="
                                opacity-0 group-hover:opacity-100 pointer-events-none
                                group-hover:pointer-events-auto
                                transition-opacity duration-200 cursor-pointer"
              >
                OPEN
              </Button>
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
  )
}
