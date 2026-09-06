import React from "react";

export const metadata = {
  title: "จัดการร้าน",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-scope min-h-screen bg-[#120a05] text-[#f5ece1]">
      {children}
    </div>
  );
}
