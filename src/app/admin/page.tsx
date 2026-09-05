import React from "react";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { MenuItem, Article } from "@/lib/data";
import AdminDashboard from "@/components/AdminDashboard";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { redactSettings } from "@/lib/admin-settings";

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
  
  const settingsMap = redactSettings(settingsRows);
  settingsMap.line_messaging_configured = process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim() && process.env.LINE_CHANNEL_SECRET?.trim() ? "1" : "0";
  settingsMap.line_group_connected = settingsMap.line_group_id || process.env.LINE_GROUP_ID?.trim() ? "1" : "0";
  delete settingsMap.line_group_id;

  return { menus, reservations, articles, settingsMap };
}

export default async function AdminPage() {
  // Authorization check on server side
  if (!(await isAdminAuthenticated())) {
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
