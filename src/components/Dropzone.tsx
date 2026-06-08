"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getFirebaseAuth, getFirebaseStorage } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function Dropzone() {
  const [files, setFiles] = useState<{ file: File; progress: number; status: "uploading" | "processing" | "done" | "error" }[]>([]);

  const onDrop = useCallback(async (accepted: File[]) => {
    const auth = getFirebaseAuth();
    const storage = getFirebaseStorage();
    const user = auth?.currentUser;
    if (!user || !storage) return;

    for (const file of accepted) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB limit`);
        continue;
      }
      if (!file.name.endsWith(".pdf") && !file.name.endsWith(".txt")) {
        toast.error(`${file.name} is not supported. Use PDF or TXT.`);
        continue;
      }

      const entry = { file, progress: 0, status: "uploading" as const };
      setFiles((prev) => [...prev, entry]);

      const storageRef = ref(storage, `documents/${user.uid}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setFiles((prev) =>
            prev.map((f) => (f.file.name === file.name ? { ...f, progress } : f))
          );
        },
        () => {
          toast.error(`Upload failed for ${file.name}`);
          setFiles((prev) =>
            prev.map((f) => (f.file.name === file.name ? { ...f, status: "error" as const } : f))
          );
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setFiles((prev) =>
            prev.map((f) => (f.file.name === file.name ? { ...f, status: "processing" as const } : f))
          );

          try {
            const token = await user.getIdToken();
            const res = await fetch("/api/documents/ingest", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({ fileName: file.name, sourceUrl: downloadUrl, fileType: file.name.endsWith(".pdf") ? "pdf" : "txt" }),
            });

            if (!res.ok) throw new Error(await res.text());
            setFiles((prev) =>
              prev.map((f) => (f.file.name === file.name ? { ...f, status: "done" as const } : f))
            );
            toast.success(`${file.name} processed successfully`);
            setTimeout(() => {
              setFiles((prev) => prev.filter((f) => f.file.name !== file.name));
            }, 3000);
          } catch {
            toast.error(`Processing failed for ${file.name}`);
            setFiles((prev) =>
              prev.map((f) => (f.file.name === file.name ? { ...f, status: "error" as const } : f))
            );
          }
        }
      );
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "text/plain": [".txt"] },
    maxSize: 10 * 1024 * 1024,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
        <p className="font-medium">
          {isDragActive ? "Drop files here" : "Drag & drop PDFs or TXT files"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">Maximum file size: 10MB</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f) => (
            <div key={f.file.name} className="flex items-center gap-3 p-3 rounded-lg border border-border">
              <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{f.file.name}</p>
                <Progress value={f.progress} className="h-1.5 mt-1" />
              </div>
              <div className="shrink-0">
                {f.status === "uploading" || f.status === "processing" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : f.status === "done" ? (
                  <span className="text-xs text-green-500">Done</span>
                ) : f.status === "error" ? (
                  <X className="h-4 w-4 text-destructive" />
                ) : null}
              </div>
              {f.status === "error" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setFiles((prev) => prev.filter((x) => x.file.name !== f.file.name))}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
