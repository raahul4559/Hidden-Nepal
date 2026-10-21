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

export function VideoShowcase() {
  return (
    <section
      aria-label="Nepal mountain videos"
      className="grid w-full grid-cols-1 overflow-hidden bg-[#071522] sm:grid-cols-2"
    >
      {videos.map((video) => (
        <video
          key={video.src}
          src={video.src}
          poster={video.poster}
          aria-label={video.name}
          title={video.name}
          autoPlay
          muted
          loop
          playsInline
          controls
          preload="metadata"
          width={1280}
          height={720}
          className="block aspect-video h-auto w-full bg-[#071522] object-cover"
        />
      ))}
    </section>
  );
}
