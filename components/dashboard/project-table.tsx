"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { PrismaModels } from "@/lib/instances"

interface ProjectTableProps {
  projects: PrismaModels['Project'][];
}

export const ProjectTable = ({ projects }: ProjectTableProps) => {
  return (
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
        {projects.map((project) => (
          <TableRow key={project.id}>
            <TableCell className="font-medium">{project.projectTitle}</TableCell>

            {/*need to fix this to prevent HTML hydration errors*/}
            <TableCell>{new Date(project.createdAt).toLocaleDateString()}</TableCell>
            <TableCell>{new Date(project.updatedAt).toLocaleDateString()}</TableCell>
            {/*<TableCell>{project.documentCount || 0}</TableCell>*/}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
