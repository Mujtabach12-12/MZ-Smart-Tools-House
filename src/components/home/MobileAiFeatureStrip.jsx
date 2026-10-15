import { lazy, Suspense, useEffect, useState } from "react";
import { Bot, Cloud, FolderOpen, Zap } from "lucide-react";

const MzAiRobot = lazy(() => import("../ai/MzAiRobot"));

export default function MobileAiFeatureStrip({ toolCount, categoryCount }) {
  const [robotReady, setRobotReady] = useState(false);

  useEffect(() => {
    let timer = 0;
    let idleId = 0;
    const reveal = () => setRobotReady(true);
    if ("requestIdleCallback" in window) idleId = window.requestIdleCallback(reveal, { timeout: 1800 });
    else timer = window.setTimeout(reveal, 1200);
    return () => {
      if (idleId && "cancelIdleCallback" in window) window.cancelIdleCallback(idleId);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return (
    <section className="mz-mobile-ai-strip" aria-label="MZ Smart Tools House highlights">
      <div className="mz-mobile-ai-strip-grid" aria-hidden="true" />
      <div className="mz-mobile-ai-stats">
        <span><Zap /><strong>{toolCount}+</strong><small>Tools</small></span>
        <span><FolderOpen /><strong>{categoryCount}</strong><small>Categories</small></span>
        <span><Cloud /><strong>Free</strong><small>to use</small></span>
      </div>
      <div className="mz-mobile-ai-robot-wrap">
        {robotReady ? (
          <Suspense fallback={<span className="mz-mobile-ai-robot-fallback" aria-hidden="true"><Bot /></span>}>
            <MzAiRobot compact label="MZ AI" mood="happy" />
          </Suspense>
        ) : (
          <span className="mz-mobile-ai-robot-fallback" aria-hidden="true"><Bot /></span>
        )}
        <b>MZ AI</b>
      </div>
    </section>
  );
}
