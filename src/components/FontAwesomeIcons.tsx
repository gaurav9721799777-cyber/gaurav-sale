import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon, type FontAwesomeIconProps } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faArrowUpRightFromSquare,
  faBagShopping,
  faBars,
  faBatteryFull,
  faBolt,
  faBox,
  faBoxOpen,
  faCheck,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faCircleCheck,
  faCircleNotch,
  faCircleXmark,
  faClock,
  faDesktop,
  faDownload,
  faEllipsis,
  faEnvelope,
  faEye,
  faEyeSlash,
  faFilter,
  faHeart,
  faHouse,
  faIndianRupeeSign,
  faLocationDot,
  faLock,
  faMagnifyingGlass,
  faMinus,
  faMoneyBillWave,
  faPen,
  faPhone,
  faPlug,
  faPlus,
  faPrint,
  faReceipt,
  faRotate,
  faRightFromBracket,
  faServer,
  faShieldHalved,
  faShoppingCart,
  faStore,
  faTableColumns,
  faTag,
  faTrash,
  faTruck,
  faUsers,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import {
  faFacebookF,
  faInstagram,
  faWhatsapp,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import type { FC } from "react";

type IconProps = Omit<FontAwesomeIconProps, "icon" | "size"> & {
  size?: number;
  stroke?: number;
};

function createIcon(icon: IconDefinition): FC<IconProps> {
  const Icon: FC<IconProps> = ({ size, stroke: _stroke, style, ...props }) => (
    <FontAwesomeIcon
      {...props}
      icon={icon}
      style={{
        ...(size ? { width: size, height: size } : {}),
        ...style,
      }}
    />
  );
  Icon.displayName = `FontAwesome(${icon.iconName})`;
  return Icon;
}

export const IconArrowLeft = createIcon(faArrowLeft);
export const IconArrowRight = createIcon(faArrowRight);
export const IconArrowUpRight = createIcon(faArrowUpRightFromSquare);
export const IconBatteryCharging = createIcon(faBatteryFull);
export const IconBolt = createIcon(faBolt);
export const IconBox = createIcon(faBox);
export const IconBrandFacebook = createIcon(faFacebookF);
export const IconBrandInstagram = createIcon(faInstagram);
export const IconBrandWhatsapp = createIcon(faWhatsapp);
export const IconBrandYoutube = createIcon(faYoutube);
export const IconBuildingStore = createIcon(faStore);
export const IconCash = createIcon(faMoneyBillWave);
export const IconCheck = createIcon(faCheck);
export const IconChevronDown = createIcon(faChevronDown);
export const IconChevronLeft = createIcon(faChevronLeft);
export const IconChevronRight = createIcon(faChevronRight);
export const IconCircleCheck = createIcon(faCircleCheck);
export const IconCircleX = createIcon(faCircleXmark);
export const IconClock = createIcon(faClock);
export const IconCurrencyRupee = createIcon(faIndianRupeeSign);
export const IconDeviceDesktop = createIcon(faDesktop);
export const IconDots = createIcon(faEllipsis);
export const IconDownload = createIcon(faDownload);
export const IconEdit = createIcon(faPen);
export const IconEye = createIcon(faEye);
export const IconEyeOff = createIcon(faEyeSlash);
export const IconFilter = createIcon(faFilter);
export const IconHeart = createIcon(faHeart);
export const IconHome = createIcon(faHouse);
export const IconLayoutDashboard = createIcon(faTableColumns);
export const IconLoader2 = createIcon(faCircleNotch);
export const IconLock = createIcon(faLock);
export const IconLogout = createIcon(faRightFromBracket);
export const IconMail = createIcon(faEnvelope);
export const IconMapPin = createIcon(faLocationDot);
export const IconMenu2 = createIcon(faBars);
export const IconMinus = createIcon(faMinus);
export const IconPackage = createIcon(faBoxOpen);
export const IconPhone = createIcon(faPhone);
export const IconPlug = createIcon(faPlug);
export const IconPlus = createIcon(faPlus);
export const IconPrinter = createIcon(faPrint);
export const IconReceipt = createIcon(faReceipt);
export const IconRefresh = createIcon(faRotate);
export const IconSearch = createIcon(faMagnifyingGlass);
export const IconServer = createIcon(faServer);
export const IconShieldCheck = createIcon(faShieldHalved);
export const IconShoppingBag = createIcon(faBagShopping);
export const IconShoppingCart = createIcon(faShoppingCart);
export const IconTag = createIcon(faTag);
export const IconTrash = createIcon(faTrash);
export const IconTruck = createIcon(faTruck);
export const IconUsers = createIcon(faUsers);
export const IconX = createIcon(faXmark);
