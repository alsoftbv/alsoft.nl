import rtosImage from "../images/services/rtos.jpg";
import linuxImage from "../images/services/linux.jpg";
import iotImage from "../images/services/iot.jpg";
import type { CardItem } from "./card-item";

export const services: CardItem[] = [
  {
    id: "rtos",
    title: "RTOS Firmware Solutions",
    description: "Delivering fast, reliable real-time performance for your embedded products.",
    longDescription:
      "Our RTOS development services help you bring reliable, real-time functionality to your devices. We design firmware that ensures precision timing, predictable performance, and system stability—helping your products perform flawlessly in demanding environments like robotics, industrial control, and automotive systems.",
    image: rtosImage,
  },
  {
    id: "linux",
    title: "Embedded Linux Solutions",
    description: "Custom Linux platforms built for performance, flexibility, and scalability.",
    longDescription:
      "We build tailored Linux environments that empower your products with the flexibility and power of open-source technology. From optimizing boot times to ensuring long-term maintainability, we create secure, high-performance systems that reduce your time to market and give you full control over your embedded platform.",
    image: linuxImage,
  },
  {
    id: "iot",
    title: "IoT Connectivity with MQTT",
    description: "Seamless device-to-cloud communication for your connected ecosystem.",
    longDescription:
      "Our MQTT integration services enable efficient, scalable communication across your IoT network. We design and implement solutions that ensure your devices share data securely and in real time—helping you gain insights faster, streamline operations, and build a foundation for future-ready connected products.",
    image: iotImage,
  },
];