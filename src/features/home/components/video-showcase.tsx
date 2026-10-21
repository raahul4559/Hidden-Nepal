"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "cn";

const videos = [
  {
    src: "/videos/manang-green-lake.mp4",
    poster: "/videos/manang-green-lake-poster.jpg",
    name: "Green Lake, Manang",
  },
  {
    src: "/videos/annapurna-himalayas.mp4",
    poster: "/videos/annapurna-himalayas-poster.jpg",
    name: "Annapurna Himalayas",
  },
] as const;

/**
 * Cinematic one-at-a-time video carousel.
 *
 * The viewport uses native horizontal scrolling with CSS scroll-snap, so
 * touch swiping, trackpad swiping and momentum come from the platform.
 * Only the active slide plays; the rest stay paused on their poster with
 * `preload="none"` so both files are never fetched or decoded at once.
 */
export function VideoShowcase() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);

  // Playback is driven from refs (a browser concern), state only paints the UI.
  const activeIndexRef = useRef(0);
  const inViewRef = useRef(false);
  const [index, setIndex] = useState(0);

  /** Play the active slide only; every other slide stays paused on its poster. */
  const syncPlayback = useCallback(() => {
    videoRefs.current.forEach((video, i) => {
      if (!video) return;
      if (i === activeIndexRef.current && inViewRef.current) {
        video.preload = "auto";
        video.muted = true;
        void video.play().catch(() => {
          // Autoplay blocked: the poster frame stays visible.
        });
      } else {
        video.pause();
        video.preload = "none";
      }
    });
  }, []);

  const setActiveIndex = useCallback(
    (next: number) => {
      if (activeIndexRef.current === next) return;
      activeIndexRef.current = next;
      setIndex(next);
      syncPlayback();
    },
    [syncPlayback],
  );

  // Pause everything while the section is off screen.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      inViewRef.current = true;
      syncPlayback();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        inViewRef.current = entries[0]?.isIntersecting ?? false;
        syncPlayback();
      },
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [syncPlayback]);

  // Keep the active index in sync with free scrolling (swipe, drag, trackpad).
  const handleScroll = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || viewport.clientWidth === 0) return;
    const next = Math.min(
      videos.length - 1,
      Math.max(0, Math.round(viewport.scrollLeft / viewport.clientWidth)),
    );
    setActiveIndex(next);
  }, [setActiveIndex]);

  const goTo = useCallback(
    (target: number) => {
      const next = Math.min(videos.length - 1, Math.max(0, target));
      setActiveIndex(next);
      const viewport = viewportRef.current;
      if (!viewport) return;
      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      viewport.scrollTo({
        left: next * viewport.clientWidth,
        behavior: reduced ? "auto" : "smooth",
      });
    },
    [setActiveIndex],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(index + 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      goTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goTo(videos.length - 1);
    }
  };

  return (
    <section
      ref={sectionRef}
      aria-label="Nepal mountain videos"
      className="relative isolate pt-16 pb-28 sm:pt-14 sm:pb-28"
    >
      {/* Navy band continues the hero; its tail eases into the page background. */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[#EDE7DE]" />


      <div className="mx-auto w-full max-w-[88rem] px-4 sm:px-6 lg:px-10">
        <div className="on-dark mx-auto w-full max-w-6xl">
          <div
            ref={viewportRef}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            role="group"
            aria-roledescription="carousel"
            aria-label="Videos of Nepal"
            tabIndex={0}
            className="no-scrollbar flex w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-md bg-[#252A30] motion-safe:scroll-smooth"
          >
            {videos.map((video, i) => (
              <div
                key={video.src}
                role="group"
                aria-roledescription="slide"
                aria-label={`Video ${i + 1} of ${videos.length}`}
                className="relative aspect-[5/4] w-full shrink-0 snap-center snap-always sm:aspect-[16/9.5]"
              >
                <video
                  ref={(element) => {
                    videoRefs.current[i] = element;
                  }}
                  src={video.src}
                  poster={video.poster}
                  title={video.name}
                  aria-label={video.name}
                  autoPlay={i === 0}
                  muted
                  loop
                  playsInline
                  preload={i === 0 ? "auto" : "none"}
                  width={1280}
                  height={720}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(0_0_0_/_0.16)_100%)]"
                />
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              aria-label="Previous video"
              className="inline-flex size-11 shrink-0 items-center justify-center text-[#2C2C2E] transition-colors hover:text-[#414145] disabled:pointer-events-none disabled:opacity-35"
            >
              <ChevronLeft aria-hidden className="size-5" strokeWidth={1.75} />
            </button>

            <div className="flex items-center gap-2.5">
              {videos.map((video, i) => (
                <button
                  key={video.src}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Show video ${i + 1}: ${video.name}`}
                  aria-current={i === index ? "true" : undefined}
                  className={cn(
                    "h-1.5 rounded-full bg-[#2C2C2E]/40 transition-all duration-300",
                    i === index
                      ? "w-7 bg-[#2C2C2E]"
                      : "hover:bg-[#2C2C2E]/75",
                  )}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => goTo(index + 1)}
              disabled={index === videos.length - 1}
              aria-label="Next video"
              className="inline-flex size-11 shrink-0 items-center justify-center text-[#2C2C2E] transition-colors hover:text-[#414145] disabled:pointer-events-none disabled:opacity-35"
            >
              <ChevronRight aria-hidden className="size-5" strokeWidth={1.75} />
            </button>
          </div>

          <p aria-live="polite" className="sr-only">
            Video {index + 1} of {videos.length}: {videos[index]?.name}
          </p>
        </div>
      </div>
    </section>
  );
}
