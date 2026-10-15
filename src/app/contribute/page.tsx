import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { PlaceSubmissionForm } from "@/features/submissions/components/place-submission-form";

export const metadata: Metadata = {
  alternates: { canonical: "/contribute" },
  title: "Suggest a place",
  description:
    "Tell Hidden Nepal about a lesser-known place: a waterfall, village, trail, festival or kitchen worth a visit.",
};

const GUIDANCE = [
  {
    title: "What makes a good suggestion",
    body: "Somewhere you know first-hand that most visitors miss. Specific details help: how to get there, the best time of year, who looks after it.",
  },
  {
    title: "What happens next",
    body: "An editor reviews every suggestion. Promising places are researched and checked with local sources before anything is published.",
  },
  {
    title: "Your details",
    body: "Name and email are optional. We use them only to follow up about this suggestion, and never publish them.",
  },
];

export default function ContributePage() {
  return (
    <>
      <PageHeader
        eyebrow="Community"
        title="Suggest a place"
        intro="Help other travellers find the Nepal beyond the ordinary, responsibly."
      />
      <div className="container-page grid gap-12 py-14 sm:py-20 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <PlaceSubmissionForm />
        </div>
        <aside className="lg:col-span-5">
          <div className="space-y-8 lg:sticky lg:top-8">
            {GUIDANCE.map((item) => (
              <div key={item.title}>
                <div className="rule-gold" />
                <h2 className="mt-5 font-serif text-2xl">{item.title}</h2>
                <p className="mt-2 leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}
