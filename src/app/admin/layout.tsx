import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-scope min-h-screen bg-[#faf5f0] text-[#2c1608]">
      {children}
    </div>
  );
}
