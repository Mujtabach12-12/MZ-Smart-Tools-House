/**
 * Quality control shared by every lossy image tool.
 *
 * Only rendered when the chosen output format actually honours a quality
 * value — PNG is lossless and `canvas.toBlob()` ignores the argument, so
 * showing this slider for PNG would be a control that does nothing.
 */
export default function QualitySlider({ value, onChange, id = "quality", disabled = false }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-navy-700 dark:text-navy-200">
          Quality
        </label>
        <span className="text-sm font-semibold text-brand-700 dark:text-brand-300">{value}%</span>
      </div>
      <input
        id={id}
        type="range"
        min="10"
        max="100"
        step="1"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-navy-100 accent-brand-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-navy-800"
      />
      <p className="mt-1 text-xs text-navy-400 dark:text-navy-500">
        Lower quality means a smaller file. 80–90% usually looks identical to the original.
      </p>
    </div>
  );
}
