"use client";

import React, { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Users, Phone, User, Calendar, Clock } from "lucide-react";

export default function BookingForm() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
    guests: "2",
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({ type: "success", message: data.message });
        setFormData({
          name: "",
          phone: "",
          date: "",
          time: "",
          guests: "2",
        });
      } else {
        setStatus({ type: "error", message: data.error || "เกิดข้อผิดพลาดในการจอง" });
      }
    } catch (err) {
      setStatus({ type: "error", message: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-cream border border-primary/10 rounded-2xl shadow-xl p-6 sm:p-8">
      <div className="text-center mb-6">
        <h3 className="font-thai text-xl sm:text-2xl font-bold text-primary">จองโต๊ะอาหารล่วงหน้า</h3>
        <p className="font-thai text-xs sm:text-sm text-primary/70 mt-1">
          กรุณากรอกข้อมูลเพื่อจองโต๊ะอาหาร (มื้อเย็นแนะนำโทรจองก่อน)
        </p>
      </div>

      {status && (
        <div
          className={`flex items-start p-4 rounded-xl mb-6 font-thai text-sm leading-relaxed ${
            status.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 mr-3 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-3 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <span>{status.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block font-thai text-sm font-medium text-primary mb-1">
            ชื่อผู้จอง
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary/45">
              <User className="h-4 w-4" />
            </div>
            <input
              type="text"
              name="name"
              id="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="คุณรักดี เรียนเก่ง"
              className="font-thai block w-full pl-10 pr-3 py-2.5 border border-primary/20 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-sm"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block font-thai text-sm font-medium text-primary mb-1">
            เบอร์โทรศัพท์
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary/45">
              <Phone className="h-4 w-4" />
            </div>
            <input
              type="tel"
              name="phone"
              id="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="095-628-3125"
              className="font-thai block w-full pl-10 pr-3 py-2.5 border border-primary/20 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Date */}
          <div>
            <label htmlFor="date" className="block font-thai text-sm font-medium text-primary mb-1">
              วันที่จอง
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary/45">
                <Calendar className="h-4 w-4" />
              </div>
              <input
                type="date"
                name="date"
                id="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="font-thai block w-full pl-10 pr-3 py-2.5 border border-primary/20 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-sm"
              />
            </div>
          </div>

          {/* Time */}
          <div>
            <label htmlFor="time" className="block font-thai text-sm font-medium text-primary mb-1">
              เวลาที่จอง
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary/45">
                <Clock className="h-4 w-4" />
              </div>
              <input
                type="time"
                name="time"
                id="time"
                required
                value={formData.time}
                onChange={handleChange}
                className="font-thai block w-full pl-10 pr-3 py-2.5 border border-primary/20 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-sm"
              />
            </div>
          </div>
        </div>

        {/* Guests */}
        <div>
          <label htmlFor="guests" className="block font-thai text-sm font-medium text-primary mb-1">
            จำนวนคน
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary/45">
              <Users className="h-4 w-4" />
            </div>
            <select
              name="guests"
              id="guests"
              value={formData.guests}
              onChange={handleChange}
              className="font-thai block w-full pl-10 pr-3 py-2.5 border border-primary/20 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-sm"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20].map((num) => (
                <option key={num} value={num}>
                  {num} คน
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 transition-all duration-300 font-thai cursor-pointer mt-4"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              ยืนยันการจองโต๊ะ
            </>
          )}
        </button>
      </form>
    </div>
  );
}
