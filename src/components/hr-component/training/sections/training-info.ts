import type { InfoContent } from "@/components/common-component/info";
import { TRAINING_ASSIGNMENT_STATUS_LABELS } from "@/lib/constants";

// The ⓘ next to the Training title; the progress states come from the labels the Assignments tab uses
const statuses = Object.values(TRAINING_ASSIGNMENT_STATUS_LABELS).map((label) => label.toLowerCase());

export const TRAINING_INFO: InfoContent = {
  title: "About Training",
  description: "Create learning courses, assign them to employees and follow their progress.",
  sections: [
    {
      heading: "What you can do here",
      items: [
        "Create a course with its category, level, instructor, length and modules",
        "Assign learners to any active course",
        "Track each learner's progress and due date in the Assignments tab",
      ],
    },
    {
      heading: "Good to know",
      items: [
        "New assignments are due 30 days after they're given",
        `Each assignment is ${statuses.slice(0, -1).join(", ")} or ${statuses[statuses.length - 1]}`,
        "Completion at the top is the share of all assignments that are finished",
      ],
    },
  ],
};
