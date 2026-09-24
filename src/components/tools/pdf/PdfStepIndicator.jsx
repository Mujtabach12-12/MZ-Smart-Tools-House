export default function PdfStepIndicator({ current = 1, steps = ["Select", "Configure", "Process", "Download"] }) {
  return (
    <ol className="mz-pdf-stepper" aria-label="Tool progress">
      {steps.map((label, index) => {
        const step = index + 1;
        const state = step < current ? "is-done" : step === current ? "is-active" : "";
        return <li key={label} className={state}><span>{step}</span><strong>{label}</strong></li>;
      })}
    </ol>
  );
}
