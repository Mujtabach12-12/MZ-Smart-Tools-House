import { Cloud, FolderOpen, Zap } from "lucide-react";
import MzAiRobot from "../ai/MzAiRobot";

export default function MobileAiFeatureStrip({ toolCount, categoryCount }) {
  return (
    <section className="mz-mobile-ai-strip" aria-label="MZ Smart Tools House highlights">
      <div className="mz-mobile-ai-strip-grid" aria-hidden="true" />
      <div className="mz-mobile-ai-stats">
        <span><Zap /><strong>{toolCount}+</strong><small>Tools</small></span>
        <span><FolderOpen /><strong>{categoryCount}</strong><small>Categories</small></span>
        <span><Cloud /><strong>Free</strong><small>to use</small></span>
      </div>
      <div className="mz-mobile-ai-robot-wrap">
        <MzAiRobot compact label="MZ AI" />
        <b>MZ AI</b>
      </div>
    </section>
  );
}
