import { z } from "zod";

const adSchema = z.object({
  community: z.string(), 
  name: z.string().min(1, { message: "Ad name is required." }),
  objective: z.object({
    name: z.string().min(1, { message: "Objective name is required." }),
    id: z.number().int({ message: "Objective ID must be an integer." }),
    description: z.string().min(1, { message: "Objective description is required." }),
    options: z.array(z.string()).nonempty({ message: "Objective options cannot be empty." }),
  }),
  headline: z.string().min(1, { message: "Headline is required." }),
  description: z.string().min(1, { message: "Description is required." }),
  actionAndUrl: z.object({
    action: z.string().optional(),
    url: z.string().url({ message: "Invalid URL format." }),
  }),
  placements: z.string().min(1, { message: "Placements are required." }),
  estImpressions: z.string().optional(),
  estClicks: z.string().optional(),
  dailyOrWeekly: z.string().min(1, { message: "Please specify daily or weekly budget." }),
  interestTags: z.array(z.string()).nonempty({ message: "Interest tags are required." }),
  communityTags: z.array(z.string()).nonempty({ message: "Community tags are required." }),
  gender: z.string().min(1, { message: "Gender is required." }),
  ageGroup: z.string().min(1, { message: "Age group is required." }),
  location: z.array(z.string()).nonempty({ message: "Location is required." }),
  startDate: z.string().min(1, { message: "Start date is required." }),
  endDate: z.string().min(1, { message: "End date is required." }),
  totalBudget: z.string().min(1, { message: "Total budget is required." }),
  dailyBudget: z.string().min(1, { message: "Daily budget is required." }),
  focusOn: z.string().min(1, { message: "Focus is required." }),
  costPerAction: z.string().min(1, { message: "Cost per action is required." }),
});

export { adSchema };
