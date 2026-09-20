export default function Field({ label, htmlFor, children, hint }) {
  return (
    <div>
      {label && (
        <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-navy-700 dark:text-navy-200">
          {label}
        </label>
      )}
      {children}
      {hint && <p className="mt-1 text-xs text-navy-400 dark:text-navy-500">{hint}</p>}
    </div>
  );
}
