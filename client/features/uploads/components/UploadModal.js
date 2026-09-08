"use client";

import { useRef, useState } from "react";
import { UploadCloud, FileText, X } from "lucide-react";
import Modal from "@/components/Modal";

const ACCEPTED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024;

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadModal({ open, onClose, onUpload }) {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [rejections, setRejections] = useState([]);
  const inputRef = useRef(null);

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList);
    const accepted = [];
    const rejected = [];

    for (const file of incoming) {
      if (!ACCEPTED_MIME_TYPES.has(file.type)) {
        rejected.push(`${file.name} — unsupported file type`);
      } else if (file.size > MAX_FILE_SIZE) {
        rejected.push(`${file.name} — exceeds the 25MB limit`);
      } else {
        accepted.push(file);
      }
    }

    setFiles((prev) => [...prev, ...accepted]);
    setRejections(rejected);
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
    setRejections([]);
    onClose();
  };

  const handleSubmit = () => {
    if (files.length === 0) return;
    onUpload?.(files);
    setFiles([]);
    setRejections([]);
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
          Drop PDF, DOCX, PPTX, or TXT files here, or click to browse
        </p>
        <p className="font-mono text-caption uppercase text-smoke">Up to 25MB per file · multiple files OK</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.pptx,.txt"
          multiple
          onChange={(e) => addFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {rejections.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1">
          {rejections.map((message) => (
            <li key={message} className="text-caption text-red-600">
              {message}
            </li>
          ))}
        </ul>
      )}

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
