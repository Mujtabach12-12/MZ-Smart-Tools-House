import ImageConverterBase from "./ImageConverterBase";

export default function WebpToJpg() {
  return (
    <ImageConverterBase
      toolId="webp-to-jpg"
      inputMimes={["image/webp"]}
      inputLabel="WebP"
      outputFormat="jpeg"
      note="Useful when a site, printer or assignment portal won't accept WebP. Transparent areas are filled with white, since JPG has no transparency."
      faq={[
        { q: "Why would I convert WebP to JPG?", a: "Plenty of university portals, older software and print shops still only accept JPG. Converting gives you a file they'll definitely take." },
        { q: "What happens to transparency?", a: "JPG doesn't support it, so transparent pixels are placed on a white background." },
        { q: "Will the image lose quality?", a: "Slightly — WebP and JPG are both lossy, so re-encoding loses a little detail. Using 90%+ quality keeps this practically invisible." },
        { q: "My browser says it can't open the WebP.", a: "Very old browsers can't decode WebP at all. Updating your browser, or using Chrome, Edge or Firefox, will fix it." },
      ]}
    />
  );
}
