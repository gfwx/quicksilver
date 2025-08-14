'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/file-upload';

export default function Dashboard() {
  const [files, setFiles] = useState([]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Upload and manage your documents
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors">
              Settings
            </button>
            <button className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors">
              Logout
            </button>
          </div>
        </div>

        {/* File Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4 text-card-foreground">Upload Documents</h2>
              <FileUpload />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Files */}
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4 text-card-foreground">Recent Files</h3>
              <div className="space-y-3">
                {files.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No files uploaded yet</p>
                ) : (
                  files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm text-muted-foreground truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground">{file.status}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-card rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4 text-card-foreground">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Files</span>
                  <span className="text-sm font-medium">{files.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Processing</span>
                  <span className="text-sm font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span className="text-sm font-medium">{files.filter(f => f.status === 'Processed').length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Query Section */}
        <div className="mt-8">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4 text-card-foreground">Query Your Documents</h2>
            <div className="flex space-x-4">
              <input
                type="text"
                placeholder="Ask a question about your documents..."
                className="flex-1 px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <select className="px-3 py-2 bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="llama3.2">Llama 3.2</option>
                <option value="qwen2.5">Qwen 2.5</option>
                <option value="phi3">Phi 3</option>
              </select>
              <button className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                Query
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
