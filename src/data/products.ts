import inverterPhoto from "../assets/real-home-inverter.jpg";
import batteryPhoto from "../assets/real-lead-acid-battery.jpg";

export type ProductBrand = "microtek" | "luminous";
export type ProductCategory = "Inverter" | "Battery";

export type Product = {
  id: string;
  name: string;
  brand: ProductBrand;
  category: ProductCategory;
  capacity: string;
  price: string;
  description: string;
  image: string;
  badge: string;
};

export const products: Product[] = [
  {
    id: "microtek-inverter",
    name: "Home inverter",
    brand: "microtek",
    category: "Inverter",
    capacity: "Select capacity for your home",
    price: "Ask for price",
    description: "Ask us about current Microtek inverter models and availability.",
    image: inverterPhoto,
    badge: "Microtek",
  },
  {
    id: "microtek-battery",
    name: "Home backup battery",
    brand: "microtek",
    category: "Battery",
    capacity: "Choose a compatible battery",
    price: "Ask for price",
    description: "Find a battery option to pair with your compatible inverter.",
    image: batteryPhoto,
    badge: "Microtek",
  },
  {
    id: "luminous-inverter",
    name: "Home inverter",
    brand: "luminous",
    category: "Inverter",
    capacity: "Select capacity for your home",
    price: "Ask for price",
    description: "Ask us about current Luminous inverter models and availability.",
    image: inverterPhoto,
    badge: "Luminous",
  },
  {
    id: "luminous-battery",
    name: "Home backup battery",
    brand: "luminous",
    category: "Battery",
    capacity: "Choose a compatible battery",
    price: "Ask for price",
    description: "Find a battery option to pair with your compatible inverter.",
    image: batteryPhoto,
    badge: "Luminous",
  },
];

export const productImageCredits = [
  {
    image: "Home inverter",
    author: "Jeremyida002",
    license: "CC BY-SA 4.0",
    source: "https://commons.wikimedia.org/wiki/File:An_Inverter.jpg",
  },
  {
    image: "Lead-acid battery",
    author: "Shaddack",
    license: "Public domain",
    source: "https://commons.wikimedia.org/wiki/File:Photo-CarBattery.jpg",
  },
];
