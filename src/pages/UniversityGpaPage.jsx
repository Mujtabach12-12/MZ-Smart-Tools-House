import { useParams, Navigate } from "react-router-dom";
import UniversityGpaCalculator from "../tools/calculators/UniversityGpaCalculator";

const aliases = { uol:"uol", ucp:"ucp", comsats:"comsats", fast:"fast", nust:"nust", giki:"giki", lums:"lums", bahria:"bahria", air:"air", uet:"uet-lahore", "uet-lahore":"uet-lahore", iba:"iba", ned:"ned", gcu:"gcu-lahore", fcc:"fcc", uog:"uog", uskt:"uskt", superior:"superior", riphah:"riphah", umt:"umt", lgu:"lgu", itu:"itu", ue:"ue", numl:"numl", iub:"iub", bzu:"bzu", uop:"uop", uob:"uob" };
export default function UniversityGpaPage() {
  const { university } = useParams();
  const id = aliases[String(university || "").toLowerCase()];
  if (!id) return <Navigate to="/tools/gpa-calculator" replace />;
  return <UniversityGpaCalculator initialMode="gpa" initialUniversity={id} standalonePath={`/gpa-calculator/${university}`} />;
}
