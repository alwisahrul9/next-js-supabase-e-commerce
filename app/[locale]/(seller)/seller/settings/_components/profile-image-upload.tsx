"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  RefreshCw,
} from "lucide-react";
import * as tus from "tus-js-client";
import { toast } from "@/components/ui/toast";
import { useTranslations } from "next-intl";

interface ProfileImageUploadProps {
  image: string | null;
  onChange: (image: string | null) => void;
  supabaseToken: string;
  supabaseUrl: string;
  bucketName: string;
  onUploadComplete?: (image: string) => void;
  onRemove?: (image: string) => void;
}

const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default function ProfileImageUpload({
  image,
  onChange,
  supabaseToken,
  supabaseUrl,
  bucketName = "profiles",
  onUploadComplete,
  onRemove,
}: ProfileImageUploadProps) {
  const t = useTranslations("Upload");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    progress: number;
    status: "uploading" | "success" | "error";
    errorMessage?: string;
  } | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeUploadRef = useRef<tus.Upload | null>(null);
  // Keep a reference to the file so we can retry later
  const pendingFileRef = useRef<File | null>(null);
  const targetFileNameRef = useRef<string | null>(null);

  const startTusUpload = useCallback(
    (file: File, fileName: string) => {
      // If there is an active upload, abort it first
      if (activeUploadRef.current) {
        activeUploadRef.current.abort();
        activeUploadRef.current = null;
      }

      const isRetry = targetFileNameRef.current === fileName;
      pendingFileRef.current = file;
      targetFileNameRef.current = fileName;

      const directTusEndpoint = `${supabaseUrl}/storage/v1/upload/resumable`;

      setUploadProgress((prev) => ({
        progress: isRetry ? (prev?.progress || 0) : 0,
        status: "uploading",
      }));

      let maxProgressSoFar = isRetry ? (uploadProgress?.progress || 0) : 0;

      const upload = new tus.Upload(file, {
        endpoint: directTusEndpoint,
        // More aggressive retry delays: 0s, 1s, 3s, 5s, 10s, 15s, 20s, 30s
        retryDelays: [0, 1000, 3000, 5000, 10000, 15000, 20000, 30000],
        headers: {
          authorization: `Bearer ${supabaseToken || SUPABASE_ANON_KEY}`,
          apikey: SUPABASE_ANON_KEY,
          "x-upsert": "true",
        },
        uploadDataDuringCreation: true,
        // Keep fingerprint so TUS can find and resume previous uploads
        removeFingerprintOnSuccess: true,
        metadata: {
          bucketName: bucketName,
          objectName: fileName,
          contentType: file.type || "image/png",
        },
        chunkSize: 6 * 1024 * 1024,

        // Always retry on network errors (ProgressEvent = connection lost)
        onShouldRetry: (err, retryAttempt, _options) => {
          const status = (err as any)?.originalResponse?.getStatus?.();

          // Don't retry on auth errors (401/403)
          if (status === 401 || status === 403) return false;

          // For all other errors (including network drops where status is undefined),
          // keep retrying as long as we have retry delays left
          return true;
        },

        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
          if (percentage > maxProgressSoFar) maxProgressSoFar = percentage;

          setUploadProgress((prev) =>
            prev
              ? { ...prev, progress: maxProgressSoFar }
              : { progress: maxProgressSoFar, status: "uploading" }
          );
        },

        onSuccess: () => {
          setUploadProgress({ progress: 100, status: "success" });
          activeUploadRef.current = null;
          pendingFileRef.current = null;
          targetFileNameRef.current = null;
          setLocalPreview(null);
          const rawPublicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${fileName}`;
          const finalUrl = `${rawPublicUrl}?t=${Date.now()}`;
          onChange(finalUrl);
          if (onUploadComplete) {
            onUploadComplete(finalUrl);
          }
        },

        onError: (error) => {
          console.error("Upload error:", error);
          activeUploadRef.current = null;

          // Determine error type for the right message
          const status = (error as any)?.originalResponse?.getStatus?.();
          let errorMsg: string;
          if (status === 401 || status === 403) {
            errorMsg = t("unauthorized");
          } else if (
            !status ||
            (error as any)?.originalRequest === undefined
          ) {
            // No status = network level failure
            errorMsg = t("networkError");
          } else {
            errorMsg = t("uploadFailed");
          }

          setUploadProgress((prev) => ({
            progress: prev?.progress || 0,
            status: "error",
            errorMessage: errorMsg,
          }));
          toast.add({ type: "error", title: errorMsg });
        },
      });

      activeUploadRef.current = upload;
      upload.start();
    },
    [supabaseToken, supabaseUrl, bucketName, onChange, onUploadComplete, t]
  );

  const handleUpload = useCallback(
    (file: File) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `uploads/${crypto.randomUUID()}.${fileExt}`;
      startTusUpload(file, fileName);
    },
    [startTusUpload]
  );

  const handleRetry = useCallback(() => {
    const file = pendingFileRef.current;
    const fileName = targetFileNameRef.current;
    if (file && fileName) {
      startTusUpload(file, fileName);
    }
  }, [startTusUpload]);

  // Listen for browser online event to resume a paused/errored upload
  useEffect(() => {
    const handleOnline = () => {
      if (uploadProgress?.status === "error" && pendingFileRef.current && targetFileNameRef.current) {
        handleRetry();
      } else if (activeUploadRef.current && uploadProgress?.status === "uploading") {
        activeUploadRef.current.start();
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [uploadProgress?.status, handleRetry]);

  const processFiles = (files: FileList) => {
    const validImageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (validImageFiles.length === 0) return;

    // We only take the first file for profile image
    const file = validImageFiles[0];

    // Optimistic local preview
    const blobUrl = URL.createObjectURL(file);
    setLocalPreview(blobUrl);

    // Start upload
    handleUpload(file);
  };

  const handleRemoveOrCancel = () => {
    if (activeUploadRef.current) {
      activeUploadRef.current.abort();
      activeUploadRef.current = null;
    }
    pendingFileRef.current = null;
    targetFileNameRef.current = null;
    setUploadProgress(null);
    setLocalPreview(null);
    onChange(null);
    if (image && onRemove) {
      onRemove(image);
    }
  };

  const displayImage = localPreview || image;

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files) {
            processFiles(e.dataTransfer.files);
          }
        }}
        onClick={() => !image && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all ${
          displayImage ? "border-transparent" : isDragging
            ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 p-8 cursor-pointer"
            : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 p-8 cursor-pointer"
        }`}
      >
        {!displayImage && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  processFiles(e.target.files);
                }
              }}
            />
            <div className="p-3 bg-white dark:bg-zinc-900 rounded-full shadow-sm border border-zinc-100 dark:border-zinc-800 mb-3">
              <UploadCloud className="h-6 w-6 text-zinc-500 dark:text-zinc-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {t("dragDrop")}{" "}
                <span className="text-orange-500 hover:underline">
                  {t("chooseFile")}
                </span>
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {t("fileLimit")}
              </p>
            </div>
          </>
        )}

        {displayImage && (
          <div className="relative w-32 h-32 rounded-full overflow-hidden group border-4 border-white dark:border-zinc-900 shadow-md">
            <Image
              src={displayImage}
              alt="Profile Preview"
              fill
              className="object-cover"
            />

            {uploadProgress && uploadProgress.status === "uploading" && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1 text-white z-10 p-2">
                <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
                <span className="text-[10px] font-bold tracking-wider">{uploadProgress.progress}%</span>
              </div>
            )}

            {uploadProgress && uploadProgress.status === "success" && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none p-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
            )}

            {uploadProgress && uploadProgress.status === "error" && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex flex-col items-center justify-center text-white z-10 gap-1 p-2">
                <AlertCircle className="w-6 h-6 text-rose-400" />
                <span className="text-[10px] font-medium text-rose-200 text-center leading-tight">
                  {uploadProgress.errorMessage}
                </span>
                {pendingFileRef.current && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRetry();
                    }}
                    className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 rounded-full px-3 py-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {t("retry")}
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveOrCancel();
              }}
              className="absolute top-2 right-2 bg-rose-500 hover:bg-rose-600 text-white p-1 rounded-full shadow-lg z-20 transition-transform scale-0 group-hover:scale-100"
              title={t("remove")}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
