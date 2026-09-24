// drag-drop-image-upload.tsx
import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
} from "lucide-react";

export interface UploadProgressItem {
  progress: number;
  fileName: string;
  status: "uploading" | "success" | "error" | "cancelled";
}

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  onFilesAdded?: (filesWithUrls: { file: File; blobUrl: string }[]) => void;
  uploadProgress?: Record<string, UploadProgressItem>;
  onCancelUpload?: (fileId: string) => void;
  translation: any
}

export default function DragDropImageUpload({
  images,
  onChange,
  onFilesAdded,
  uploadProgress = {},
  onCancelUpload,
  translation: t,
}: ImageUploadProps) {
  // Panggil hook useTranslation

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (files: FileList) => {
    const validImageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (validImageFiles.length === 0) return;

    const filePairs = validImageFiles.map((file) => ({
      file,
      blobUrl: URL.createObjectURL(file),
    }));

    if (onFilesAdded) {
      onFilesAdded(filePairs);
    }

    const newImageUrls = filePairs.map((p) => p.blobUrl);
    onChange([...images, ...newImageUrls]);
  };

  const handleRemoveOrCancel = (imageSrc: string, index: number) => {
    const progressItem = uploadProgress[imageSrc];

    // 1. Jika file sedang diunggah, batalkan proses upload-nya
    if (progressItem && progressItem.status === "uploading") {
      if (onCancelUpload) {
        onCancelUpload(imageSrc); // Memanggil cancelUpload di parent
      }
    }

    // 2. Hapus gambar dari array images lokal/UI
    const updatedImages = images.filter((_, i) => i !== index);
    onChange(updatedImages);
  };

  return (
    <div className="space-y-4">
      {/* AREA DRAG AND DROP DENGAN IKON UPLOAD */}
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
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
            : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              processFiles(e.target.files);
            }
          }}
        />

        {/* Ikon Upload */}
        <div className="p-3 bg-white dark:bg-zinc-900 rounded-full shadow-sm border border-zinc-100 dark:border-zinc-800">
          <UploadCloud className="h-6 w-6 text-zinc-500 dark:text-zinc-400" />
        </div>

        {/* Teks Deskripsi Menggunakan useTranslation */}
        <div className="text-center px-4">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            {t("dropImageText")}{" "}
            <span className="text-blue-500 hover:underline">
              {t("browseFiles")}
            </span>
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {t("supportedFormats")}
          </p>
        </div>
      </div>

      {/* GRID LIST GAMBAR */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {images.map((src, index) => {
            const progressItem = uploadProgress[src];
            const isUploading = progressItem?.status === "uploading";
            const isSuccess = progressItem?.status === "success";
            const isError = progressItem?.status === "error";

            return (
              <div
                key={src}
                className="relative group aspect-square rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900"
              >
                {src && src !== "" && (
                  <Image
                    src={src}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                )}

                {/* OVERLAY SPINNER & PROGRESS */}
                {progressItem && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1 text-white p-2">
                    {isUploading && (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                        <span className="text-[10px] font-bold tracking-wider">
                          {progressItem.progress}%
                        </span>
                      </>
                    )}
                    {isSuccess && (
                      <>
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                        <span className="text-[10px] font-medium text-emerald-200">
                          {t("uploadSuccess")}
                        </span>
                      </>
                    )}
                    {isError && (
                      <>
                        <AlertCircle className="w-6 h-6 text-rose-400" />
                        <span className="text-[10px] font-medium text-rose-200">
                          {t("uploadFailed")}
                        </span>
                      </>
                    )}
                  </div>
                )}

                {/* TOMBOL CROSS (CANCEL / DELETE) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveOrCancel(src, index);
                  }}
                  className={`absolute top-1.5 right-1.5 p-1 rounded-full text-white shadow-md transition-all ${
                    isUploading
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-rose-400"
                  }`}
                  title={isUploading ? t("cancelUpload") : t("removeImage")}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
