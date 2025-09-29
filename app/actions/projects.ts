"use server";

import { prisma, PrismaModels } from "@/lib/instances";
import { decryptPayload } from "@/lib/cookie-helpers";
import { checkPayload } from "./helpers";

type Project = PrismaModels["Project"]

/**
 * Gets all projects given the encrypted user string. If the payload is not expired, then
 * data is queried from the database.
 * All decryption is done
 * @param string
 */
export async function getProjects(encryptedUserId: string) {
  try {
    const payload = await decryptPayload(encryptedUserId);

    if (!checkPayload(payload)) {
      return [];
    }

    const projects = await prisma.project.findMany({
      where: {
        userId: payload.id
      }
    })

    return projects;
  } catch (error) {
    console.error('Failed to decrypt user data from cookie: ', error);
  }
}

export async function createProject(projectTitle: string, projectContext: string | null, encryptedUserID: string): Promise<Project | null> {
  if (!projectTitle) {

    console.error('Project title is required!')
    return null;
  }

  const payload = await decryptPayload(encryptedUserID);

  if (!checkPayload(payload)) {
    console.error('Invalid payload');
    return null;
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    console.error('Payload expired, please re-authenticate');
    return null;
  }

  const userId = payload.id;

  const pid = crypto.randomUUID();
  const project = await prisma.project.create({
    data: {
      id: pid,
      userId: userId,
      projectTitle: projectTitle,
      projectContext: projectContext ?? "",
      updatedAt: new Date()
    }
  })

  console.log(`Project created with id ${project.id}`)
  return project;
}

export async function deleteProject(projectId: string, encryptedUserID: string) {
  const payload = await decryptPayload(encryptedUserID);

  if (!payload) {
    throw new Error('Invalid payload');
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Payload expired, please re-authenticate');
  }

  const userId = payload.id;

  const project = await prisma.project.findUnique({
    where: {
      id: projectId
    }
  })

  if (!project) {
    throw new Error('Project not found');
  }

  if (project.userId !== userId) {
    throw new Error('Unauthorized');
  }

  await prisma.project.delete({
    where: {
      id: projectId
    }
  })

  console.log(`Project deleted with id ${projectId}`)
}

export async function updateProject(projectId: string, projectTitle: string, projectContext: string | null, encryptedUserID: string) {
  const payload = await decryptPayload(encryptedUserID);

  if (!payload) {
    throw new Error('Invalid payload');
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Payload expired, please re-authenticate');
  }

  const userId = payload.id;

  const project = await prisma.project.findUnique({
    where: {
      id: projectId
    }
  })

  if (!project) {
    throw new Error('Project not found');
  }

  if (project.userId !== userId) {
    throw new Error('Unauthorized');
  }

  const updatedProject = await prisma.project.update({
    where: {
      id: projectId
    },
    data: {
      projectTitle: projectTitle,
      projectContext: projectContext ?? "",
      updatedAt: new Date()
    }
  })

  console.log(`Project updated with id ${updatedProject.id}`)
  return updatedProject;
}
