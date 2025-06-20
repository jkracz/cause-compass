export interface Question {
  id: string;
  question: string;
  description?: string;
  type: "text" | "select" | "multiple" | "radio" | "location";
  options?: { label: string; value: string }[];
}

// Open-ended questions that rotate each session
const openEndedQuestions = [
  "What's something that's made you mad lately that you wish you could help fix?",
  "What's a problem in the world that keeps you up at night?",
  "What breaks your heart when you see it happening?",
  "What's something you wish more people cared about?",
  "If you could fix one unfair thing in the world, what would it be?",
];

// Function to get a random open-ended question
function getRandomOpenEndedQuestion(): Question {
  const randomIndex = Math.floor(Math.random() * openEndedQuestions.length);
  return {
    id: "openEnded",
    question: openEndedQuestions[randomIndex],
    description: "Share what's on your heart",
    type: "text",
  };
}

// Causes question
const causesQuestion: Question = {
  id: "causes",
  question: "What kinds of causes are most interesting to you?",
  description: "Select all that resonate with you",
  type: "multiple",
  options: [
    { label: "Environment & Climate", value: "environment" },
    { label: "Education & Youth", value: "education" },
    { label: "Health & Wellness", value: "health" },
    { label: "Poverty & Housing", value: "poverty" },
    { label: "Human Rights & Justice", value: "rights" },
    { label: "Arts & Culture", value: "arts" },
    { label: "Animal Welfare", value: "animals" },
    { label: "Disaster Relief", value: "disaster" },
    { label: "Mental Health", value: "mental-health" },
    { label: "Food Security", value: "food" },
    { label: "Technology & Innovation", value: "technology" },
    { label: "Community Development", value: "community" },
  ],
};

// Fixed structured questions
const structuredQuestions: Question[] = [
  {
    id: "helpMethod",
    question: "How do you prefer to help?",
    description: "Select all that apply",
    type: "multiple",
    options: [
      { label: "Donating", value: "donating" },
      { label: "Volunteering", value: "volunteering" },
      { label: "Sharing info", value: "sharing" },
      { label: "Connecting people", value: "connecting" },
      { label: "Learning more", value: "learning" },
    ],
  },
  {
    id: "changeScope",
    question: "Where should change start?",
    description: "Choose one",
    type: "radio",
    options: [
      { label: "In my local community", value: "local" },
      { label: "Across the country", value: "national" },
      { label: "Anywhere it matters most", value: "global" },
    ],
  },
];

// Location question
const locationQuestion: Question = {
  id: "location",
  question: "Can we use your location to help find causes near you?",
  description:
    "Totally optional — we'll still show you amazing nonprofits if not.",
  type: "location",
};

// Generate questions for a session
export function generateQuestions(): Question[] {
  return [
    getRandomOpenEndedQuestion(),
    causesQuestion,
    ...structuredQuestions,
    locationQuestion,
  ];
}

// For backward compatibility, export a default set
export const questions = generateQuestions();
