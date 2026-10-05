"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Utensils, Calendar, ChevronDown } from "lucide-react";
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
  const header = useRef<HTMLElement>(null);
  const headerTop = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const mobileMenu = useRef<HTMLDivElement>(null);
  const desktopMenu = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback((restoreFocus = false) => {
    setIsOpen(false);
    if (restoreFocus) menuButton.current?.focus();
  }, []);

  useEffect(() => {
    const updateMenuHeight = () => {
      const menuTop = headerTop.current?.getBoundingClientRect().bottom ?? 0;
      header.current?.style.setProperty("--restaurant-menu-top", `${menuTop}px`);
    };
    updateMenuHeight();
    const observer = new ResizeObserver(updateMenuHeight);
    if (headerTop.current) observer.observe(headerTop.current);
    window.addEventListener("resize", updateMenuHeight);
    window.visualViewport?.addEventListener("resize", updateMenuHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateMenuHeight);
      window.visualViewport?.removeEventListener("resize", updateMenuHeight);
    };
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => closeMenu());
    return () => window.cancelAnimationFrame(frame);
  }, [pathname, closeMenu]);

  useEffect(() => {
    if (!isOpen) return;

    const desktop = window.matchMedia("(min-width: 1280px)");
    const activeMenu = desktop.matches ? desktopMenu.current : mobileMenu.current;
    activeMenu?.querySelector<HTMLAnchorElement>("a")?.focus();

    const bodyOverflow = document.body.style.overflow;
    const pageOverflow = document.documentElement.style.overflow;
    if (!desktop.matches) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu(true);
      }
    };
    const handleOutside = (event: PointerEvent | FocusEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (
        !menuButton.current?.contains(target) &&
        !mobileMenu.current?.contains(target) &&
        !desktopMenu.current?.contains(target)
      ) {
        closeMenu();
      }
    };
    const handleBreakpoint = () => closeMenu(true);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handleOutside);
    document.addEventListener("focusin", handleOutside);
    desktop.addEventListener("change", handleBreakpoint);

    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = pageOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handleOutside);
      document.removeEventListener("focusin", handleOutside);
      desktop.removeEventListener("change", handleBreakpoint);
    };
  }, [isOpen, closeMenu]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "หน้าแรก", href: "/" },
    { name: "เมืองลับแล", href: "/lablae" },
    { name: "รู้จักเรา", href: "/about" },
    { name: "เมนูอาหาร", href: "/menu" },
    { name: "เที่ยวลับแล", href: "/travel" },
    { name: "แวะลับแล", href: "/visit" },
    { name: "ตำราลับแลง", href: "/blog" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header ref={header} className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      <div ref={headerTop}>
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
          aria-label="เมนูหลัก"
          className={`w-full transition-all duration-300 ${
            scrolled || isOpen || pathname.startsWith("/shop")
              ? "bg-[#1a100a]/90 backdrop-blur-md shadow-lg py-3 border-b border-accent/20"
              : "bg-transparent py-5"
          }`}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4 h-16">
              <div className="flex-shrink-0">
                <Link href="/" onClick={() => closeMenu()} className="flex items-center gap-3">
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
                    <span className="font-thai text-xs md:text-[10px] text-accent tracking-widest font-medium mt-0.5">
                      บ้าน 100 ปี
                    </span>
                  </div>
                </Link>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden xl:flex items-center space-x-4 whitespace-nowrap">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => closeMenu()}
                      aria-current={isActive(link.href) ? "page" : undefined}
                      className={`font-thai font-medium text-sm transition-colors duration-200 ${
                        isActive(link.href)
                          ? "text-accent border-b-2 border-accent pb-1 font-semibold"
                          : "text-[#f5ece1]/80 hover:text-accent"
                      }`}
                    >
                      {link.name}
                    </Link>
                  ))}
                  <Link
                    href="/#booking"
                    onClick={() => closeMenu()}
                    className="inline-flex items-center px-4 py-2 border border-accent/70 text-sm font-semibold rounded-full text-accent hover:bg-accent hover:text-[#1c120c] transition-all duration-300 shadow-md hover:scale-102"
                  >
                    <Calendar aria-hidden="true" className="w-4 h-4 mr-1.5" />
                    จองโต๊ะ
                  </Link>
                  <Link
                    href={btnLink}
                    onClick={() => closeMenu()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-full text-[#1c120c] bg-accent hover:bg-accent-dark transition-all duration-300 shadow-md hover:scale-102"
                  >
                    <Utensils aria-hidden="true" className="w-4 h-4 mr-2" />
                    {btnText}
                  </Link>
                </div>

                <div className="relative shrink-0">
                  <button
                    ref={menuButton}
                    type="button"
                    onClick={() => isOpen ? closeMenu(true) : setIsOpen(true)}
                    aria-expanded={isOpen}
                    aria-controls="restaurant-mobile-menu restaurant-desktop-menu"
                    className="inline-flex items-center justify-center min-h-11 min-w-11 p-2 rounded-xl text-accent hover:text-[#fff7ed] bg-[#241710]/80 border border-accent/30 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent cursor-pointer shadow-xs active:scale-95 transition-all"
                    aria-label={isOpen ? "ปิดเมนู" : "เปิดเมนู"}
                  >
                    <span className="xl:hidden">
                      {isOpen ? <X aria-hidden="true" className="h-6 w-6" /> : <Menu aria-hidden="true" className="h-6 w-6" />}
                    </span>
                    <span className="hidden xl:inline-flex items-center gap-1 font-thai text-sm font-medium">
                      เพิ่มเติม
                      <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </span>
                  </button>
                  <div
                    ref={desktopMenu}
                    id="restaurant-desktop-menu"
                    hidden={!isOpen}
                    className={`${isOpen ? "hidden xl:block" : "hidden"} absolute right-0 top-full mt-3 w-64 rounded-xl bg-[#261810] border border-accent/30 p-2 shadow-xl`}
                  >
                    <Link
                      href="/shop"
                      onClick={() => closeMenu(true)}
                      aria-current={isActive("/shop") ? "page" : undefined}
                      className="block px-3 py-3 rounded-lg text-accent font-thai font-semibold hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      สั่งไส้อั่วส่งถึงบ้าน
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>

      <div
        ref={mobileMenu}
        id="restaurant-mobile-menu"
        hidden={!isOpen}
        aria-label="เมนูเว็บไซต์"
        role="navigation"
        style={{ maxHeight: "calc(100dvh - var(--restaurant-menu-top, 120px))" }}
        className="xl:hidden overflow-y-auto overscroll-contain touch-pan-y bg-[#261810] border-b border-accent/20"
      >
        <div className="px-2 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-1 sm:px-3">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => closeMenu(true)}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={`block px-3 py-2 rounded-md text-base font-medium font-thai focus-visible:outline-2 focus-visible:outline-accent ${
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
            onClick={() => closeMenu(true)}
            className="flex items-center justify-center w-full px-4 py-3 mt-4 text-center text-accent border border-accent/50 bg-accent/10 hover:bg-accent hover:text-[#1c120c] rounded-full font-thai font-bold transition-all shadow-md focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Calendar aria-hidden="true" className="w-4 h-4 mr-2" />
            จองโต๊ะอาหารล่วงหน้า
          </Link>
          <Link
            href={btnLink}
            onClick={() => closeMenu(true)}
            className="flex items-center justify-center w-full px-4 py-3 mt-2 text-center text-[#1c120c] bg-accent hover:bg-accent-dark rounded-full font-thai font-bold transition-all shadow-md focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Utensils aria-hidden="true" className="w-4 h-4 mr-2" />
            {btnText}
          </Link>
          <Link
            href="/shop"
            onClick={() => closeMenu(true)}
            aria-current={isActive("/shop") ? "page" : undefined}
            className="block px-4 py-3 text-center text-accent font-thai font-semibold rounded-xl hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-accent"
          >
            สั่งไส้อั่วส่งถึงบ้าน
          </Link>
        </div>
      </div>
    </header>
  );
}
