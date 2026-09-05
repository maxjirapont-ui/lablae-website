import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { MenuItem, Article } from "@/lib/data";
import AdminDashboard from "@/components/AdminDashboard";

export const revalidate = 0; // Always fetch live data for dashboard

async function getDashboardData() {
  const db = await getDb();

  // 1. Get Menus
  const menus = await db.all<MenuItem[]>("SELECT * FROM menus ORDER BY category, sort_order ASC, id ASC");

  // 2. Get Reservations (Sorted latest first)
  const reservations = await db.all("SELECT * FROM reservations ORDER BY created_at DESC");

  // 3. Get Articles
  const articles = await db.all<Article[]>("SELECT * FROM articles ORDER BY part_number ASC, chapter_number ASC, id ASC");

  // 4. Get Settings as map
  const settingsRows = await db.all<{ key: string; value: string }[]>(
    "SELECT key, value FROM settings"
  );
  
  const settingsMap: Record<string, string> = {};
  settingsRows.forEach((row: any) => {
    settingsMap[row.key] = row.value;
  });

  return { menus, reservations, articles, settingsMap };
}

export default async function AdminPage() {
  // Authorization check on server side
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;

  if (session !== "authenticated") {
    redirect("/admin/login");
  }

  const { menus, reservations, articles, settingsMap } = await getDashboardData();

  return (
    <AdminDashboard
      initialMenus={menus}
      initialReservations={reservations}
      initialArticles={articles}
      initialSettings={settingsMap}
    />
  );
}
