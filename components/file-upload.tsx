'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud } from 'lucide-react';

export function FileUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Here you would typically handle the file upload to your backend
    console.log(acceptedFiles);
    setUploadedFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
  });

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Upload Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-md cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border'
            }`}
        >
          <input {...getInputProps()} />
          <UploadCloud className="w-12 h-12 text-muted-foreground" />
          {isDragActive ? (
            <p className="mt-2 text-primary">Drop the files here ...</p>
          ) : (
            <p className="mt-2 text-muted-foreground">
              Drag & drop files here, or click to select (PDF, TXT)
            </p>
          )}
        </div>
        {uploadedFiles.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold">Uploaded Files:</h4>
            <ul className="list-disc list-inside">
              {uploadedFiles.map((file, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  {file.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
