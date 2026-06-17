// Decorative food-scatter elements – salt, crumbs, herbs
// Mirror the visual language of the hero flatlay throughout the page

type ScatterProps = {
  variant?: "salt" | "crumbs" | "herbs" | "mixed";
  flip?: boolean;
  className?: string;
};

export function Scatter({ variant = "mixed", flip = false, className = "" }: ScatterProps) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none select-none ${flip ? "scale-x-[-1]" : ""} ${className}`}
    >
      {(variant === "salt" || variant === "mixed") && (
        <>
          <span className="absolute h-[3px] w-[3px] rounded-full bg-white/30" style={{ top: "18%", left: "12%" }} />
          <span className="absolute h-[2px] w-[2px] rounded-full bg-white/20" style={{ top: "35%", left: "28%" }} />
          <span className="absolute h-[4px] w-[4px] rounded-full bg-white/18" style={{ top: "8%", left: "52%" }} />
          <span className="absolute h-[2px] w-[2px] rounded-full bg-white/25" style={{ top: "55%", left: "18%" }} />
          <span className="absolute h-[3px] w-[3px] rounded-full bg-white/15" style={{ top: "72%", left: "44%" }} />
          <span className="absolute h-[2px] w-[2px] rounded-full bg-white/20" style={{ top: "20%", left: "78%" }} />
          <span className="absolute h-[3px] w-[3px] rounded-full bg-white/12" style={{ top: "65%", left: "88%" }} />
          <span className="absolute h-[2px] w-[2px] rounded-full bg-white/22" style={{ top: "42%", left: "65%" }} />
        </>
      )}

      {(variant === "crumbs" || variant === "mixed") && (
        <>
          <span className="absolute h-[5px] w-[8px] rounded-[2px] bg-[#6b4a28]/35" style={{ top: "25%", left: "8%", transform: "rotate(23deg)" }} />
          <span className="absolute h-[4px] w-[6px] rounded-[1px] bg-[#5a3d20]/28" style={{ top: "58%", left: "22%", transform: "rotate(-14deg)" }} />
          <span className="absolute h-[3px] w-[7px] rounded-[2px] bg-[#7a5230]/22" style={{ top: "15%", left: "60%", transform: "rotate(8deg)" }} />
          <span className="absolute h-[5px] w-[5px] rounded-[1px] bg-[#6b4a28]/30" style={{ top: "78%", left: "72%", transform: "rotate(-32deg)" }} />
          <span className="absolute h-[3px] w-[9px] rounded-[2px] bg-[#5a3d20]/20" style={{ top: "48%", left: "85%", transform: "rotate(17deg)" }} />
          <span className="absolute h-[4px] w-[4px] rounded-full bg-[#7a5230]/25" style={{ top: "32%", left: "40%", transform: "rotate(-8deg)" }} />
        </>
      )}

      {(variant === "herbs" || variant === "mixed") && (
        <>
          {/* dill sprig — 3 angled lines from center point */}
          <svg className="absolute opacity-20" style={{ top: "12%", left: "75%", transform: "rotate(22deg)" }} width="18" height="28" viewBox="0 0 18 28" fill="none">
            <line x1="9" y1="28" x2="9" y2="0" stroke="#4a7a30" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="9" y1="8" x2="2" y2="2" stroke="#4a7a30" strokeWidth="1" strokeLinecap="round" />
            <line x1="9" y1="14" x2="16" y2="8" stroke="#4a7a30" strokeWidth="1" strokeLinecap="round" />
            <line x1="9" y1="20" x2="3" y2="14" stroke="#4a7a30" strokeWidth="1" strokeLinecap="round" />
          </svg>
          <svg className="absolute opacity-15" style={{ top: "60%", left: "5%", transform: "rotate(-15deg)" }} width="14" height="22" viewBox="0 0 14 22" fill="none">
            <line x1="7" y1="22" x2="7" y2="0" stroke="#4a7a30" strokeWidth="1" strokeLinecap="round" />
            <line x1="7" y1="6" x2="1" y2="1" stroke="#4a7a30" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="7" y1="11" x2="13" y2="6" stroke="#4a7a30" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="7" y1="16" x2="2" y2="12" stroke="#4a7a30" strokeWidth="0.8" strokeLinecap="round" />
          </svg>
          <svg className="absolute opacity-12" style={{ top: "35%", left: "92%", transform: "rotate(40deg)" }} width="12" height="18" viewBox="0 0 12 18" fill="none">
            <line x1="6" y1="18" x2="6" y2="0" stroke="#4a7a30" strokeWidth="1" strokeLinecap="round" />
            <line x1="6" y1="5" x2="1" y2="1" stroke="#4a7a30" strokeWidth="0.7" strokeLinecap="round" />
            <line x1="6" y1="10" x2="11" y2="6" stroke="#4a7a30" strokeWidth="0.7" strokeLinecap="round" />
          </svg>
        </>
      )}
    </div>
  );
}
