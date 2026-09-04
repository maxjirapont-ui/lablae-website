"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, Sparkles, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok) {
        window.location.href = "/admin";
      } else {
        setError(data.error || "รหัสผ่านไม่ถูกต้อง");
      }
    } catch (err) {
      setError("ไม่สามารถเชื่อมต่อระบบหลังบ้านได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 font-thai py-12">
      <div className="w-full max-w-md bg-cream border border-primary/10 rounded-3xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 text-accent-dark text-xs font-medium border border-accent/20">
            <Sparkles className="w-3.5 h-3.5" />
            ระบบความปลอดภัยหลังบ้าน
          </span>
          <h1 className="text-2xl font-bold text-primary">เข้าสู่ระบบจัดการร้าน</h1>
          <p className="text-xs text-primary/70">สำหรับเจ้าของร้านและพนักงานในการดูแลข้อมูลหน้าเว็บ</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3.5 text-xs text-red-800 bg-red-50 border border-red-200 rounded-xl leading-relaxed">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-primary mb-1">
              รหัสผ่านผู้ดูแลระบบ
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary/45">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านหลังบ้าน"
                className="block w-full pl-10 pr-10 py-2.5 border border-primary/20 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-primary/45 hover:text-primary cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[10px] text-primary/60 mt-1.5">
              *รหัสผ่านเริ่มต้นตั้งไว้เป็น <strong>admin1234</strong> สามารถแก้ไขได้ในแดชบอร์ดหลังบ้านครับ
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 transition-all duration-300 font-thai cursor-pointer mt-6"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "เข้าสู่ระบบหลังบ้าน"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
