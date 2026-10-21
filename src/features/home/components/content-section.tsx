/**
 * Independent section below the video carousel.
 *
 * Deliberately empty: the band, spacing and container are in place, so future
 * content (a heading, a grid, imagery) can be dropped straight into the inner
 * container without touching layout or spacing decisions.
 */
export function ContentSection() {
  return (
    <section className="border-t border-border bg-secondary py-24 sm:py-32">
      <div className="container-page">
        {/* Future content goes here. */}
      </div>
    </section>
  );
}
