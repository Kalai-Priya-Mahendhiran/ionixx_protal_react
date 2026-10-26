import type { InfoContent } from "@/components/common-component/info";

// The ⓘ next to the Performance Review title. HR reviews everyone; managers review their direct reports.
export function getPerformanceReviewInfo(isHr: boolean): InfoContent {
  return {
    title: "About Performance Review",
    description: "Review the people you're responsible for: check their goals, give a rating and share feedback.",
    sections: [
      {
        heading: "What you can do here",
        items: [
          "Pick a person on the left to see their review, self rating and goals",
          "Give an overall rating from 1 to 5 and submit it",
          "Share written feedback with them at any time, with or without a rating",
        ],
      },
      {
        heading: "Good to know",
        items: [
          isHr ? "As HR, you can review anyone in the company" : "You review the people who report directly to you",
          "Someone who joins your team appears here with a fresh draft review",
          "Each goal shows its progress, its weight and whether it's on track",
        ],
      },
    ],
  };
}
