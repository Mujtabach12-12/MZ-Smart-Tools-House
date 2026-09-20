import ImageConverterBase from "./ImageConverterBase";

export default function PngToWebp() {
  return (
    <ImageConverterBase
      toolId="png-to-webp"
      inputMimes={["image/png"]}
      inputLabel="PNG"
      outputFormat="webp"
      note="WebP supports transparency, so transparent areas in your PNG are preserved."
      faq={[
        { q: "Does WebP keep my PNG's transparency?", a: "Yes. Unlike JPG, WebP has an alpha channel, so transparent backgrounds survive the conversion." },
        { q: "Will the file get smaller?", a: "Usually a lot smaller — WebP compresses both photos and graphics better than PNG. Very small or very simple PNGs occasionally end up about the same size." },
        { q: "Is this lossless?", a: "This tool writes lossy WebP, controlled by the quality slider. At 90–100% the difference is hard to see, but it is not a pixel-perfect copy." },
        { q: "Are my files uploaded?", a: "No. The conversion happens locally in your browser." },
      ]}
    />
  );
}
