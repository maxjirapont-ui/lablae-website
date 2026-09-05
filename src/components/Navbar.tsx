"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Utensils, Calendar } from "lucide-react";
import AnnouncementBanner, { AnnouncementBannerProps } from "./AnnouncementBanner";

interface NavbarProps {
  logoUrl?: string;
  btnText?: string;
  btnLink?: string;
  announcement?: AnnouncementBannerProps;
}

export default function Navbar({
  logoUrl,
  btnText = "ดูเมนูอาหาร",
  btnLink = "/menu",
  announcement,
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "หน้าแรก", href: "/" },
    { name: "รู้จักเรา", href: "/about" },
    { name: "เมนูอาหาร", href: "/menu" },
    { name: "ตำราลับแลง", href: "/blog" },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      {announcement?.enabled && Boolean(announcement.text) && (
        <AnnouncementBanner
          enabled={announcement.enabled}
          text={announcement.text}
          link={announcement.link}
          linkText={announcement.linkText}
          badge={announcement.badge}
        />
      )}
      <nav
        className={`w-full transition-all duration-300 ${
          scrolled
            ? "bg-[#1a100a]/90 backdrop-blur-md shadow-lg py-3 border-b border-accent/20"
            : "bg-transparent py-5"
        }`}
      >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Name */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-3">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="ลำลำลับแล"
                  className="object-contain shrink-0"
                  style={{ height: "40px", width: "auto" }}
                />
              )}
              <div className="flex flex-col">
                <span className="font-thai font-bold text-lg sm:text-xl text-primary tracking-wide leading-none">
                  ลำลำลับแล
                </span>
                <span className="font-thai text-[10px] text-accent tracking-widest font-medium mt-0.5">
                  บ้าน 100 ปี
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`font-thai font-medium text-sm transition-colors duration-200 ${
                  isActive(link.href)
                    ? "text-accent border-b-2 border-accent pb-1 font-semibold"
                    : "text-[#f5ece1]/80 hover:text-accent"
                }`}
              >
                {link.name}
              </Link>
            ))}
            
            {/* Table Booking Button */}
            <Link
              href="/#booking"
              className="inline-flex items-center px-4 py-2 border border-accent/70 text-sm font-semibold rounded-full text-accent hover:bg-accent hover:text-[#1c120c] transition-all duration-300 shadow-md hover:scale-102"
            >
              <Calendar className="w-4 h-4 mr-1.5" />
              จองโต๊ะ
            </Link>

            {/* Navbar Custom Button */}
            <Link
              href={btnLink}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-full text-[#1c120c] bg-accent hover:bg-accent-dark transition-all duration-300 shadow-md hover:scale-102"
            >
              <Utensils className="w-4 h-4 mr-2" />
              {btnText}
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-accent hover:text-[#fff7ed] bg-[#241710]/80 border border-accent/30 focus:outline-none cursor-pointer shadow-xs active:scale-95 transition-all"
              aria-label="เปิดเมนู"
            >
              {isOpen ? <X className="h-6 h-6" /> : <Menu className="h-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-screen opacity-100 py-4" : "max-h-0 opacity-0 overflow-hidden"
        } bg-[#261810] border-b border-accent/20`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium font-thai ${
                isActive(link.href)
                  ? "bg-accent/15 text-accent font-semibold"
                  : "text-[#f5ece1]/80 hover:bg-accent/10 hover:text-accent"
              }`}
            >
              {link.name}
            </Link>
          ))}
          <Link
            href="/#booking"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center w-full px-4 py-3 mt-4 text-center text-accent border border-accent/50 bg-accent/10 hover:bg-accent hover:text-[#1c120c] rounded-full font-thai font-bold transition-all shadow-md"
          >
            <Calendar className="w-4 h-4 mr-2" />
            จองโต๊ะอาหารล่วงหน้า
          </Link>
          <Link
            href={btnLink}
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center w-full px-4 py-3 mt-2 text-center text-[#1c120c] bg-accent hover:bg-accent-dark rounded-full font-thai font-bold transition-all shadow-md"
          >
            <Utensils className="w-4 h-4 mr-2" />
            {btnText}
          </Link>
        </div>
      </div>
    </nav>
  </header>
  );
}
