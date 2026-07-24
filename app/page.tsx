import type { Metadata } from "next";
import { ProcurePilotDashboard } from "@/components/procurepilot-dashboard";

export const metadata: Metadata = {
  title: "ProcurePilot — AI service procurement on GOAT",
  description:
    "Plan, approve, pay and coordinate digital-service providers from one procurement command center.",
};

export default function Home() {
  return <ProcurePilotDashboard />;
}
