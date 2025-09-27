'use client';

import { createContext, useContext, ReactNode } from 'react';
import { PrismaModels } from '../instances';

type ProjectsContextType = {
  projects: PrismaModels['Project'][];
};

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export function useProjects() {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}

interface ProjectProviderProps {
  initialProjects: PrismaModels['Project'][];
  children: ReactNode;
}

export function ProjectProvider({ initialProjects, children }: ProjectProviderProps) {
  return (
    <ProjectsContext.Provider value={{ projects: initialProjects }}>
      {children}
    </ProjectsContext.Provider>
  );
}
