import developmentIcon from "@images/index/icons/development.svg";
import pencilIcon from "@images/index/icons/pencil.svg";
import reliabilityIcon from "@images/index/icons/reliability.svg";
import adjustmentIcon from "@images/index/icons/adjustment.svg";
import performanceIcon from "@images/index/icons/performance.svg";
import type { CardItem } from "./card-item";

export const services: CardItem[] = [
  { id: "hardware", icon: pencilIcon, page: "/hardware" },
  { id: "firmware", icon: developmentIcon },
  { id: "updates", icon: reliabilityIcon },
  { id: "modernization", icon: adjustmentIcon },
  { id: "ai", icon: performanceIcon },
];
