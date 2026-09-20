import ImageConverterBase from "./ImageConverterBase";

export default function PngToJpg() {
  return (
    <ImageConverterBase
      toolId="png-to-jpg"
      inputMimes={["image/png"]}
      inputLabel="PNG"
      outputFormat="jpeg"
      note="JPG has no transparency, so any transparent areas in your PNG are filled with white."
      faq={[
        { q: "What happens to transparent areas?", a: "JPG can't store transparency, so transparent pixels are placed on a white background. If you need transparency, keep the PNG or convert to WebP instead." },
        { q: "How much smaller will the file be?", a: "Photos and screenshots often shrink dramatically — 70–90% is common. Simple graphics with flat colours may shrink less, and can even look worse as JPG." },
        { q: "What quality should I choose?", a: "80–90% is a good default: visually identical to most eyes but much smaller. Drop lower only if you need a specific file size." },
        { q: "Is anything uploaded to a server?", a: "No. Everything happens in your browser — no upload, no account, no storage." },
      ]}
    />
  );
}
