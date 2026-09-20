import ImageConverterBase from "./ImageConverterBase";

export default function JpgToPng() {
  return (
    <ImageConverterBase
      toolId="jpg-to-png"
      inputMimes={["image/jpeg", "image/jpg"]}
      inputLabel="JPG"
      outputFormat="png"
      note="PNG stores every pixel exactly, so the file is usually larger than the JPG you started with. That's expected — you're trading file size for a lossless copy."
      faq={[
        { q: "Why is my PNG bigger than the JPG?", a: "PNG is lossless: it keeps every pixel exactly as it is instead of throwing detail away. JPG gets its small size by discarding data, so converting the other way almost always increases file size." },
        { q: "Does this improve the image quality?", a: "No. Detail already lost by JPG compression can't be recovered — the PNG is a faithful copy of the JPG, not a better version of the original photo." },
        { q: "Will my JPG be uploaded anywhere?", a: "No. The conversion runs entirely in your browser using the Canvas API. Your image never leaves your device." },
        { q: "Is transparency added?", a: "PNG supports transparency, but a JPG has none to begin with, so the result is fully opaque." },
      ]}
    />
  );
}
