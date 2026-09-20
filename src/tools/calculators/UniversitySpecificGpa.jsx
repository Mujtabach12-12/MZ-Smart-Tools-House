import { useParams } from "react-router-dom";
import UniversityGpaCalculator from "./UniversityGpaCalculator";
export function PakistanUniversityGpaCalculator(){ return <UniversityGpaCalculator initialMode="gpa"/>; }
export function UolGpaCalculator(){ return <UniversityGpaCalculator initialMode="gpa" initialUniversity="uol"/>; }
export function UcpGpaCalculator(){ return <UniversityGpaCalculator initialMode="gpa" initialUniversity="ucp"/>; }
export function CustomGpaCalculator(){ return <UniversityGpaCalculator initialMode="gpa" initialUniversity={null}/>; }
