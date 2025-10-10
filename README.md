# Quicksilver Project Architecture

This document provides an overview of the Quicksilver project's architecture, which is composed of a Next.js frontend, an Express.js backend, and a Python-based AI service.

## End-to-End Workflows

The following diagram illustrates the key end-to-end workflows of the application, including user authentication, project creation, file uploading, and document querying.

```mermaid
graph TD
    subgraph "Frontend (Next.js)"
        A[User] --> B{Home Page};
        B --> C[Login Button];
        C --> D[Redirect to Backend for Auth];
        B --> E{Dashboard};
        E --> F[Create Project Form];
        F --> G[Upload Files];
        E --> H[Project List];
        H --> I{Query Page};
        I --> J[Query Input];
    end

    subgraph "Backend (Express.js)"
        D --> K{/api/auth/login};
        K --> L[WorkOS API];
        L --> M[Redirect to Frontend with Session];
        G --> N{/api/upload};
        N --> O[Auth Middleware];
        O --> P[Save File to Disk];
        P --> Q[Store File Metadata in DB];
        Q --> R[Send File to AI Service];
        J --> S{/api/query};
        S --> T[Send Query to AI Service];
    end

    subgraph "AI Service (FastAPI)"
        R --> U{/api/process};
        U --> V[Process File];
        V --> W[Chunk Text];
        W --> X[Generate Embeddings];
        X --> Y[Store in Vector DB];
        T --> Z{/api/query};
        Z --> AA[Search Vector DB];
        AA --> BB[Generate Prompt];
        BB --> CC[Ollama API];
        CC --> DD[Stream Response to Backend];
    end

    subgraph "Database (PostgreSQL)"
        Q --> EE[Prisma Client];
        EE --> FF[Users, Projects, Files Tables];
    end

    subgraph "Vector Database (LanceDB)"
        Y --> GG[LanceDB];
        AA --> GG;
    end

    M --> E;
    R --> U;
    T --> Z;
    DD --> S;