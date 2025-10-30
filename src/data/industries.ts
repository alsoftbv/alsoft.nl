import fintechImage from "../images/industries/fintech.jpg";
import manufacturingImage from "../images/industries/manufacturing.jpg";
import automotiveImage from "../images/industries/automotive.jpg";
import type { CardItem } from "./card-item";

export const industries : CardItem[] = [
  {
    id: "fintech",
    title: "FinTech",
    description: "Description could go here",
    longDescription: "Longer description could go here for FinTech industry.",
    image: fintechImage,
  },
  {
    id: "manufacturing",
    title: "Manufacturing",
    description: "Description could go here",
    longDescription: "Longer description could go here for Manufacturing industry.",
    image: manufacturingImage,
  },
  {
    id: "automotive",
    title: "Automotive",
    description: "Description could go here",
    longDescription: "Longer description could go here for Automotive industry.",
    image: automotiveImage,
  },
];