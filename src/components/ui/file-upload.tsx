import * as React from "react";
import { UploadCloud } from "lucide-react";

interface FileUploadProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "accept" | "onChange" | "type" | "value"
> {
  accept: string;
  acceptedTypesLabel?: string;
  value?: string;
  onValueChange: (value: string) => void;
  inputRef?: React.Ref<HTMLInputElement>;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
}

function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

export const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      accept,
      acceptedTypesLabel = "selected file types",
      value,
      onValueChange,
      inputRef,
      onUploadStart,
      onUploadEnd,
      onBlur,
      ...inputProps
    },
    forwardedRef
  ) => {
    const internalRef = React.useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [isUploading, setIsUploading] = React.useState(false);
    const [fileName, setFileName] = React.useState("");
    const [error, setError] = React.useState("");
    const isImageUploaded = value?.startsWith("data:image/") ?? false;
    const isFileUploaded = Boolean(value);

    const setInputRef = (node: HTMLInputElement | null) => {
      internalRef.current = node;
      assignRef(forwardedRef, node);
      assignRef(inputRef, node);
    };

    const processFile = (file?: File) => {
      if (!file || isUploading) return;

      const isAccepted = accept.split(",").some((acceptedType) => {
        const type = acceptedType.trim().toLowerCase();
        if (type.startsWith(".")) return file.name.toLowerCase().endsWith(type);
        if (type.endsWith("/*")) return file.type.toLowerCase().startsWith(type.slice(0, -1));
        return file.type.toLowerCase() === type;
      });

      if (!isAccepted) {
        setError("Choose a file in an accepted format.");
        return;
      }

      setError("");
      setIsUploading(true);
      onUploadStart?.();
      const reader = new FileReader();
      let uploadFinished = false;
      const finishUpload = () => {
        if (uploadFinished) return;
        uploadFinished = true;
        setIsUploading(false);
        onUploadEnd?.();
      };

      reader.onload = () => {
        if (typeof reader.result === "string") {
          onValueChange(reader.result);
          setFileName(file.name);
        } else {
          setError("Unable to read the selected file. Please try again.");
        }
        finishUpload();
      };
      reader.onerror = () => {
        setError("Unable to read the selected file. Please try again.");
        finishUpload();
      };
      reader.onabort = () => {
        setError("File reading was interrupted. Please select the file again.");
        finishUpload();
      };

      try {
        reader.readAsDataURL(file);
      } catch {
        setError("Unable to read the selected file. Please try again.");
        finishUpload();
      }
    };

    const openFilePicker = () => internalRef.current?.click();

    return (
      // `relative` keeps the visually hidden input inside this box
      <div className="relative">
        {/* A plain input, not the styled Input: its w-full/h-10 would override sr-only and leave an invisible,
            full-width box sticking out of the card, which scrolls the form sideways when it is focused */}
        <input
          {...inputProps}
          // The error state belongs to the visible drop zone below, so "go to the first invalid field" lands there
          aria-invalid={undefined}
          aria-describedby={undefined}
          ref={setInputRef}
          type="file"
          accept={accept}
          onBlur={onBlur}
          onChange={(event) => {
            processFile(event.target.files?.[0]);
            event.target.value = "";
          }}
          className="sr-only"
          tabIndex={-1}
        />
        <div
          role="button"
          tabIndex={0}
          aria-label={inputProps["aria-label"] || "Upload file"}
          aria-invalid={inputProps["aria-invalid"]}
          aria-describedby={inputProps["aria-describedby"]}
          onClick={openFilePicker}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openFilePicker();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            processFile(event.dataTransfer.files[0]);
          }}
          className={`min-w-0 w-full cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            isDragging
              ? "border-indigo-500 bg-indigo-50"
              : "border-slate-300 bg-white hover:border-indigo-400"
          }`}
        >
          <UploadCloud className="mx-auto mb-2 h-8 w-8 text-slate-400" />
          {isImageUploaded ? (
            <>
              <p className="text-sm font-medium text-emerald-700">Image Uploaded</p>
            </>
          ) : isFileUploaded ? (
            <>
              <p className="text-sm font-medium text-emerald-700">File Uploaded</p>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                Drop a file here or <span className="font-medium text-indigo-600">browse files</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">Accepted: {acceptedTypesLabel}</p>
            </>
          )}
          {fileName && (
            <p className="mt-2 break-words text-sm font-medium text-emerald-700">{fileName}</p>
          )}
          {isUploading && <p className="mt-2 text-sm text-slate-500">Reading file...</p>}
          {error && (
            <p role="alert" className="mt-2 break-words text-sm font-medium text-destructive">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }
);

FileUpload.displayName = "FileUpload";
