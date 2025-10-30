import fintechImage from "../images/industries/fintech.jpg";
import manufacturingImage from "../images/industries/manufacturing.jpg";
import defenseImage from "../images/industries/defense.avif";
import automotiveImage from "../images/industries/automotive.jpg";
import type { CardItem } from "./card-item";

export const industries: CardItem[] = [
  {
    id: "fintech",
    title: "FinTech & Smart Payment Systems",
    description:
      "Secure embedded solutions powering next-generation payment and vending devices.",
    longDescription:
      "We enable the future of cashless transactions through embedded payment technologies tailored for FinTech applications. From vending machines and point-of-sale systems to automated kiosks, our solutions ensure reliable, secure, and scalable handling of payments, item tracking, and inventory management—helping your business stay ahead in the digital payments landscape.",
    image: fintechImage,
  },
  {
    id: "manufacturing",
    title: "Industrial & Manufacturing Automation",
    description:
      "Smart, connected systems that optimize factory operations and production efficiency.",
    longDescription:
      "Our embedded and IoT solutions empower manufacturers to increase productivity, enhance quality, and improve traceability across the factory floor. By integrating real-time data acquisition, predictive maintenance, and process automation, we help modernize production lines and accelerate digital transformation in industrial environments.",
    image: manufacturingImage,
  },
  {
    id: "defense",
    title: "Defense & Aerospace Systems",
    description:
      "Mission-critical embedded solutions built for reliability, security, and precision.",
    longDescription:
      "We develop high-assurance embedded systems designed to meet the demanding standards of the defense and aerospace sectors. Our expertise includes real-time control, secure communications, and ruggedized hardware integration, delivering dependable performance for critical operations and high-stakes environments.",
    image: defenseImage,
  },
  {
    id: "automotive",
    title: "Automotive & Mobility",
    description:
      "Embedded intelligence driving innovation in vehicles and mobility systems.",
    longDescription:
      "From advanced driver assistance systems (ADAS) to in-vehicle connectivity and diagnostics, we deliver software that powers the next generation of automotive technology. Our solutions focus on safety, performance, and real-time responsiveness, helping manufacturers build smarter, more connected, and more efficient vehicles.",
    image: automotiveImage,
  },
];
