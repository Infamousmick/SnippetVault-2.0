import { Sparkles, Star } from "lucide-react";

export const SNIPPET_FILTERS = ["Trending", "Newest", "Most Forked"];

export const SNIPPET_FILTER_TOGGLES = [
  {
    key: "starred",
    label: "Starred",
    icon: Star,
    className: "btn-starred",
  },
  {
    key: "ai",
    label: "Ai",
    icon: Sparkles,
    className: "btn-ai",
  },
];
