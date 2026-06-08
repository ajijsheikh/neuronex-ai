"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getFirebaseAuth, getFirebaseStorage } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Image, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface FileEntry {
  file: File;
  progress: number;
  status: "uploading" | "processing" | "done" | "error";
  errorMsg?: string;
}

const ACCEPTED = {
  "application/pdf": [".pdf"],
  "text/plain": [".txt"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
};

const MAX_SIZE = 10 * 1024 * 1024;

function getFileType(name: string): string {
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".txt")) return "txt";
  return "image";
}

function getFileIcon(name: string) {
  return name.endsWith(".pdf") || name.endsWith(".txt") ? FileText : Image;
}

export function Dropzone() {
  const [files, setFiles] = useState<FileEntry[]>([]);

  const onDrop = useCallback(async (accepted: File[]) => {
    const auth = getFirebaseAuth();
    const storage = getFirebaseStorage();
    const user = auth?.currentUser;
    if (!user || !storage) {
      toast.error("Storage unavailable. Check Firebase configuration.");
      return;
    }

    for (const file of accepted) {
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name} exceeds 10MB limit`);
        continue;
      }

      const entry: FileEntry = { file, progress: 0, status: "uploading" };
      setFiles((prev) => [...prev, entry]);

      const fileType = getFileType(file.name);
      const storageRef = ref(storage, `documents/${user.uid}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snap) => {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          setFiles((prev) => prev.map((f) => (f.file.name === file.name ? { ...f, progress: pct } : f)));
        },
        () => {
          setFiles((prev) => prev.map((f) => (f.file.name === file.name ? { ...f, status: "error", errorMsg: "Upload failed" } : f)));
          toast.error(`Upload failed for ${file.name}`);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            setFiles((prev) => prev.map((f) => (f.file.name === file.name ? { ...f, status: "processing" } : f)));

            const token = await user.getIdToken();
            const res = await fetch("/api/documents/ingest", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ fileName: file.name, sourceUrl: downloadUrl, fileType }),
            });

            if (!res.ok) throw new Error(await res.text());
            setFiles((prev) => prev.map((f) => (f.file.name === file.name ? { ...f, status: "done", progress: 100 } : f)));
            toast.success(`${file.name} processed`);
            setTimeout(() => setFiles((prev) => prev.filter((f) => f.file.name !== file.name)), 4000);
          } catch {
            setFiles((prev) => prev.map((f) => (f.file.name === file.name ? { ...f, status: "error", errorMsg: "Processing failed" } : f)));
            toast.error(`Processing failed for ${file.name}`);
          }
        }
      );
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxSize: MAX_SIZE,
    maxFiles: 10,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`relative rounded-xl border-2 border-dashed p-12 sm:p-16 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground/50 hover:bg-muted/30"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">
              {isDragActive ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, TXT, PNG, JPG, WebP &middot; Max 10MB per file
            </p>
          </div>
          <Button variant="outline" size="sm" className="text-xs mt-2 pointer-events-none">
            Browse Files
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-muted-foreground" />
          <span>Documents: PDF, TXT</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-muted-foreground" />
          <span>Images: PNG, JPG, WebP</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-muted-foreground" />
          <span>Future: Web URLs, GitHub Repos</span>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Processing Queue</h3>
          {files.map((f) => {
            const Icon = getFileIcon(f.file.name);
            return (
              <div key={f.file.name} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium truncate">{f.file.name}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                      {(f.file.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  <Progress value={f.progress} className="h-1" />
                </div>
                <div className="shrink-0">
                  {f.status === "uploading" || f.status === "processing" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : f.status === "done" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                </div>
                {f.status === "error" && (
                  <Button variant="ghost" size="icon-xs" className="h-6 w-6" onClick={() => setFiles((prev) => prev.filter((x) => x.file.name !== f.file.name))}>
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
