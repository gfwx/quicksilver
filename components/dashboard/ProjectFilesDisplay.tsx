import type { PrismaModels } from "@/lib/instances";

interface ProjectFilesDisplayProps {
  files: PrismaModels["File"][];
}

export const ProjectFilesDisplay = ({ files }: ProjectFilesDisplayProps) => {
  return (
    <div className="flex flex-col space-y-2 p-4">
      <h3 className="font-semibold text-lg mb-2">Project Files</h3>
      {files.length === 0 ? (
        <p>No files available.</p>
      ) : (
        files.map((file) => (
          <div
            key={file.id}
            className="flex justify-between items-center border-b pb-2"
          >
            <span className="font-medium">{file.filename}</span>
            <span className="text-sm text-gray-600">{file.size} bytes</span>
            <span className="text-sm text-gray-500">
              {new Date(file.createdAt).toLocaleDateString()}
            </span>
          </div>
        ))
      )}
    </div>
  );
};
