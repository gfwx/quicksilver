# Backend Plan for Transactional Project Creation

This document outlines the plan for creating a new backend endpoint to handle project creation in a single, atomic transaction.

## New Endpoint: `POST /api/project`

A new endpoint will be created at `/api/project` to handle the creation of projects. This endpoint will accept a `multipart/form-data` request containing the project's title, context, and the associated files.

### Request Body

-   `project_name` (string): The title of the project.
-   `project_context` (string): A description of the project.
-   `files` (file[]): An array of files to be associated with the project.

### Middleware

The endpoint will use the existing `authMiddleware` to ensure that the user is authenticated before creating a project.

## Transactional Logic

The core of the new endpoint will be a transactional process that ensures a project is only created if the associated files are successfully uploaded and processed. The following steps will be executed within a Prisma transaction:

1.  **Create Project:** A new project will be created in the database with the provided title and context.
2.  **Process Files:** For each uploaded file, the following actions will be taken:
    -   The file will be saved to the server's file system.
    -   File metadata (e.g., filename, size, type) will be stored in the database and associated with the newly created project.
    -   The file will be sent to the AI service for processing.
3.  **Commit or Rollback:**
    -   If all steps are completed successfully, the transaction will be committed, and the new project will be saved to the database.
    -   If any step fails, the transaction will be rolled back, and any files that were saved to the file system will be deleted.

This approach will ensure that the database remains in a consistent state and that no orphaned projects are created.