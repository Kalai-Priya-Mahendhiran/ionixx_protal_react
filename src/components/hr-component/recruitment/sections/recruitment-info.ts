import type { InfoContent } from "@/components/common-component/info";
import { CANDIDATE_STAGE_LABELS, CANDIDATE_STAGE_ORDER } from "@/lib/constants";

// The ⓘ next to the Recruitment title; the hiring steps come from the stage list the candidate board uses
export const RECRUITMENT_INFO: InfoContent = {
  title: "About Recruitment",
  description: "Follow hiring from job posting to hire: open roles, candidates and interviews.",
  sections: [
    {
      heading: "What you can do here",
      items: [
        "Post a new job, and find roles by title, department or location",
        "Open a candidate to move them to the next step or reject them",
        "See interviews with their panel, date, time and format",
      ],
    },
    {
      heading: "Good to know",
      items: [
        `Candidates move through ${CANDIDATE_STAGE_ORDER.map((stage) => CANDIDATE_STAGE_LABELS[stage]).join(" → ")}`,
        "Rejected candidates are listed separately below the board",
        "The cards at the top open the matching tab, already filtered",
      ],
    },
  ],
};
