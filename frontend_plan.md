# Frontend Plan for Transactional Project Creation

This document outlines the plan for updating the frontend to use the new transactional project creation endpoint.

## Modify the `onSubmit` Function

The `onSubmit` function in `app/dashboard/page.tsx` will be modified to send the project data and files in a single `FormData` object to the new `/api/project` endpoint.

### `FormData` Object

The `FormData` object will contain the following fields:

-   `project_name` (string): The title of the project.
-   `project_context` (string): A description of the project.
-   `files` (file[]): An array of files to be associated with the project.

### API Request

The `fetch` request will be updated to send a `POST` request to the `/api/project` endpoint with the `FormData` object as the body.

## Remove `createProject` Action

The `createProject` action in `app/actions/projects.ts` will no longer be needed, as the project creation will be handled by the new transactional endpoint. This action will be removed from the codebase.

This approach will simplify the frontend logic and ensure that the project creation process is handled in a single, atomic operation.