import ImageConverterBase from "./ImageConverterBase";

export default function JpgToWebp() {
  return (
    <ImageConverterBase
      toolId="jpg-to-webp"
      inputMimes={["image/jpeg", "image/jpg"]}
      inputLabel="JPG"
      outputFormat="webp"
      note="WebP usually produces a noticeably smaller file than JPG at the same visual quality, which makes it a good choice for websites and assignments you need to upload."
      faq={[
        { q: "Is WebP supported everywhere?", a: "All current browsers display WebP, and it's supported on Windows, macOS, Android and iOS. Some older desktop apps and a few university portals still don't accept it, so check before submitting coursework." },
        { q: "How much smaller is WebP than JPG?", a: "Typically 25–35% smaller at comparable quality, though it depends heavily on the image." },
        { q: "Can I convert back later?", a: "Yes — use the WebP to JPG tool. Keep in mind each lossy conversion loses a little detail, so convert from your original where you can." },
        { q: "Does this work offline?", a: "Once the page has loaded, yes — the conversion uses your browser's own image encoder, with no server involved." },
      ]}
    />
  );
}
