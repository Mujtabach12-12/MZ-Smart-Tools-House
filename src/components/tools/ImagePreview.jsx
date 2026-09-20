import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { formatBytes } from "../../lib/pdf/core";

/**
 * Thumbnail + filename + size + pixel dimensions for a selected image.
 *
 * The object URL is created and revoked inside this component so no tool has
 * to remember to clean it up. Dimensions are read from the preview <img>
 * itself, which avoids a second decode.
 */
export default function ImagePreview({ file, onRemove, onLoad, label = "Selected image" }) {
  const [url, setUrl] = useState("");
  const [dimensions, setDimensions] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!file) return undefined;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    setDimensions(null);
    setFailed(false);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!file) return null;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-navy-100 bg-white p-4 dark:border-navy-800 dark:bg-navy-900 sm:flex-row sm:items-center">
      <div className="flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-navy-50 dark:bg-navy-800 sm:w-36">
        {url && !failed ? (
          <img
            src={url}
            alt={label}
            className="max-h-28 max-w-full object-contain"
            onLoad={(e) => {
              const { naturalWidth, naturalHeight } = e.currentTarget;
              setDimensions({ width: naturalWidth, height: naturalHeight });
              onLoad?.({ width: naturalWidth, height: naturalHeight });
            }}
            onError={() => setFailed(true)}
          />
        ) : (
          <span className="px-2 text-center text-xs text-navy-400 dark:text-navy-500">
            Preview unavailable
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-navy-900 dark:text-navy-50">{file.name}</p>
        <dl className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-navy-500 dark:text-navy-400">
          <div>
            <dt className="inline">Size: </dt>
            <dd className="inline font-medium">{formatBytes(file.size)}</dd>
          </div>
          {dimensions && (
            <div>
              <dt className="inline">Dimensions: </dt>
              <dd className="inline font-medium">
                {dimensions.width} × {dimensions.height} px
              </dd>
            </div>
          )}
          {file.type && (
            <div>
              <dt className="inline">Type: </dt>
              <dd className="inline font-medium uppercase">{file.type.replace("image/", "")}</dd>
            </div>
          )}
        </dl>
      </div>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${file.name}`}
          className="shrink-0 self-start text-navy-400 transition hover:text-red-600 sm:self-center"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
