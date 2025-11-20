import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | EcoLocate",
  description: "Manage heritage trees and biodiversity data.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <section>{children}</section>;
}