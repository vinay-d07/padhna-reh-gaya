"use client";

import { useRef, useState } from "react";
import { UploadCloud, FileText, X } from "lucide-react";
import Modal from "@/components/Modal";

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadModal({ open, onClose, onUpload }) {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const addFiles = (fileList) => {
    const pdfFiles = Array.from(fileList).filter((f) => f.type === "application/pdf");
    setFiles((prev) => [...prev, ...pdfFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  };

  const handleRemove = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    setFiles([]);
    onClose();
  };

  const handleSubmit = () => {
    if (files.length === 0) return;
    onUpload?.(files);
    setFiles([]);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Add documents">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center gap-3 rounded-card border-2 border-dashed p-10 text-center transition-colors ${
          dragActive ? "border-carbon-black bg-mist-gray" : "border-ash hover:border-carbon-black"
        }`}
      >
        <UploadCloud size={28} className="text-carbon-black" />
        <p className="text-body-sm text-carbon-black">
          Drop PDFs here, or click to browse
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          onChange={(e) => addFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 rounded-lg bg-mist-gray px-3 py-2.5"
            >
              <FileText size={16} className="shrink-0 text-carbon-black" />
              <span className="flex-1 truncate text-body-sm text-carbon-black">{file.name}</span>
              <span className="font-mono text-caption text-smoke">{formatSize(file.size)}</span>
              <button
                onClick={() => handleRemove(index)}
                aria-label={`Remove ${file.name}`}
                className="text-slate hover:text-carbon-black"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={handleClose}
          className="rounded-lg border-[1.5px] border-slate px-5 py-3 text-body-sm font-medium text-slate transition-colors hover:border-carbon-black hover:text-carbon-black"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={files.length === 0}
          className="rounded-lg bg-carbon-black px-5 py-3 text-body-sm font-medium text-paper-white transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          Add {files.length > 0 ? files.length : ""} document{files.length === 1 ? "" : "s"}
        </button>
      </div>
    </Modal>
  );
}
