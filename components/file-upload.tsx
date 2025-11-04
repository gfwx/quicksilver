'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
  value?: File[];
  onChange?: (files: File[]) => void;
  error?: string;
}

export function FileUpload({ value = [], onChange, error }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (onChange) {
      onChange([...value, ...acceptedFiles]);
    }
  }, [value, onChange]);

  const removeFile = useCallback((index: number) => {
    if (onChange) {
      const newFiles = value.filter((_, i) => i !== index);
      onChange(newFiles);
    }
  }, [value, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-md cursor-pointer transition-colors ${isDragActive
              ? 'border-primary bg-primary/10'
              : error
                ? 'border-destructive bg-destructive/10'
                : 'border-border'
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

        {error && (
          <p className="text-sm text-destructive mt-2">{error}</p>
        )}

        {value.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Uploaded Files:</h4>
            <div className="space-y-2">
              {value.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                  <span className="text-sm text-muted-foreground truncate">
                    {file.name}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
