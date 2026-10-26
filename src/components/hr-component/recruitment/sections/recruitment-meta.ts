export type Tab = "postings" | "candidates" | "interviews";

// What a stat card narrows its tab to (the Candidates card shows every candidate)
export type CardFilter = "open" | "scheduled" | "hired";

export type Stage =
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "hired"
  | "rejected";

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: "Full-time" | "Contract" | "Intern";
  experience: string;
  status: "open" | "closed" | "draft";
  postedDate: string;
  applicants: number;
  description: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  appliedFor: string;
  experience: string;
  stage: Stage;
  appliedDate: string;
  rating: number;
}

export interface Interview {
  id: string;
  candidateName: string;
  role: string;
  panel: string;
  date: string;
  time: string;
  mode: "On-site" | "Video" | "Phone";
  status: "scheduled" | "completed" | "cancelled";
}

// What the Post Job dialog hands back; the page fills in the rest
export type NewJobPosting = Omit<JobPosting, "id" | "applicants" | "postedDate" | "status">;

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
