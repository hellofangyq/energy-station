export default function IntroBottle() {
  return (
    <div className="relative mx-auto h-[260px] w-[210px]">
      <div
        className="absolute left-1/2 bottom-0 h-[420px] w-[300px] -translate-x-1/2"
        style={{ transform: "translateX(-50%) scale(0.62)", transformOrigin: "bottom center" }}
      >
        <div className="relative flex h-full w-full items-end justify-center">
          <div className="cork" />
          <div className="jar-neck" />
          <div className="jar">
            <div className="jar-stars">
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} className={`star star-${i + 1}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
