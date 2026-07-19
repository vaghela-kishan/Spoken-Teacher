import {
  BarChart3,
  History,
  LayoutDashboard,
  Mic,
  Settings,
  Shield,
  Trophy,
  User,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export const navItems: NavItem[] = [
  { label: "Dashboard", to: "/app", icon: LayoutDashboard },
  { label: "Voice Chat", to: "/app/voice", icon: Mic },
  { label: "History", to: "/app/history", icon: History },
  { label: "Progress", to: "/app/progress", icon: BarChart3 },
  { label: "Achievements", to: "/app/achievements", icon: Trophy },
  { label: "Profile", to: "/app/profile", icon: User },
  { label: "Settings", to: "/app/settings", icon: Settings },
  { label: "Admin", to: "/app/admin", icon: Shield, adminOnly: true },
];
