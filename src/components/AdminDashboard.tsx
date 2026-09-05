"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { MenuItem, Article } from "@/lib/data";
import StoryTextEditor, { StoryTextFields } from "./StoryTextEditor";
import HeroSectionEditor from "./HeroSectionEditor";
import AmbienceStoryEditor from "./AmbienceStoryEditor";
import AmbienceGalleryEditor from "./AmbienceGalleryEditor";
import AboutPageEditor from "./AboutPageEditor";
import { GalleryImageItem } from "./AtmosphereGallery";
import {
  Calendar,
  Utensils,
  Megaphone,
  FileText,
  BookOpen,
  Settings,
  LogOut,
  Save,
  CheckCircle,
  XCircle,
  X,
  Trash2,
  Edit2,
  Plus,
  Search,
  Check,
  AlertCircle,
  Upload,
  Camera,
  Image as ImageIcon,
  Sparkles,
  PlusCircle,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Layout,
  GripVertical,
  LayoutDashboard,
  Zap,
  Star,
  Leaf,
  Layers,
  Phone,
  Clock,
  MapPin,
  Share2,
  ShieldCheck,
  Store,
  Grid,
  List,
  ExternalLink,
  RefreshCw,
  Palette,
  Quote,
  Download,
  Globe,
  ChevronsUp
} from "lucide-react";

interface AdminDashboardProps {
  initialMenus: MenuItem[];
  initialReservations: any[];
  initialArticles: Article[];
  initialSettings: Record<string, string>;
}

export default function AdminDashboard({
  initialMenus,
  initialReservations,
  initialArticles,
  initialSettings
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "reservations" | "photos" | "menus" | "articles" | "settings" | "preview">("overview");
  const [settingsSubTab, setSettingsSubTab] = useState<"info" | "appearance" | "social" | "layout" | "security">("info");
  const [menuViewMode, setMenuViewMode] = useState<"cards" | "table">("cards");
  const [quickSearch, setQuickSearch] = useState<string>("");
  const [resStatusFilter, setResStatusFilter] = useState<string>("ทั้งหมด");
  const [showFloatingPreview, setShowFloatingPreview] = useState(false);
  const router = useRouter();

  // Publishing State
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccessMsg, setPublishSuccessMsg] = useState("");

  // State caches
  const [menus, setMenus] = useState<MenuItem[]>(initialMenus);
  const [reservations, setReservations] = useState<any[]>(initialReservations);
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  
  // Settings Form States
  const [settings, setSettings] = useState(initialSettings);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState("");

  // Drag and Drop States
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedCatIndex, setDraggedCatIndex] = useState<number | null>(null);

  // Search States
  const [menuSearch, setMenuSearch] = useState("");
  const [menuCatFilter, setMenuCatFilter] = useState("ทั้งหมด");
  const [resSearch, setResSearch] = useState("");

  // Preview States
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [previewUrl, setPreviewUrl] = useState<string>("/");
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [previewZoom, setPreviewZoom] = useState<number>(1.0);

  // Edit/Add Menu modal or inline form state
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Partial<MenuItem> | null>(null);
  const [menuFormError, setMenuFormError] = useState("");
  const [menuFormLoading, setMenuFormLoading] = useState(false);
  const [showMenuHeaderEditor, setShowMenuHeaderEditor] = useState(false);
  const [menuPdfUploading, setMenuPdfUploading] = useState(false);

  // Edit/Add Article modal state
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);
  const [articleFormError, setArticleFormError] = useState("");
  const [articleFormLoading, setArticleFormLoading] = useState(false);
  const [articleSearch, setArticleSearch] = useState("");
  const [articlePartFilter, setArticlePartFilter] = useState("ทั้งหมด");

  // Gallery items parser (supports both string[] and { url, caption }[])
  let galleryItems: GalleryImageItem[] = [];
  try {
    if (settings.restaurant_gallery) {
      const parsed = JSON.parse(settings.restaurant_gallery);
      if (Array.isArray(parsed)) {
        galleryItems = parsed
          .map((item: any) => {
            if (typeof item === "string") return { url: item, caption: "" };
            return { url: item?.url || "", caption: item?.caption || "" };
          })
          .filter((item) => Boolean(item.url));
      }
    }
  } catch {
    galleryItems = [];
  }
  const galleryImages: string[] = galleryItems.map((i) => i.url);

  // Quick Facts Stories Manager state
  const [adminStoryTab, setAdminStoryTab] = useState<"house" | "wood" | "family" | "kitchen">("house");
  let customStoriesData: Record<string, any> = {};
  try {
    if (settings.custom_stories_data) {
      customStoriesData = JSON.parse(settings.custom_stories_data);
    }
  } catch {
    customStoriesData = {};
  }

  // Logout Handler
  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  // File Upload Helper
  const handleFileUpload = async (
    file: File,
    onSuccess: (url: string) => void,
    onError: (errorMsg: string) => void
  ) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess(data.url);
      } else {
        onError(data.error || "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
      }
    } catch (err) {
      console.error(err);
      onError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่ออัปโหลดไฟล์ได้");
    }
  };

  // --- RESERVATION HANDLERS ---
  const handleUpdateReservationStatus = async (id: number, status: string) => {
    try {
      const res = await fetch("/api/admin/reservations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setReservations(prev =>
          prev.map(r => (r.id === id ? { ...r, status } : r))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReservation = async (id: number) => {
    if (!confirm("คุณต้องการลบประวัติการจองนี้ใช่หรือไม่?")) return;
    try {
      const res = await fetch(`/api/admin/reservations?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setReservations(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- FULL SYSTEM BACKUP HANDLER ---
  const handleExportBackup = () => {
    try {
      const backupData = {
        exported_at: new Date().toISOString(),
        restaurant_name: settings.restaurant_name || "ร้านลำลำลับแลบ้าน 100 ปี",
        version: "1.0",
        settings,
        menus,
        articles,
        reservations,
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `lamlam-restaurant-backup-${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error("Backup failed:", err);
      alert("เกิดข้อผิดพลาดในการสำรองข้อมูล");
    }
  };

  // --- PUBLISH ALL / SYNC LIVE WEBSITE HANDLER ---
  const handlePublishAll = async () => {
    setIsPublishing(true);
    setPublishSuccessMsg("");
    try {
      const res = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPublishSuccessMsg("✅ เผยแพร่สู่หน้าเว็บจริงเรียบร้อยแล้ว! ทุกคนที่เข้าชมเว็บจะเห็นข้อมูลล่าสุดทันที");
        if (data.published_at) {
          setSettings(prev => ({ ...prev, last_published_at: data.published_at }));
        }
        router.refresh();
        setTimeout(() => setPublishSuccessMsg(""), 6000);
      } else {
        alert(data.error || "เกิดข้อผิดพลาดในการเผยแพร่ข้อมูล");
      }
    } catch (err) {
      console.error("Publish error:", err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsPublishing(false);
    }
  };

  // --- MENU REORDER HANDLER ---
  const handleReorderMenu = async (id: number, action: "top" | "up" | "down") => {
    setMenus(prevMenus => {
      const target = prevMenus.find(m => m.id === id);
      if (!target) return prevMenus;

      const targetCategory = target.category;
      const categoryItems = prevMenus.filter(m => m.category === targetCategory);
      const otherItems = prevMenus.filter(m => m.category !== targetCategory);
      
      const currIdx = categoryItems.findIndex(m => m.id === id);
      if (currIdx === -1) return prevMenus;

      const updatedCategoryItems = [...categoryItems];
      if (action === "top") {
        if (currIdx === 0) return prevMenus;
        updatedCategoryItems.splice(currIdx, 1);
        updatedCategoryItems.unshift(target);
      } else if (action === "up") {
        if (currIdx === 0) return prevMenus;
        const prev = updatedCategoryItems[currIdx - 1];
        updatedCategoryItems[currIdx - 1] = target;
        updatedCategoryItems[currIdx] = prev;
      } else if (action === "down") {
        if (currIdx === updatedCategoryItems.length - 1) return prevMenus;
        const next = updatedCategoryItems[currIdx + 1];
        updatedCategoryItems[currIdx + 1] = target;
        updatedCategoryItems[currIdx] = next;
      }

      updatedCategoryItems.forEach((item, idx) => {
        item.sort_order = idx + 1;
      });

      return [...otherItems, ...updatedCategoryItems];
    });

    try {
      await fetch("/api/admin/menu/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
    } catch (err) {
      console.error("Reorder failed:", err);
    }
  };

  // --- MENU HANDLERS ---
  const handleToggleMenuAvailability = async (id: number, currentAvailable: number) => {
    const nextAvailable = currentAvailable === 1 ? 0 : 1;
    try {
      const res = await fetch("/api/admin/menu/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, available: nextAvailable === 1 }),
      });
      if (res.ok) {
        setMenus(prev =>
          prev.map(m => (m.id === id ? { ...m, available: nextAvailable } : m))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleMenuVisible = async (id: number, currentVisible: number) => {
    const nextVisible = currentVisible === 1 ? 0 : 1;
    try {
      const res = await fetch("/api/admin/menu/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_visible: nextVisible === 1 }),
      });
      if (res.ok) {
        setMenus(prev =>
          prev.map(m => (m.id === id ? { ...m, is_visible: nextVisible } : m))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleMenuRecommended = async (id: number, currentRecommended: number) => {
    const nextRecommended = currentRecommended === 1 ? 0 : 1;
    try {
      const res = await fetch("/api/admin/menu/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_recommended: nextRecommended === 1 }),
      });
      if (res.ok) {
        setMenus(prev =>
          prev.map(m => (m.id === id ? { ...m, is_recommended: nextRecommended } : m))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleMenuSeasonal = async (id: number, currentSeasonal: number) => {
    const nextSeasonal = currentSeasonal === 1 ? 0 : 1;
    try {
      const res = await fetch("/api/admin/menu/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_seasonal: nextSeasonal === 1 }),
      });
      if (res.ok) {
        setMenus(prev =>
          prev.map(m => (m.id === id ? { ...m, is_seasonal: nextSeasonal } : m))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateMenuImage = async (id: number, imageUrl: string) => {
    try {
      const res = await fetch("/api/admin/menu/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, image_url: imageUrl }),
      });
      if (res.ok) {
        setMenus(prev =>
          prev.map(m => (m.id === id ? { ...m, image_url: imageUrl } : m))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkToggleCategory = async (categoryName: string, actionType: "available" | "unavailable" | "hide" | "show") => {
    let confirmMsg = "";
    if (actionType === "unavailable") confirmMsg = `คุณพี่แน่ใจใช่ไหมครับที่จะตั้งค่าให้ทุกเมนูในหมวดหมู่ "${categoryName}" เป็น "หมดชั่วคราว"?`;
    if (actionType === "available") confirmMsg = `คุณพี่ต้องการเปิดจำหน่ายเมนูทั้งหมดในหมวดหมู่ "${categoryName}" ใช่หรือไม่?`;
    if (actionType === "hide") confirmMsg = `คุณพี่ต้องการซ่อนทุกเมนูในหมวดหมู่ "${categoryName}" จากหน้าเว็บลูกค้าใช่หรือไม่?`;
    if (actionType === "show") confirmMsg = `คุณพี่ต้องการแสดงทุกเมนู in หมวดหมู่ "${categoryName}" บนหน้าเว็บลูกค้าใช่หรือไม่?`;

    if (!confirm(confirmMsg)) return;

    try {
      let payload: Record<string, any> = { category: categoryName };
      if (actionType === "unavailable") payload.available = false;
      if (actionType === "available") payload.available = true;
      if (actionType === "hide") payload.is_visible = false;
      if (actionType === "show") payload.is_visible = true;

      const res = await fetch("/api/admin/menu/bulk-toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMenus(prev =>
          prev.map(m => {
            if (m.category === categoryName) {
              const updated = { ...m };
              if (actionType === "unavailable") updated.available = 0;
              if (actionType === "available") updated.available = 1;
              if (actionType === "hide") updated.is_visible = 0;
              if (actionType === "show") updated.is_visible = 1;
              return updated;
            }
            return m;
          })
        );
      } else {
        alert("เกิดข้อผิดพลาดในการดำเนินการ");
      }
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
    }
  };

  const handleDeleteMenu = async (id: number) => {
    if (!confirm("คุณแน่ใจว่าต้องการลบเมนูอาหารนี้ใช่หรือไม่?")) return;
    try {
      const res = await fetch(`/api/admin/menu?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMenus(prev => prev.filter(m => m.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAddMenu = () => {
    setEditingMenu({ 
      name: "", 
      price: 0, 
      category: "จานเดียว", 
      description: "", 
      available: 1, 
      is_visible: 1, 
      is_recommended: 0, 
      is_seasonal: 0 
    });
    setShowMenuForm(true);
    setMenuFormError("");
  };

  const handleOpenEditMenu = (menu: MenuItem) => {
    setEditingMenu(menu);
    setShowMenuForm(true);
    setMenuFormError("");
  };

  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMenu?.name || editingMenu?.price === undefined || !editingMenu?.category) {
      setMenuFormError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    setMenuFormLoading(true);
    setMenuFormError("");

    const isEdit = !!editingMenu.id;
    const url = "/api/admin/menu";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingMenu),
      });

      const data = await res.json();
      if (res.ok) {
        setShowMenuForm(false);
        setEditingMenu(null);
        // Refresh local menu list by fetching latest
        const menusRes = await fetch("/api/admin/menu");
        if (menusRes.ok) {
          const latestData = await menusRes.json();
          if (latestData.success && latestData.menus) {
            setMenus(latestData.menus);
          }
        }
        router.refresh();
      } else {
        setMenuFormError(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      setMenuFormError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setMenuFormLoading(false);
    }
  };

  // --- ARTICLE HANDLERS ---
  const handleOpenAddArticle = () => {
    setEditingArticle({ title: "", slug: "", content: "" });
    setShowArticleForm(true);
    setArticleFormError("");
  };

  const handleOpenEditArticle = (art: Article) => {
    setEditingArticle(art);
    setShowArticleForm(true);
    setArticleFormError("");
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle?.title || !editingArticle?.slug || !editingArticle?.content) {
      setArticleFormError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    setArticleFormLoading(true);
    setArticleFormError("");

    const isEdit = !!editingArticle.id;
    const url = "/api/admin/articles";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingArticle),
      });

      const data = await res.json();
      if (res.ok) {
        setShowArticleForm(false);
        setEditingArticle(null);
        const articlesRes = await fetch("/api/admin/articles");
        if (articlesRes.ok) {
          const latestData = await articlesRes.json();
          if (latestData.success && latestData.articles) {
            setArticles(latestData.articles);
          }
        }
        router.refresh();
      } else {
        setArticleFormError(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      setArticleFormError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setArticleFormLoading(false);
    }
  };

  const handleDeleteArticle = async (id: number) => {
    if (!confirm("คุณแน่ใจว่าต้องการลบบทความนี้ใช่หรือไม่?")) return;
    try {
      const res = await fetch(`/api/admin/articles?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setArticles(prev => prev.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- SETTINGS HANDLERS ---
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsMsg("");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSettingsMsg("✅ บันทึกข้อมูลการตั้งค่าเรียบร้อยแล้ว! หน้าร้านอัปเดตทันที");
        setIframeKey(prev => prev + 1); // Reload preview iframe
        router.refresh();
      } else {
        if (res.status === 401) {
          alert("เซสชันผู้ดูแลระบบหมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่อีกครั้งที่ /admin/login");
          window.location.href = "/admin/login";
          return;
        }
        const errData = await res.json().catch(() => ({}));
        setSettingsMsg(errData.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (err) {
      setSettingsMsg("ไม่สามารถเชื่อมต่อเครือข่ายได้ กรุณาตรวจสอบการเชื่อมต่อ");
    } finally {
      setSettingsLoading(false);
    }
  };

  // Hero Section Handler
  const handleSaveHeroSection = async (heroData: {
    home_hero_image: string;
    hero_badge: string;
    hero_title: string;
    hero_subtitle: string;
    hero_description: string;
    hero_btn1_text: string;
    hero_btn1_link: string;
    hero_btn2_text: string;
    hero_btn2_link: string;
  }) => {
    setSettingsLoading(true);
    setSettingsMsg("กำลังบันทึกข้อมูลภาพปกและข้อความฮีโร่...");
    setSettings((prev) => ({ ...prev, ...heroData }));
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(heroData),
      });
      if (res.ok) {
        setSettingsMsg("✅ บันทึกรูปภาพปกและข้อความฮีโร่สำเร็จแล้ว! หน้าร้านอัปเดตทันที");
        router.refresh();
      } else {
        if (res.status === 401) {
          alert("เซสชันผู้ดูแลระบบหมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่อีกครั้งที่ /admin/login");
          window.location.href = "/admin/login";
          return;
        }
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูลฮีโร่";
        setSettingsMsg(errMsg);
        throw new Error(errMsg);
      }
    } catch (err: any) {
      setSettingsMsg("เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย");
      throw err;
    } finally {
      setSettingsLoading(false);
    }
  };

  // Ambience Story Section Handler
  const handleSaveAmbienceStory = async (storyData: {
    home_about_image: string;
    home_about_image_caption: string;
    about_badge: string;
    about_title: string;
    about_quote: string;
    about_quote_author: string;
    about_story_text: string;
  }) => {
    setSettingsLoading(true);
    setSettingsMsg("กำลังบันทึกรูปภาพและคำอธิบายเรื่องเล่า...");
    setSettings((prev) => ({ ...prev, ...storyData }));
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storyData),
      });
      if (res.ok) {
        setSettingsMsg("✅ บันทึกรูปภาพบรรยากาศและคำอธิบายเรื่องเล่าสำเร็จแล้ว! หน้าร้านอัปเดตทันที");
        router.refresh();
      } else {
        if (res.status === 401) {
          alert("เซสชันผู้ดูแลระบบหมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่อีกครั้งที่ /admin/login");
          window.location.href = "/admin/login";
          return;
        }
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูลเรื่องเล่า";
        setSettingsMsg(errMsg);
        throw new Error(errMsg);
      }
    } catch (err: any) {
      setSettingsMsg("เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย");
      throw err;
    } finally {
      setSettingsLoading(false);
    }
  };

  // Ambience Gallery Album Handler
  const handleSaveAmbienceGallery = async (galleryData: {
    restaurant_gallery: string;
    gallery_badge: string;
    gallery_title: string;
    gallery_subtitle: string;
  }) => {
    setSettingsLoading(true);
    setSettingsMsg("กำลังบันทึกอัลบั้มและคำอธิบายภาพบรรยากาศ...");
    setSettings((prev) => ({ ...prev, ...galleryData }));
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(galleryData),
      });
      if (res.ok) {
        setSettingsMsg("✅ บันทึกอัลบั้มและคำอธิบายภาพบรรยากาศสำเร็จแล้ว! หน้าร้านอัปเดตทันที");
        router.refresh();
      } else {
        if (res.status === 401) {
          alert("เซสชันผู้ดูแลระบบหมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่อีกครั้งที่ /admin/login");
          window.location.href = "/admin/login";
          return;
        }
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error || "เกิดข้อผิดพลาดในการบันทึกอัลบั้ม";
        setSettingsMsg(errMsg);
        throw new Error(errMsg);
      }
    } catch (err: any) {
      setSettingsMsg("เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย");
      throw err;
    } finally {
      setSettingsLoading(false);
    }
  };

  // Quick Facts Stories handlers
  const handleSaveStoryFields = async (
    storyId: "house" | "wood" | "family" | "kitchen",
    fields: StoryTextFields
  ) => {
    setSettingsLoading(true);
    setSettingsMsg("กำลังบันทึกข้อมูลเรื่องเล่า...");

    const currentTabPhotos = customStoriesData[storyId]?.photos || [];
    const nextCustomStories = {
      ...customStoriesData,
      [storyId]: {
        ...customStoriesData[storyId],
        ...fields,
        photos: currentTabPhotos,
      },
    };

    const jsonStr = JSON.stringify(nextCustomStories);
    setSettings((prev) => ({ ...prev, custom_stories_data: jsonStr }));

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom_stories_data: jsonStr }),
      });
      if (res.ok) {
        setSettingsMsg("✅ บันทึกข้อความเรื่องเล่าสำเร็จแล้ว! หน้าร้านอัปเดตทันที");
        router.refresh();
      } else {
        if (res.status === 401) {
          alert("เซสชันผู้ดูแลระบบหมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่อีกครั้งที่ /admin/login");
          window.location.href = "/admin/login";
          return;
        }
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูลเรื่องเล่า";
        setSettingsMsg(errMsg);
        throw new Error(errMsg);
      }
    } catch (err: any) {
      setSettingsMsg("เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย");
      throw err;
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleResetStoryFields = async (
    storyId: "house" | "wood" | "family" | "kitchen"
  ) => {
    setSettingsLoading(true);
    setSettingsMsg("กำลังคืนค่าข้อความเริ่มต้น...");

    const currentTabPhotos = customStoriesData[storyId]?.photos || [];
    const nextCustomStories = { ...customStoriesData };
    if (currentTabPhotos.length > 0) {
      nextCustomStories[storyId] = { photos: currentTabPhotos };
    } else {
      delete nextCustomStories[storyId];
    }

    const jsonStr = JSON.stringify(nextCustomStories);
    setSettings((prev) => ({ ...prev, custom_stories_data: jsonStr }));

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom_stories_data: jsonStr }),
      });
      if (res.ok) {
        setSettingsMsg("✅ คืนค่าข้อความเริ่มต้นสำเร็จแล้ว! หน้าร้านอัปเดตทันที");
        router.refresh();
      } else {
        if (res.status === 401) {
          alert("เซสชันผู้ดูแลระบบหมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่อีกครั้งที่ /admin/login");
          window.location.href = "/admin/login";
          return;
        }
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error || "เกิดข้อผิดพลาดในการคืนค่าข้อความ";
        setSettingsMsg(errMsg);
        throw new Error(errMsg);
      }
    } catch (err: any) {
      setSettingsMsg("เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย");
      throw err;
    } finally {
      setSettingsLoading(false);
    }
  };

  // Reordering Homepage Sections
  const handleMoveSection = (index: number, direction: "up" | "down") => {
    const orderStr = settings.homepage_sections_order || "intro,featured,seasonal,social,contact";
    const arr = orderStr.split(",").map(s => s.trim()).filter(Boolean);
    
    if (direction === "up" && index > 0) {
      const temp = arr[index];
      arr[index] = arr[index - 1];
      arr[index - 1] = temp;
    } else if (direction === "down" && index < arr.length - 1) {
      const temp = arr[index];
      arr[index] = arr[index + 1];
      arr[index + 1] = temp;
    }
    
    setSettings(prev => ({
      ...prev,
      homepage_sections_order: arr.join(",")
    }));
  };

  // Reordering Menu Categories
  const handleMoveCategory = (index: number, direction: "up" | "down") => {
    const orderStr = settings.menu_categories_order || "เซทขันโตก,ข้าวพันผัก,อาหารพื้นบ้าน,จานเดียว,กับข้าว,ส้มตำ,ของหวาน & ทานเล่น,เครื่องดื่ม";
    const arr = orderStr.split(",").map(s => s.trim()).filter(Boolean);
    
    if (direction === "up" && index > 0) {
      const temp = arr[index];
      arr[index] = arr[index - 1];
      arr[index - 1] = temp;
    } else if (direction === "down" && index < arr.length - 1) {
      const temp = arr[index];
      arr[index] = arr[index + 1];
      arr[index + 1] = temp;
    }
    
    setSettings(prev => ({
      ...prev,
      menu_categories_order: arr.join(",")
    }));
  };

  // Drag and Drop handlers for Homepage Sections
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const orderStr = settings.homepage_sections_order || "intro,featured,seasonal,social,contact";
    const arr = orderStr.split(",").map(s => s.trim()).filter(Boolean);
    
    const newArr = [...arr];
    const draggedItem = newArr[draggedIndex];
    newArr.splice(draggedIndex, 1);
    newArr.splice(index, 0, draggedItem);
    
    setSettings(prev => ({
      ...prev,
      homepage_sections_order: newArr.join(",")
    }));
    
    setDraggedIndex(null);
  };

  // Drag and Drop handlers for Menu Categories
  const handleCatDragStart = (e: React.DragEvent, index: number) => {
    setDraggedCatIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleCatDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCatDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedCatIndex === null || draggedCatIndex === index) return;
    
    const orderStr = settings.menu_categories_order || "เซทขันโตก,ข้าวพันผัก,อาหารพื้นบ้าน,จานเดียว,กับข้าว,ส้มตำ,ของหวาน & ทานเล่น,เครื่องดื่ม";
    const arr = orderStr.split(",").map(s => s.trim()).filter(Boolean);
    
    const newArr = [...arr];
    const draggedItem = newArr[draggedCatIndex];
    newArr.splice(draggedCatIndex, 1);
    newArr.splice(index, 0, draggedItem);
    
    setSettings(prev => ({
      ...prev,
      menu_categories_order: newArr.join(",")
    }));
    
    setDraggedCatIndex(null);
  };

  // Menu Header & PDF Handlers
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMenuPdfUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSettings(prev => ({ ...prev, menu_pdf_url: data.url }));
        setSettingsMsg("✅ อัปโหลดไฟล์ PDF สำเร็จแล้ว อย่าลืมกดบันทึกการตั้งค่าหน้าเมนูนะครับ!");
      } else {
        alert(data.error || "อัปโหลดไฟล์ไม่สำเร็จ");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการอัปโหลดไฟล์ PDF");
    } finally {
      setMenuPdfUploading(false);
    }
  };

  const handleSaveMenuHeader = async () => {
    setSettingsLoading(true);
    setSettingsMsg("กำลังบันทึกข้อมูลหน้าเมนูและเล่ม PDF...");
    try {
      const payload = {
        menu_page_badge: settings.menu_page_badge ?? "ร้านลำลำลับแลบ้าน ๑๐๐ ปี",
        menu_page_title: settings.menu_page_title ?? "กับข้าวและสำรับอาหาร",
        menu_page_subtitle: settings.menu_page_subtitle ?? "ปรุงสดใหม่ทุกจาน พริกแกงโขลกเอง วัตถุดิบสดจากสวนหลังบ้านและในชุมชนลับแล",
        menu_page_notice: settings.menu_page_notice ?? "",
        menu_pdf_url: settings.menu_pdf_url ?? "/menu-2026.pdf",
        menu_pdf_btn_text: settings.menu_pdf_btn_text ?? "เปิดดูเล่มเมนูฉบับเต็ม (PDF)",
        menu_pdf_show: settings.menu_pdf_show ?? "1",
      };
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSettingsMsg("✅ บันทึกข้อมูลส่วนหัวหน้าเมนูและเล่ม PDF เรียบร้อยแล้ว! หน้าร้านอัปเดตทันที");
        router.refresh();
      } else {
        setSettingsMsg("เกิดข้อผิดพลาดในการบันทึกข้อมูลหน้าเมนู");
      }
    } catch (err) {
      console.error(err);
      setSettingsMsg("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSettingsLoading(false);
    }
  };

  // Filter lists based on searches and category select
  const filteredMenus = menus.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
      m.category.toLowerCase().includes(menuSearch.toLowerCase());
    const matchesCategory = menuCatFilter === "ทั้งหมด" || m.category === menuCatFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredReservations = reservations.filter(r => {
    const matchesSearch = !resSearch ||
      (r.name && r.name.toLowerCase().includes(resSearch.toLowerCase())) ||
      (r.phone && r.phone.includes(resSearch)) ||
      (r.date && r.date.includes(resSearch));
    const matchesStatus = resStatusFilter === "ทั้งหมด" || r.status === resStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredArticles = articles.filter(art => {
    const matchesSearch = !articleSearch ||
      art.title.toLowerCase().includes(articleSearch.toLowerCase()) ||
      art.content.toLowerCase().includes(articleSearch.toLowerCase()) ||
      art.slug.toLowerCase().includes(articleSearch.toLowerCase());
    const matchesPart = articlePartFilter === "ทั้งหมด" ||
      (art.part_title && art.part_title.includes(articlePartFilter));
    return matchesSearch && matchesPart;
  });

  // Helper to render preview panel content
  const renderPreviewPanelContent = () => {
    return (
      <div className="flex flex-col h-full bg-cream font-thai">
        {/* Header */}
        <div className="p-4 border-b border-primary/10 flex items-center justify-between bg-primary text-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <h3 className="font-bold text-sm">
              {previewMode === "mobile" ? "พรีวิวหน้าร้านบนมือถือ (Live Mobile)" : "พรีวิวหน้าร้านบนคอมฯ (Live Desktop)"}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowFloatingPreview(false)}
            className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full text-white font-bold cursor-pointer text-sm transition-colors"
            title="ปิดหน้าพรีวิว"
          >
            ✕
          </button>
        </div>

        {/* Controls */}
        <div className="p-3.5 bg-white border-b border-primary/5 flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between gap-2 text-xs">
            {/* Page selector */}
            <div className="flex-grow">
              <select
                value={previewUrl}
                onChange={(e) => setPreviewUrl(e.target.value)}
                className="w-full px-2 py-1.5 bg-cream border border-primary/10 rounded-lg text-xs font-semibold focus:outline-none cursor-pointer text-primary"
              >
                <option value="/">หน้าแรก (Home)</option>
                <option value="/menu">หน้าเมนูอาหาร (Menu)</option>
                <option value="/about">หน้ารู้จักเรา (About)</option>
                <option value="/blog">หน้าบทความ (Blog)</option>
              </select>
            </div>

            {/* Size switch */}
            <div className="inline-flex rounded-lg border border-primary/10 p-0.5 bg-cream shrink-0">
              <button
                type="button"
                onClick={() => setPreviewMode("mobile")}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  previewMode === "mobile"
                    ? "bg-primary text-white shadow-sm"
                    : "text-primary/70 hover:text-accent"
                }`}
              >
                มือถือ
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("desktop")}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  previewMode === "desktop"
                    ? "bg-primary text-white shadow-sm"
                    : "text-primary/70 hover:text-accent"
                }`}
              >
                คอมฯ
              </button>
            </div>

            {/* Refresh button */}
            <button
              type="button"
              onClick={() => setIframeKey((prev) => prev + 1)}
              className="px-2.5 py-1.5 bg-primary/5 hover:bg-primary/10 text-primary border border-primary/10 rounded-lg text-[10px] font-bold transition-all cursor-pointer shrink-0"
              title="รีเฟรชหน้าพรีวิว"
            >
              รีเฟรช
            </button>
          </div>

          {/* Zoom Selector for Mobile View */}
          {previewMode === "mobile" && (
            <div className="flex items-center justify-between border-t border-primary/5 pt-2 text-[10px]">
              <span className="font-semibold text-primary/70">ซูมการแสดงผล:</span>
              <div className="flex items-center gap-1 bg-cream border border-primary/10 p-0.5 rounded-lg">
                {[0.85, 1.0, 1.15, 1.3].map((zoom) => (
                  <button
                    key={zoom}
                    type="button"
                    onClick={() => setPreviewZoom(zoom)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      previewZoom === zoom
                        ? "bg-primary text-white shadow-sm"
                        : "text-primary/70 hover:text-accent"
                    }`}
                  >
                    {Math.round(zoom * 100)}%
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Viewport Frame */}
        <div className="flex-grow p-4 overflow-auto bg-primary-dark/5 flex items-center justify-center relative">
          {previewMode === "mobile" ? (
            /* Mobile phone mockup bezel with scroll container scale fallback */
            <div className="flex justify-center items-center shrink-0" style={{ minWidth: 375 * previewZoom, minHeight: 650 * previewZoom }}>
              <div 
                style={{ 
                  transform: `scale(${previewZoom})`,
                  transformOrigin: 'center center',
                }}
                className="relative w-[375px] h-[650px] border-8 border-gray-800 rounded-[32px] shadow-xl bg-white flex flex-col shrink-0 transition-transform duration-200"
              >
                {/* Top Speaker/Camera notch mock */}
                <div className="absolute top-0 inset-x-0 h-4 bg-gray-800 flex justify-center items-center z-20">
                  <div className="w-16 h-1.5 bg-gray-900 rounded-full" />
                </div>
                {/* Screen iframe */}
                <div className="flex-grow pt-4">
                  <iframe
                    key={`${previewUrl}-${previewMode}-${iframeKey}`}
                    src={previewUrl}
                    className="w-full h-full border-none bg-white"
                  />
                </div>
                {/* Home Indicator mock */}
                <div className="h-3 bg-gray-800 flex justify-center items-center z-20">
                  <div className="w-20 h-1 bg-gray-900 rounded-full" />
                </div>
              </div>
            </div>
          ) : (
            /* Mini desktop viewport */
            <div className="w-full h-[550px] border border-primary/10 rounded-xl overflow-hidden bg-white shadow-sm shrink-0">
              <iframe
                key={`${previewUrl}-${previewMode}-${iframeKey}`}
                src={previewUrl}
                className="w-full h-full border-none"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6 transition-all duration-300 ${
      showFloatingPreview ? "max-w-[1500px]" : "max-w-6xl"
    }`}>
      {/* Dashboard Header with Master Publish Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-cream border border-primary/15 p-5 sm:p-6 rounded-3xl shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold font-thai text-primary">ระบบการจัดการร้านอาหาร</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              ออนไลน์ (Live)
            </span>
          </div>
          <p className="text-xs sm:text-sm font-thai text-primary/70">
            ยินดีต้อนรับผู้ดูแลระบบ จัดการข้อมูลร้าน เมนูอาหาร และเนื้อหาเว็บไซต์ แล้วกดเผยแพร่สู่หน้าเว็บจริงได้ทันที
          </p>
          {settings.last_published_at && (
            <p className="text-[11px] font-thai text-accent-dark mt-1">
              🕒 เผยแพร่ครั้งล่าสุด: {new Date(settings.last_published_at).toLocaleString("th-TH")}
            </p>
          )}
        </div>

        {/* Action Buttons: Publish All & View Live Website */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0">
          <button
            type="button"
            id="admin-btn-publish-all"
            onClick={handlePublishAll}
            disabled={isPublishing}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 via-emerald-700 to-green-800 hover:from-emerald-700 hover:to-green-900 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer transform active:scale-98"
            title="บันทึกข้อมูลทั้งหมดและอัปเดตหน้าเว็บจริงทันที"
          >
            <Sparkles className={`w-4 h-4 text-amber-300 ${isPublishing ? "animate-spin" : ""}`} />
            <span>{isPublishing ? "กำลังเผยแพร่ขึ้นเว็บ..." : "🚀 เผยแพร่ทั้งหมดสู่หน้าเว็บ"}</span>
          </button>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-primary/20 hover:border-accent text-primary rounded-2xl text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer"
            title="เปิดหน้าเว็บจริงในแท็บใหม่"
          >
            <Globe className="w-4 h-4 text-accent" />
            <span>ดูหน้าเว็บจริง</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
        </div>
      </div>

      {/* Global Publish Success Toast Notification */}
      {publishSuccessMsg && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-emerald-50 border-2 border-emerald-400 text-emerald-900 rounded-2xl shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-emerald-950">
                {publishSuccessMsg}
              </h4>
              <p className="text-[11px] text-emerald-800">
                ระบบได้เคลียร์แคชและส่งข้อมูลใหม่ขึ้นหน้าเว็บจริงแล้ว ผู้เข้าชมทุกคนจะเห็นการเปลี่ยนแปลงทันทีครับ
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              เปิดดูหน้าเว็บจริง ↗
            </a>
            <button
              type="button"
              onClick={() => setPublishSuccessMsg("")}
              className="p-1.5 text-emerald-700 hover:text-emerald-950 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 font-thai min-h-[75vh] items-stretch">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 bg-cream border border-primary/10 p-4 rounded-3xl space-y-6 flex flex-col justify-between shrink-0">
        <div className="space-y-4">
          <div className="px-4 py-2 border-b border-primary/5">
            <p className="font-bold text-primary text-base">การจัดการหลังบ้าน</p>
            <p className="text-[10px] text-accent-dark">เข้าสู่ระบบ: แอดมิน</p>
          </div>

          <nav id="admin-sidebar-nav" className="flex lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            <button
              id="admin-tab-overview"
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer shrink-0 ${
                activeTab === "overview"
                  ? "bg-primary text-white shadow-sm"
                  : "text-primary/80 hover:bg-primary/5 hover:text-accent"
              }`}
            >
              <Zap className="w-4.5 h-4.5 text-accent" />
              <span>จัดการด่วน</span>
            </button>

            <button
              id="admin-tab-reservations"
              onClick={() => setActiveTab("reservations")}
              className={`flex items-center justify-between gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer shrink-0 ${
                activeTab === "reservations"
                  ? "bg-primary text-white shadow-sm"
                  : "text-primary/80 hover:bg-primary/5 hover:text-accent"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4.5 h-4.5 text-accent" />
                <span>จัดการการจองโต๊ะ</span>
              </div>
              {reservations.filter(r => r.status === "pending").length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500 text-white font-bold animate-pulse">
                  {reservations.filter(r => r.status === "pending").length}
                </span>
              )}
            </button>

            <button
              id="admin-tab-photos"
              onClick={() => setActiveTab("photos")}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer shrink-0 ${
                activeTab === "photos"
                  ? "bg-primary text-white shadow-sm"
                  : "text-primary/80 hover:bg-primary/5 hover:text-accent"
              }`}
            >
              <Camera className="w-4.5 h-4.5 text-accent" />
              <span>📸 รูปบรรยากาศ & หน้าปก</span>
            </button>

            <button
              id="admin-tab-menus"
              onClick={() => setActiveTab("menus")}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer shrink-0 ${
                activeTab === "menus"
                  ? "bg-primary text-white"
                  : "text-primary/80 hover:bg-primary/5 hover:text-accent"
              }`}
            >
              <Utensils className="w-4.5 h-4.5" />
              <span>จัดการเมนูอาหาร</span>
            </button>

            <button
              id="admin-tab-articles"
              onClick={() => setActiveTab("articles")}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer shrink-0 ${
                activeTab === "articles"
                  ? "bg-primary text-white"
                  : "text-primary/80 hover:bg-primary/5 hover:text-accent"
              }`}
            >
              <BookOpen className="w-4.5 h-4.5 text-accent" />
              <span>ตำราลับแลง</span>
            </button>

             <button
              id="admin-tab-settings"
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer shrink-0 ${
                activeTab === "settings"
                  ? "bg-primary text-white"
                  : "text-primary/80 hover:bg-primary/5 hover:text-accent"
              }`}
            >
              <Settings className="w-4.5 h-4.5" />
              <span>ตั้งค่าร้าน</span>
            </button>

            <button
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer shrink-0 ${
                activeTab === "preview"
                  ? "bg-primary text-white"
                  : "text-primary/80 hover:bg-primary/5 hover:text-accent"
              }`}
            >
              <Eye className="w-4.5 h-4.5" />
              <span>พรีวิวเว็บจริง</span>
            </button>
          </nav>

          {/* Sidebar Live Preview Toggle Button */}
          <div className="pt-4 border-t border-primary/10 mt-2">
            <button
              type="button"
              onClick={() => setShowFloatingPreview(prev => !prev)}
              className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${
                showFloatingPreview
                  ? "bg-accent/15 border-accent text-accent-dark shadow-sm font-bold scale-102"
                  : "border-primary/10 text-primary/80 hover:bg-primary/5 hover:text-accent"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2 w-2 shrink-0">
                  {showFloatingPreview && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${showFloatingPreview ? "bg-accent-dark" : "bg-primary/45"}`}></span>
                </span>
                <span>เปิดพรีวิวมือถือ</span>
              </div>
              <span className="text-[10px] bg-primary/5 px-2 py-0.5 rounded-md font-mono shrink-0">
                {showFloatingPreview ? "เปิด" : "ปิด"}
              </span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={handlePublishAll}
            disabled={isPublishing}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isPublishing ? "animate-spin" : ""}`} />
            <span>{isPublishing ? "กำลังเผยแพร่..." : "🚀 เผยแพร่ทั้งหมด"}</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            ออกจากระบบ
          </button>
        </div>
      </div>

      {/* Main Tab Panel & Inline Preview Panel Container */}
      <div className="flex-grow flex flex-col xl:flex-row gap-6 items-stretch min-w-0">
        {/* Main Tab Panel */}
        <div className="flex-grow bg-cream border border-primary/10 rounded-3xl p-6 sm:p-8 min-h-[60vh] relative shadow-sm min-w-0">
        
        {/* TAB 1: OVERVIEW & QUICK ACTIONS HUB */}
        {activeTab === "overview" && (
          <div className="space-y-6 font-thai">
            {/* Top Welcome & Quick Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-primary to-primary-light text-white p-6 rounded-2xl shadow-md">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-xs font-semibold mb-2">
                  <Store className="w-3.5 h-3.5 text-accent" />
                  {settings.restaurant_name || "ร้านลำลำลับแลบ้าน 100 ปี"}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold">ศูนย์จัดการด่วน (Quick Hub)</h2>
                <p className="text-xs text-white/80 mt-1">
                  ปรับสถานะเมนูหมดวันนี้ เปลี่ยนเมนูแนะนำ และเช็คความพร้อมของร้านได้ในคลิกเดียวครับ
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowFloatingPreview(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-dark text-primary-dark rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>ดูหน้าเว็บจริง</span>
                </button>
              </div>
            </div>

            {/* Pending Reservations Banner Alert */}
            {reservations.filter(r => r.status === "pending").length > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-amber-50 border-2 border-amber-400 text-amber-900 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold text-lg shadow-xs">
                    🔔
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-amber-950 flex items-center gap-2">
                      <span>มีรายการจองโต๊ะใหม่รอยืนยัน {reservations.filter(r => r.status === "pending").length} รายการ</span>
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                    </h4>
                    <p className="text-xs text-amber-800">
                      กรุณาตรวจสอบข้อมูลและโทรคอนเฟิร์มกับลูกค้าเพื่อจัดเตรียมโต๊ะอาหารครับ
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setActiveTab("reservations"); setResStatusFilter("pending"); }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  ไปที่หน้าจัดการการจอง →
                </button>
              </div>
            )}

            {/* 5 Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <button
                type="button"
                onClick={() => { setActiveTab("menus"); setMenuCatFilter("ทั้งหมด"); }}
                className="p-4 bg-white border border-primary/10 rounded-2xl text-left hover:border-accent transition-all cursor-pointer shadow-xs group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-primary/70">เมนูอาหารทั้งหมด</span>
                  <div className="w-8 h-8 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Utensils className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-primary">{menus.length}</div>
                <span className="text-[10px] text-accent-dark font-medium">คลิกดูรายการอาหาร →</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab("menus"); }}
                className="p-4 bg-white border border-green-200 rounded-2xl text-left hover:border-green-400 transition-all cursor-pointer shadow-xs group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-green-800">พร้อมขายวันนี้</span>
                  <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-700">
                  {menus.filter(m => m.available === 1).length}
                </div>
                <span className="text-[10px] text-green-600 font-medium">สินค้าพร้อมเสิร์ฟ</span>
              </button>

              <div className="p-4 bg-white border border-red-200 rounded-2xl text-left shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-red-800">ของหมดชั่วคราว</span>
                  <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                    <XCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-red-700">
                  {menus.filter(m => m.available === 0).length}
                </div>
                <span className="text-[10px] text-red-600 font-medium">ปิดขายบนหน้าเว็บ</span>
              </div>

              <button
                type="button"
                onClick={() => { setActiveTab("menus"); }}
                className="p-4 bg-white border border-amber-200 rounded-2xl text-left hover:border-amber-400 transition-all cursor-pointer shadow-xs group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-amber-800">เมนูแนะนำ</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-amber-700">
                  {menus.filter(m => m.is_recommended === 1).length}
                </div>
                <span className="text-[10px] text-amber-600 font-medium">โชว์หน้าแรก</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab("reservations"); setResStatusFilter("ทั้งหมด"); }}
                className={`p-4 bg-white border rounded-2xl text-left transition-all cursor-pointer shadow-xs group ${
                  reservations.filter(r => r.status === "pending").length > 0
                    ? "border-amber-400 bg-amber-50/30 hover:border-amber-500"
                    : "border-primary/10 hover:border-accent"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-primary/70">การจองโต๊ะ</span>
                  <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent-dark group-hover:bg-accent group-hover:text-primary-dark transition-colors">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-primary">{reservations.length}</span>
                  {reservations.filter(r => r.status === "pending").length > 0 && (
                    <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full animate-pulse">
                      รอ {reservations.filter(r => r.status === "pending").length}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-accent-dark font-medium">คลิกเพื่อดูและโทรหาลูกค้า →</span>
              </button>

              {/* Shortcut Card to Edit Book */}
              <button
                type="button"
                onClick={() => { setActiveTab("articles"); }}
                className="col-span-2 lg:col-span-4 p-4 bg-gradient-to-r from-primary via-primary-dark to-[#2b1809] text-cream border border-accent/40 rounded-2xl text-left hover:border-accent hover:shadow-lg transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent shrink-0 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30">
                        ๓๒ ตอนครบถ้วน
                      </span>
                      <h3 className="font-bold text-sm sm:text-base text-cream">
                        แก้ไขเนื้อหา “ตำราลับแลง” (ที่เป็นบท)
                      </h3>
                    </div>
                    <p className="text-xs text-cream/75 mt-0.5">
                      แตะที่นี่เพื่อเปิดหน้าแก้ไขเนื้อหาแต่ละบท ทั้ง ๕ ภาค ๒๙ บท + คำนำ + บทส่งท้าย
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-accent group-hover:translate-x-1 transition-transform shrink-0 self-end sm:self-center">
                  <span>เลือกบทที่ต้องการแก้ไข</span>
                  <span>→</span>
                </div>
              </button>
            </div>

            {/* Quick Actions Grid: 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Column 1: Out of Stock Management */}
              <div className="bg-white border border-primary/10 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-primary/5 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-primary text-sm">เมนูที่หมดวันนี้ (ปิดขายชั่วคราว)</h3>
                      <p className="text-[10px] text-primary/60">คลิกเพื่อเปิดขายคืนเมื่อมีของ หรือค้นหาเมนูเพื่อกดปิด</p>
                    </div>
                  </div>
                  {menus.filter(m => m.available === 0).length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("ต้องการเปิดขายทุกเมนูที่หมดอยู่ใช่หรือไม่?")) {
                          menus.filter(m => m.available === 0).forEach(m => handleToggleMenuAvailability(m.id, 0));
                        }
                      }}
                      className="px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      เปิดขายคืนทั้งหมด
                    </button>
                  )}
                </div>

                {/* Quick Search to Mark Unavailable */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-primary/40" />
                  <input
                    type="text"
                    placeholder="พิมพ์ชื่อเมนูเพื่อกด 'ของหมด' ทันที..."
                    value={quickSearch}
                    onChange={(e) => setQuickSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-cream border border-primary/15 rounded-xl text-xs focus:outline-none text-primary"
                  />
                  {quickSearch && (
                    <button
                      onClick={() => setQuickSearch("")}
                      className="absolute right-2.5 top-2 text-xs text-primary/40 hover:text-primary cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Search Results for Quick Toggle */}
                {quickSearch.trim() && (
                  <div className="p-2 bg-primary/5 rounded-xl border border-primary/10 max-h-48 overflow-y-auto space-y-1.5">
                    <p className="text-[10px] font-bold text-primary/70 px-1">ผลการค้นหา:</p>
                    {menus.filter(m => m.name.toLowerCase().includes(quickSearch.toLowerCase())).length > 0 ? (
                      menus.filter(m => m.name.toLowerCase().includes(quickSearch.toLowerCase())).map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-primary/5 text-xs">
                          <div>
                            <span className="font-bold text-primary">{item.name}</span>
                            <span className="text-[10px] text-accent-dark ml-2">฿{item.price} ({item.category})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handleToggleMenuAvailability(item.id, item.available);
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                              item.available === 1
                                ? "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
                                : "bg-green-50 hover:bg-green-100 text-green-700 border border-green-200"
                            }`}
                          >
                            {item.available === 1 ? "🔴 กดเพื่อปิดขาย" : "🟢 กดเพื่อเปิดขาย"}
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-primary/50 text-center py-2">ไม่พบเมนูที่ตรงกับ "{quickSearch}"</p>
                    )}
                  </div>
                )}

                {/* Currently Out of Stock Items */}
                <div className="space-y-2">
                  {menus.filter(m => m.available === 0).length > 0 ? (
                    menus.filter(m => m.available === 0).map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2.5 bg-red-50/50 border border-red-200 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-white shrink-0 border border-red-100">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-primary/30">
                                <Utensils className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-primary">{item.name}</p>
                            <span className="text-[10px] text-red-600 font-semibold bg-red-100 px-2 py-0.5 rounded-full">
                              หมดชั่วคราว
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleMenuAvailability(item.id, 0)}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>เปิดขายคืน</span>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 border border-dashed border-green-200 bg-green-50/30 rounded-xl space-y-1">
                      <p className="text-xs font-bold text-green-800">🎉 ทุกเมนูพร้อมขายครบ 100%</p>
                      <p className="text-[10px] text-green-600">ไม่มีเมนูไหนถูกปิดขายอยู่ สามารถเปิดร้านต้อนรับลูกค้าได้เลยครับ</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Column 2: Highlights & Quick Store Settings */}
              <div className="space-y-6">
                
                {/* Recommended Dishes Card */}
                <div className="bg-white border border-primary/10 rounded-2xl p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-primary/5 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                        <Star className="w-4 h-4 fill-current" />
                      </div>
                      <div>
                        <h3 className="font-bold text-primary text-sm">เมนูแนะนำประจำร้าน (Featured)</h3>
                        <p className="text-[10px] text-primary/60">ติ๊กเพื่อเลือกจานเด่นไปแสดงบนหน้าแรกของเว็บ</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("menus")}
                      className="text-xs text-accent-dark font-bold hover:underline cursor-pointer"
                    >
                      จัดการทั้งหมด →
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {menus.filter(m => m.is_recommended === 1).map(item => (
                      <span
                        key={item.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold"
                      >
                        <Star className="w-3 h-3 text-amber-500 fill-current" />
                        <span>{item.name}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleMenuRecommended(item.id, 1)}
                          className="hover:text-red-500 ml-1 cursor-pointer"
                          title="นำออกจากเมนูแนะนำ"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                    {menus.filter(m => m.is_recommended === 1).length === 0 && (
                      <p className="text-xs text-primary/50 py-2">ยังไม่ได้เลือกเมนูแนะนำ (ไปที่หน้าเมนูเพื่อกดดาวแนะนำได้เลยครับ)</p>
                    )}
                  </div>
                </div>

                {/* Quick Store Info Card */}
                <div className="bg-white border border-primary/10 rounded-2xl p-5 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-primary/5 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-primary text-sm">เวลาเปิด-ปิด และเบอร์โทร</h3>
                        <p className="text-[10px] text-primary/60">อัปเดตข้อมูลด่วนที่แสดงบนหน้าแรกและส่วนหัวเว็บ</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-primary mb-1">เบอร์โทรศัพท์ร้าน</label>
                      <input
                        type="text"
                        value={settings.phone || ""}
                        onChange={e => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-1.5 bg-cream border border-primary/15 rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-primary mb-1">เวลาเปิด-ปิด</label>
                      <input
                        type="text"
                        value={settings.hours || ""}
                        onChange={e => setSettings(prev => ({ ...prev, hours: e.target.value }))}
                        className="w-full px-3 py-1.5 bg-cream border border-primary/15 rounded-xl text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      disabled={settingsLoading}
                      onClick={handleSaveSettings}
                      className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{settingsLoading ? "กำลังบันทึก..." : "บันทึกข้อมูลด่วน"}</span>
                    </button>
                  </div>
                </div>

                {/* Useful Shortcuts */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <button
                    type="button"
                    onClick={handleOpenAddMenu}
                    className="p-3 bg-cream border border-primary/15 rounded-xl flex items-center gap-2 hover:bg-white hover:border-accent transition-all cursor-pointer font-bold text-primary"
                  >
                    <PlusCircle className="w-4 h-4 text-accent" />
                    <span>เพิ่มเมนูอาหารใหม่</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("photos")}
                    className="p-3 bg-cream border border-primary/15 rounded-xl flex items-center gap-2 hover:bg-white hover:border-accent transition-all cursor-pointer font-bold text-primary"
                  >
                    <Camera className="w-4 h-4 text-accent" />
                    <span>📸 จัดการรูปบรรยากาศร้าน & ปก</span>
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* TAB: RESERVATIONS MANAGEMENT */}
        {activeTab === "reservations" && (
          <div className="space-y-6 font-thai">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-primary/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-accent/20 rounded-2xl text-accent-dark">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-primary">ระบบจัดการการจองโต๊ะ</h2>
                    {reservations.filter(r => r.status === "pending").length > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white animate-pulse">
                        รอยืนยัน {reservations.filter(r => r.status === "pending").length} รายการ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-primary/70 mt-0.5">
                    ตรวจสอบรายชื่อลูกค้าที่จองโต๊ะล่วงหน้า โทรติดต่อได้ในคลิกเดียว และอัปเดตสถานะโต๊ะอาหาร
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => router.refresh()}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-primary/15 hover:bg-cream text-primary rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  title="รีเฟรชข้อมูลล่าสุด"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>รีเฟรช</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-light text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  title="สำรองข้อมูลทั้งหมด"
                >
                  <Download className="w-3.5 h-3.5 text-accent" />
                  <span>สำรองข้อมูล</span>
                </button>
              </div>
            </div>

            {/* 4 Stat Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setResStatusFilter("pending")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
                  resStatusFilter === "pending"
                    ? "bg-amber-50 border-amber-400 ring-2 ring-amber-400/40"
                    : "bg-white border-amber-200 hover:border-amber-400"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-amber-800">⏳ รอยืนยัน</span>
                  {reservations.filter(r => r.status === "pending").length > 0 && (
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                  )}
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-amber-700">
                  {reservations.filter(r => r.status === "pending").length}
                </div>
                <p className="text-[10px] text-amber-700/80 mt-0.5">รอแอดมินโทรคอนเฟิร์ม</p>
              </button>

              <button
                type="button"
                onClick={() => setResStatusFilter("confirmed")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
                  resStatusFilter === "confirmed"
                    ? "bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/40"
                    : "bg-white border-emerald-200 hover:border-emerald-400"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-emerald-800">✅ ยืนยันแล้ว</span>
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-emerald-700">
                  {reservations.filter(r => r.status === "confirmed").length}
                </div>
                <p className="text-[10px] text-emerald-700/80 mt-0.5">ล็อคโต๊ะรอต้อนรับ</p>
              </button>

              <button
                type="button"
                onClick={() => setResStatusFilter("completed")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
                  resStatusFilter === "completed"
                    ? "bg-blue-50 border-blue-400 ring-2 ring-blue-400/40"
                    : "bg-white border-blue-200 hover:border-blue-400"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-blue-800">🎉 เสร็จสิ้น</span>
                  <Utensils className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-blue-700">
                  {reservations.filter(r => r.status === "completed").length}
                </div>
                <p className="text-[10px] text-blue-700/80 mt-0.5">ลูกค้ามาทานเรียบร้อย</p>
              </button>

              <button
                type="button"
                onClick={() => setResStatusFilter("cancelled")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
                  resStatusFilter === "cancelled"
                    ? "bg-gray-100 border-gray-400 ring-2 ring-gray-400/40"
                    : "bg-white border-gray-200 hover:border-gray-400"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-gray-700">❌ ยกเลิก</span>
                  <XCircle className="w-4 h-4 text-gray-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-700">
                  {reservations.filter(r => r.status === "cancelled").length}
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">รายการที่ยกเลิก</p>
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 border border-primary/10 rounded-2xl space-y-3 shadow-xs">
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                {/* Search Box */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-primary/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อลูกค้า, เบอร์โทรศัพท์, วันที่ (เช่น 2026-09-08)..."
                    value={resSearch}
                    onChange={(e) => setResSearch(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-cream/50 border border-primary/15 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-accent focus:bg-white transition-colors"
                  />
                  {resSearch && (
                    <button
                      type="button"
                      onClick={() => setResSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/40 hover:text-primary cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Status Filter Buttons */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none shrink-0">
                  {[
                    { id: "ทั้งหมด", label: `ทั้งหมด (${reservations.length})` },
                    { id: "pending", label: `รอยืนยัน (${reservations.filter(r => r.status === "pending").length})` },
                    { id: "confirmed", label: `ยืนยันแล้ว (${reservations.filter(r => r.status === "confirmed").length})` },
                    { id: "completed", label: `เสร็จสิ้น (${reservations.filter(r => r.status === "completed").length})` },
                    { id: "cancelled", label: `ยกเลิก (${reservations.filter(r => r.status === "cancelled").length})` },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setResStatusFilter(tab.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        resStatusFilter === tab.id
                          ? "bg-primary text-white shadow-xs"
                          : "bg-cream text-primary/70 hover:text-primary hover:bg-primary/5"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Reservations List */}
            {filteredReservations.length === 0 ? (
              <div className="p-12 text-center bg-white border border-primary/10 rounded-2xl space-y-3">
                <div className="w-12 h-12 rounded-full bg-cream border border-primary/10 flex items-center justify-center mx-auto text-primary/40">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-primary text-sm">ไม่พบข้อมูลการจองโต๊ะ</h3>
                <p className="text-xs text-primary/60 max-w-sm mx-auto">
                  {resSearch || resStatusFilter !== "ทั้งหมด"
                    ? "ไม่พบข้อมูลที่ตรงกับเงื่อนไขค้นหา ลองค้นหาด้วยคำอื่นหรือกดดูทั้งหมดครับ"
                    : "ขณะนี้ยังไม่มีประวัติการจองโต๊ะจากลูกค้า เมื่อมีลูกค้าจองโต๊ะ รายชื่อจะแสดงขึ้นที่นี่อัตโนมัติครับ"}
                </p>
                {(resSearch || resStatusFilter !== "ทั้งหมด") && (
                  <button
                    type="button"
                    onClick={() => { setResSearch(""); setResStatusFilter("ทั้งหมด"); }}
                    className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    ล้างตัวกรองทั้งหมด
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReservations.map((res: any) => {
                  const isPending = res.status === "pending";
                  const isConfirmed = res.status === "confirmed";
                  const isCompleted = res.status === "completed";
                  const isCancelled = res.status === "cancelled";

                  return (
                    <div
                      key={res.id}
                      className={`p-5 rounded-2xl border transition-all shadow-xs bg-white ${
                        isPending
                          ? "border-amber-300 ring-1 ring-amber-200"
                          : isConfirmed
                          ? "border-emerald-200 hover:border-emerald-400"
                          : "border-primary/10 hover:border-primary/25"
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Left Details: Date, Time, Guests, Customer, Phone */}
                        <div className="space-y-2.5">
                          {/* Top Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Date */}
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/5 text-primary rounded-lg text-xs font-bold">
                              <Calendar className="w-3.5 h-3.5 text-accent-dark" />
                              {res.date}
                            </span>
                            {/* Time */}
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/5 text-primary rounded-lg text-xs font-bold">
                              <Clock className="w-3.5 h-3.5 text-accent-dark" />
                              {res.time} น.
                            </span>
                            {/* Guests */}
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent/15 text-accent-dark rounded-lg text-xs font-bold">
                              👥 {res.guests} ท่าน
                            </span>

                            {/* Status Badge */}
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 border border-amber-300 text-amber-800 rounded-lg text-xs font-bold animate-pulse">
                                ⏳ รอยืนยัน (Pending)
                              </span>
                            )}
                            {isConfirmed && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold">
                                ✅ ยืนยันแล้ว (Confirmed)
                              </span>
                            )}
                            {isCompleted && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 border border-blue-300 text-blue-800 rounded-lg text-xs font-bold">
                                🎉 มาทานแล้ว (Completed)
                              </span>
                            )}
                            {isCancelled && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold">
                                ❌ ยกเลิก (Cancelled)
                              </span>
                            )}
                          </div>

                          {/* Customer Name & Direct Call */}
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-base sm:text-lg font-bold text-primary">
                              คุณ {res.name}
                            </h3>

                            {/* Click to Call Button */}
                            <a
                              href={`tel:${res.phone}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                              title="แตะเพื่อโทรออกหาลูกค้าทันที"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>โทรหาลูกค้า: {res.phone}</span>
                            </a>
                          </div>

                          {/* Created at timestamp */}
                          {res.created_at && (
                            <p className="text-[11px] text-primary/50">
                              ทำรายการจองเมื่อ: {res.created_at}
                            </p>
                          )}
                        </div>

                        {/* Right Actions: Status toggles & Delete */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-primary/5">
                          {/* Confirm Button */}
                          {!isConfirmed && (
                            <button
                              type="button"
                              onClick={() => handleUpdateReservationStatus(res.id, "confirmed")}
                              className="flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>ยืนยันการจอง</span>
                            </button>
                          )}

                          {/* Complete Button */}
                          {!isCompleted && (
                            <button
                              type="button"
                              onClick={() => handleUpdateReservationStatus(res.id, "completed")}
                              className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>ลูกค้ามาทานแล้ว</span>
                            </button>
                          )}

                          {/* Cancel Button */}
                          {!isCancelled && (
                            <button
                              type="button"
                              onClick={() => handleUpdateReservationStatus(res.id, "cancelled")}
                              className="flex items-center gap-1 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>ยกเลิก</span>
                            </button>
                          )}

                          {/* Back to Pending if cancelled or completed */}
                          {(isCancelled || isCompleted) && (
                            <button
                              type="button"
                              onClick={() => handleUpdateReservationStatus(res.id, "pending")}
                              className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>รอยืนยัน</span>
                            </button>
                          )}

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteReservation(res.id)}
                            className="p-2 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors cursor-pointer ml-auto lg:ml-0"
                            title="ลบประวัติการจองนี้"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: ATMOSPHERE PHOTOS & BRANDING */}
        {activeTab === "photos" && (
          <div className="space-y-8">
            {/* Header */}
            <div className="border-b border-primary/5 pb-4 space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-accent/20 rounded-xl text-accent-dark">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-primary">จัดการรูปภาพบรรยากาศร้าน & หน้าปกเว็บไซต์</h2>
                  <p className="text-xs text-primary/70">
                    อัปเดตรูปภาพบรรยากาศร้าน รูปหน้าปกหัวเว็บ และรูปบ้านโบราณ ๑๐๐ ปี ได้โดยตรงที่นี่ (ระบบจะบีบอัดและปรับขนาด HD ให้อัตโนมัติ)
                  </p>
                </div>
              </div>
            </div>

            {/* Notification Banner */}
            {settingsMsg && (
              <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${
                settingsMsg.includes("สำเร็จ")
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}>
                <span>{settingsMsg}</span>
                <button
                  type="button"
                  onClick={() => setSettingsMsg("")}
                  className="text-primary/50 hover:text-primary cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 1. Main Hero Banner & Story Texts */}
            <HeroSectionEditor
              currentHeroImage={settings.home_hero_image || ""}
              currentBadge={settings.hero_badge || ""}
              currentTitle={settings.hero_title || ""}
              currentSubtitle={settings.hero_subtitle || ""}
              currentDescription={settings.hero_description || ""}
              currentBtn1Text={settings.hero_btn1_text || ""}
              currentBtn1Link={settings.hero_btn1_link || ""}
              currentBtn2Text={settings.hero_btn2_text || ""}
              currentBtn2Link={settings.hero_btn2_link || ""}
              onSave={handleSaveHeroSection}
              handleFileUpload={handleFileUpload}
              isLoading={settingsLoading}
            />

            {/* 2. Ambience Story Section & Photo */}
            <AmbienceStoryEditor
              currentAboutImage={settings.home_about_image || ""}
              currentImageCaption={settings.home_about_image_caption || ""}
              currentBadge={settings.about_badge || ""}
              currentTitle={settings.about_title || ""}
              currentQuote={settings.about_quote || ""}
              currentQuoteAuthor={settings.about_quote_author || ""}
              currentStoryText={settings.about_story_text || ""}
              onSave={handleSaveAmbienceStory}
              handleFileUpload={handleFileUpload}
              isLoading={settingsLoading}
            />

            {/* 3 & 4: Logo & Dish Photos in 2-col Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 3. Brand Logo */}
              <div className="p-6 bg-white rounded-3xl border border-primary/10 shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-accent/15 text-accent-dark text-[11px] font-bold">
                      โลโก้ร้าน
                    </span>
                    <span className="text-[11px] text-primary/50">ขนาดแนะนำ: สี่เหลี่ยมจัตุรัส หรือ PNG ใส</span>
                  </div>
                  <h3 className="text-base font-bold text-primary">๓. โลโก้ร้านอาหาร (Brand Logo)</h3>
                  <p className="text-xs text-primary/70 leading-relaxed">
                    แสดงที่แถบเมนูด้านบนสุด (Navbar) ทุกหน้าเว็บ หากยังไม่มีระบบจะแสดงชื่อร้านเป็นตัวอักษรแทน
                  </p>
                </div>

                {/* Preview */}
                <div className="relative h-32 rounded-2xl overflow-hidden border border-primary/10 bg-cream flex items-center justify-center p-3 shadow-inner">
                  {settings.brand_logo ? (
                    <img
                      src={settings.brand_logo}
                      alt="โลโก้ร้าน"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-primary/40 text-xs gap-1">
                      <Store className="w-8 h-8 opacity-40" />
                      <span>ยังไม่ได้ใส่โลโก้ (ใช้ชื่อร้านแสดงแทน)</span>
                    </div>
                  )}
                </div>

                {/* Upload action */}
                <div className="pt-2 space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    id="upload-logo-main"
                    className="hidden"
                    disabled={settingsLoading}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setSettingsLoading(true);
                      setSettingsMsg("");
                      await handleFileUpload(
                        file,
                        async (url) => {
                          setSettings(prev => ({ ...prev, brand_logo: url }));
                          try {
                            await fetch("/api/admin/settings", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ brand_logo: url }),
                            });
                            setSettingsMsg("✅ บันทึกโลโก้ร้านสำเร็จแล้ว!");
                            router.refresh();
                          } catch {
                            setSettingsMsg("เกิดข้อผิดพลาดในการบันทึก");
                          }
                          setSettingsLoading(false);
                        },
                        (err) => {
                          setSettingsMsg(`อัปโหลดไม่สำเร็จ: ${err}`);
                          setSettingsLoading(false);
                        }
                      );
                    }}
                  />
                  <label
                    htmlFor="upload-logo-main"
                    className={`flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm border border-primary/20 hover:border-accent hover:bg-cream text-primary transition-all cursor-pointer ${
                      settingsLoading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <Upload className="w-4 h-4 text-accent" />
                    <span>{settingsLoading ? "กำลังอัปโหลด..." : "แตะเพื่อเปลี่ยนโลโก้ร้าน"}</span>
                  </label>
                </div>
              </div>

              {/* 4. Quick Link to Menu Dishes */}
              <div className="p-6 bg-cream/60 rounded-3xl border border-primary/10 shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                    รูปภาพอาหารแต่ละจาน
                  </span>
                  <h3 className="text-base font-bold text-primary">๔. รูปภาพเมนูอาหาร (Dish Photos)</h3>
                  <p className="text-xs text-primary/70 leading-relaxed">
                    หากต้องการใส่รูปภาพหรือเปลี่ยนรูปของอาหารแต่ละจาน (เช่น ขันโตก, หมูทอด, น้ำพริกหนุ่ม, ข้าวพันผัก) สามารถเข้าไปใส่รูปได้ทันทีในหน้าจัดการเมนูอาหาร
                  </p>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab("menus")}
                    className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-primary hover:bg-primary-dark text-white shadow-sm transition-all cursor-pointer hover:scale-[1.01]"
                  >
                    <Utensils className="w-4.5 h-4.5 text-accent" />
                    <span>👉 ไปที่หน้าจัดการรูปภาพเมนูอาหาร</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 5. Atmosphere Photo Gallery Album with Captions */}
            <AmbienceGalleryEditor
              currentItems={galleryItems}
              currentBadge={settings.gallery_badge || ""}
              currentTitle={settings.gallery_title || ""}
              currentSubtitle={settings.gallery_subtitle || ""}
              onSave={handleSaveAmbienceGallery}
              handleFileUpload={handleFileUpload}
              isLoading={settingsLoading}
            />

            {/* 6. Quick Facts 4 Stories Manager */}
            <div className="p-6 sm:p-8 bg-white rounded-3xl border border-primary/10 shadow-xs space-y-6">
              <div className="border-b border-primary/5 pb-4 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-accent/15 text-accent-dark text-[11px] font-bold">
                    ๔ จุดเด่นเรือน ๑๐๐ ปี
                  </span>
                  <span className="text-xs font-bold text-primary">
                    อัปโหลดรูปภาพจริง & เรื่องเล่าเฉพาะจุด
                  </span>
                </div>
                <h3 className="text-lg font-bold text-primary">
                  ๖. จัดการรูปภาพและเรื่องเล่า ๔ จุดเด่น (Quick Facts Stories)
                </h3>
                <p className="text-xs text-primary/70 leading-relaxed">
                  จุดเด่นทั้ง ๔ ข้อบนหน้าแรก (🏛️ ๑๐๐+ ปี, 🔨 ๐ ตัว ไร้ตะปู, 👨‍👩‍👧‍👦 ๔ รุ่นคน, 🌶️ ตำมือ ๑๐๐%) สามารถกดเข้าไปดูอัลบั้มภาพและเรื่องราวได้ คุณสามารถเพิ่มรูปภาพจริง (ภาพบ้าน, ภาพข้อต่อไม้, ภาพครอบครัว, ภาพคุณป้าในครัว) ได้ที่นี่
                </p>
              </div>

              {/* 4 Tabs selector */}
              <div className="flex flex-wrap gap-2 border-b border-primary/10 pb-3">
                {[
                  { id: "house" as const, emoji: "🏛️", title: "๑. เรือนไม้สัก ๑๐๐+ ปี" },
                  { id: "wood" as const, emoji: "🔨", title: "๒. ๐ ตัว ไร้ตะปู" },
                  { id: "family" as const, emoji: "👨‍👩‍👧‍👦", title: "๓. คน ๔ รุ่น" },
                  { id: "kitchen" as const, emoji: "🌶️", title: "๔. ตำมือ ๑๐๐% & คุณป้า" },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAdminStoryTab(tab.id)}
                    className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      adminStoryTab === tab.id
                        ? "bg-accent text-white shadow-xs"
                        : "bg-cream text-primary/70 hover:bg-accent/10 hover:text-primary"
                    }`}
                  >
                    <span>{tab.emoji}</span>
                    <span>{tab.title}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {(() => {
                const currentData = customStoriesData[adminStoryTab] || {};
                const photos: { url: string; caption: string; tag?: string }[] = currentData.photos || [];

                return (
                  <div className="space-y-6 pt-2">
                    {/* Upload button for this story */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-cream/40 rounded-2xl border border-primary/10">
                      <div>
                        <h4 className="font-bold text-sm text-primary">
                          {adminStoryTab === "house" && "🏛️ คลังรูปภาพเรือนไม้สัก ๑๐๐+ ปี"}
                          {adminStoryTab === "wood" && "🔨 คลังรูปภาพข้อต่อไม้ / เข้าเดือยไร้ตะปู"}
                          {adminStoryTab === "family" && "👨‍👩‍👧‍👦 คลังรูปภาพครอบครัว ๔ รุ่น / หม่อนน้อย / ตายาย"}
                          {adminStoryTab === "kitchen" && "🌶️ คลังรูปภาพคุณป้าในครัว & พริกแกงตำมือ"}
                        </h4>
                        <p className="text-xs text-primary/60">
                          มีรูปภาพที่อัปโหลดเพิ่มในหมวดนี้แล้ว {photos.length} รูป (อัปโหลดเพิ่มได้ไม่จำกัด)
                        </p>
                      </div>

                      <div className="shrink-0 w-full sm:w-auto">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          id={`upload-story-${adminStoryTab}`}
                          className="hidden"
                          disabled={settingsLoading}
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length === 0) return;
                            setSettingsLoading(true);
                            setSettingsMsg("กำลังอัปโหลดรูปภาพ...");

                            let nextPhotos = [...photos];
                            for (const file of files) {
                              await new Promise<void>((resolve) => {
                                handleFileUpload(
                                  file,
                                  (url) => {
                                    nextPhotos.push({
                                      url,
                                      caption: file.name.replace(/\.[^/.]+$/, ""),
                                      tag: adminStoryTab === "house" ? "เรือนโบราณ" : adminStoryTab === "wood" ? "ข้อต่อไม้" : adminStoryTab === "family" ? "ครอบครัว" : "ในครัว"
                                    });
                                    resolve();
                                  },
                                  () => resolve()
                                );
                              });
                            }

                            const nextCustomStories = {
                              ...customStoriesData,
                              [adminStoryTab]: {
                                ...currentData,
                                photos: nextPhotos
                              }
                            };
                            const jsonStr = JSON.stringify(nextCustomStories);
                            setSettings(prev => ({ ...prev, custom_stories_data: jsonStr }));

                            try {
                              await fetch("/api/admin/settings", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ custom_stories_data: jsonStr }),
                              });
                              setSettingsMsg(`✅ เพิ่มรูปภาพลงในเรื่องเล่าเรียบร้อยแล้ว!`);
                              router.refresh();
                            } catch {
                              setSettingsMsg("เกิดข้อผิดพลาดในการบันทึก");
                            }
                            setSettingsLoading(false);
                          }}
                        />
                        <label
                          htmlFor={`upload-story-${adminStoryTab}`}
                          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-accent hover:bg-accent-dark text-white shadow-xs transition-all cursor-pointer ${
                            settingsLoading ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          <Camera className="w-4 h-4" />
                          <span>+ อัปโหลดรูปภาพเพิ่มในหมวดนี้</span>
                        </label>
                      </div>
                    </div>

                    {/* Photos Grid */}
                    {photos.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {photos.map((p, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-4/3 rounded-2xl overflow-hidden border border-primary/15 group shadow-xs bg-black/10"
                          >
                            <img
                              src={p.url}
                              alt={p.caption || "Story photo"}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {p.tag && (
                              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-[10px] text-white font-bold">
                                {p.tag}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={async () => {
                                if (!confirm("ต้องการลบรูปภาพนี้ใช่หรือไม่?")) return;
                                const nextPhotos = photos.filter((_, i) => i !== idx);
                                const nextCustomStories = {
                                  ...customStoriesData,
                                  [adminStoryTab]: {
                                    ...currentData,
                                    photos: nextPhotos
                                  }
                                };
                                const jsonStr = JSON.stringify(nextCustomStories);
                                setSettings(prev => ({ ...prev, custom_stories_data: jsonStr }));
                                try {
                                  await fetch("/api/admin/settings", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ custom_stories_data: jsonStr }),
                                  });
                                  setSettingsMsg("✅ ลบรูปภาพเรียบร้อยแล้ว");
                                  router.refresh();
                                } catch {
                                  setSettingsMsg("เกิดข้อผิดพลาดในการลบรูป");
                                }
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title="ลบรูปนี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 border border-dashed border-primary/20 rounded-2xl text-center space-y-2 bg-cream/20">
                        <p className="text-xs text-primary/70 font-semibold">
                          ยังไม่มีรูปภาพที่อัปโหลดเพิ่มเติมในหมวดนี้ (ระบบกำลังใช้รูปภาพเริ่มต้นที่สวยงามให้โดยอัตโนมัติ)
                        </p>
                        <p className="text-[11px] text-primary/50">
                          เมื่อคุณมีรูปถ่ายจริง (เช่น ถ่ายข้อต่อไม้, ถ่ายคุณป้าตำพริกแกง) สามารถแตะปุ่ม "+ อัปโหลดรูปภาพเพิ่มในหมวดนี้" ได้ทันที
                        </p>
                      </div>
                    )}

                    {/* Story Text & Narrative Editor */}
                    <StoryTextEditor
                      key={adminStoryTab}
                      storyId={adminStoryTab}
                      storyEmoji={
                        adminStoryTab === "house"
                          ? "🏛️"
                          : adminStoryTab === "wood"
                          ? "🔨"
                          : adminStoryTab === "family"
                          ? "👨‍👩‍👧‍👦"
                          : "🌶️"
                      }
                      storyTabName={
                        adminStoryTab === "house"
                          ? "๑. เรือนไม้สัก ๑๐๐+ ปี"
                          : adminStoryTab === "wood"
                          ? "๒. ๐ ตัว ไร้ตะปู"
                          : adminStoryTab === "family"
                          ? "๓. คน ๔ รุ่น"
                          : "๔. ตำมือ ๑๐๐% & คุณป้า"
                      }
                      currentCustomData={currentData}
                      onSave={async (fields) => {
                        await handleSaveStoryFields(adminStoryTab, fields);
                      }}
                      onReset={async () => {
                        await handleResetStoryFields(adminStoryTab);
                      }}
                      isLoading={settingsLoading}
                    />
                  </div>
                );
              })()}
            </div>

            {/* 7. About Page Stories & 4 Generations Manager */}
            <AboutPageEditor
              currentJson={settings.about_page_custom_data || ""}
              onSave={async (jsonStr) => {
                setSettingsLoading(true);
                setSettingsMsg("กำลังบันทึกเนื้อหาหน้ารู้จักเรา...");
                setSettings(prev => ({ ...prev, about_page_custom_data: jsonStr }));
                try {
                  const res = await fetch("/api/admin/settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ about_page_custom_data: jsonStr }),
                  });
                  if (res.ok) {
                    setSettingsMsg("✅ บันทึกเนื้อหาหน้ารู้จักเราเรียบร้อยแล้ว! หน้าร้านอัปเดตทันที");
                    router.refresh();
                  } else {
                    if (res.status === 401) {
                      alert("เซสชันผู้ดูแลระบบหมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่อีกครั้งที่ /admin/login");
                      window.location.href = "/admin/login";
                      return;
                    }
                    const errData = await res.json().catch(() => ({}));
                    const errMsg = errData.error || "เกิดข้อผิดพลาดในการบันทึกเนื้อหา";
                    setSettingsMsg(errMsg);
                    throw new Error(errMsg);
                  }
                } catch (err: any) {
                  setSettingsMsg("เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย");
                  throw err;
                } finally {
                  setSettingsLoading(false);
                }
              }}
              isLoading={settingsLoading}
            />
          </div>
        )}

        {/* TAB 2: MANAGE MENUS */}
        {activeTab === "menus" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-primary/5 pb-4">
              <div>
                <h2 className="text-xl font-bold text-primary">จัดการรายการเมนูอาหาร</h2>
                <p className="text-xs text-primary/70">จัดการสถานะ เปิด-ปิด เมนูอาหารที่หมด และอัปเดตราคา</p>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center">
                {/* View Mode Switcher */}
                <div className="inline-flex rounded-xl border border-primary/15 p-0.5 bg-white shrink-0">
                  <button
                    type="button"
                    onClick={() => setMenuViewMode("cards")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      menuViewMode === "cards" ? "bg-primary text-white shadow-xs" : "text-primary/70 hover:text-accent"
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>การ์ดรูปภาพ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMenuViewMode("table")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      menuViewMode === "table" ? "bg-primary text-white shadow-xs" : "text-primary/70 hover:text-accent"
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>ตารางสรุป</span>
                  </button>
                </div>

                <div className="relative flex-grow sm:w-48">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-primary/45">
                    <Search className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="ค้นหาเมนู..."
                    value={menuSearch}
                    onChange={e => setMenuSearch(e.target.value)}
                    className="block w-full pl-9 pr-3 py-1.5 border border-primary/10 rounded-xl bg-white text-xs sm:text-sm focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowMenuHeaderEditor(!showMenuHeaderEditor)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 border ${
                    showMenuHeaderEditor
                      ? "bg-accent text-white border-accent shadow-xs"
                      : "bg-white hover:bg-accent/10 text-accent-dark border-accent/25"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>{showMenuHeaderEditor ? "ซ่อนตั้งค่าหัวข้อ & PDF" : "ตั้งค่าหัวข้อหน้าเมนู & PDF"}</span>
                </button>
                <button
                  onClick={handleOpenAddMenu}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-4.5 h-4.5" />
                  เพิ่มเมนู
                </button>
              </div>
            </div>

            {/* Menu Page Header & PDF Upload Editor */}
            {showMenuHeaderEditor && (
              <div className="p-5 bg-primary-dark/5 border-2 border-accent/30 rounded-2xl space-y-5 font-thai transition-all shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-primary/10 pb-3">
                  <div>
                    <h3 className="font-bold text-primary text-sm sm:text-base flex items-center gap-2">
                      <FileText className="w-4.5 h-4.5 text-accent" />
                      <span>ปรับแต่งข้อความส่วนหัวหน้าเมนูอาหาร & เล่มเมนู PDF</span>
                    </h3>
                    <p className="text-xs text-primary/70">
                      แก้ไขหัวเรื่อง คำบรรยาย ข้อความแจ้งเตือน และอัปโหลดไฟล์ PDF เมนูฉบับเต็มได้ทันที
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveMenuHeader}
                    disabled={settingsLoading}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow shrink-0"
                  >
                    <Save className="w-4 h-4" />
                    <span>{settingsLoading ? "กำลังบันทึก..." : "บันทึกข้อมูลหน้าเมนู"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-primary mb-1">
                      ป้ายกำกับด้านบน (Badge)
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น ร้านลำลำลับแลบ้าน ๑๐๐ ปี"
                      value={settings.menu_page_badge ?? "ร้านลำลำลับแลบ้าน ๑๐๐ ปี"}
                      onChange={(e) => setSettings(prev => ({ ...prev, menu_page_badge: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-primary/15 rounded-xl text-primary focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-primary mb-1">
                      ชื่อหัวข้อหน้าเมนู (Title)
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น กับข้าวและสำรับอาหาร"
                      value={settings.menu_page_title ?? "กับข้าวและสำรับอาหาร"}
                      onChange={(e) => setSettings(prev => ({ ...prev, menu_page_title: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-primary/15 rounded-xl text-primary focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-semibold text-primary mb-1">
                      คำบรรยายใต้หัวข้อ (Subtitle)
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น ปรุงสดใหม่ทุกจาน พริกแกงโขลกเอง วัตถุดิบสดจากสวนหลังบ้านและในชุมชนลับแล"
                      value={settings.menu_page_subtitle ?? "ปรุงสดใหม่ทุกจาน พริกแกงโขลกเอง วัตถุดิบสดจากสวนหลังบ้านและในชุมชนลับแล"}
                      onChange={(e) => setSettings(prev => ({ ...prev, menu_page_subtitle: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-primary/15 rounded-xl text-primary focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-semibold text-primary mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-accent" />
                        ข้อความแจ้งเตือนพิเศษ (Cooking Notice - แสดงเป็นแถบสีเตือน เช่น อาหารปรุงสดจานต่อจาน)
                      </span>
                      <span className="text-[10px] text-primary/50 font-normal">หากไม่ต้องการแสดง ให้เว้นว่างไว้</span>
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น อาหารปรุงสดจานต่อจาน หากมาช่วงเที่ยงอาจใช้เวลารอสักครู่ แนะนำจองโต๊ะหรือสั่งล่วงหน้าครับ"
                      value={settings.menu_page_notice ?? ""}
                      onChange={(e) => setSettings(prev => ({ ...prev, menu_page_notice: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-primary/15 rounded-xl text-primary focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>

                {/* PDF Menu Settings Box */}
                <div className="p-4 bg-white border border-primary/10 rounded-xl space-y-4 text-xs">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-accent" />
                      <span className="font-bold text-primary">เล่มเมนูฉบับเต็ม (PDF Menu File)</span>
                    </div>
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={settings.menu_pdf_show !== "0"}
                        onChange={(e) => setSettings(prev => ({ ...prev, menu_pdf_show: e.target.checked ? "1" : "0" }))}
                        className="rounded border-primary/20 text-accent focus:ring-accent w-4 h-4"
                      />
                      <span className="font-semibold text-primary">เปิดแสดงปุ่มดาวน์โหลด/เปิดดู PDF</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-primary mb-1">
                        ข้อความบนปุ่มกด (Button Text)
                      </label>
                      <input
                        type="text"
                        placeholder="เปิดดูเล่มเมนูฉบับเต็ม (PDF)"
                        value={settings.menu_pdf_btn_text ?? "เปิดดูเล่มเมนูฉบับเต็ม (PDF)"}
                        onChange={(e) => setSettings(prev => ({ ...prev, menu_pdf_btn_text: e.target.value }))}
                        className="w-full px-3 py-2 bg-cream/10 border border-primary/15 rounded-xl text-primary focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-primary mb-1">
                        URL ไฟล์ PDF ปัจจุบัน
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="/menu-2026.pdf หรือ URL ภายนอก"
                          value={settings.menu_pdf_url ?? "/menu-2026.pdf"}
                          onChange={(e) => setSettings(prev => ({ ...prev, menu_pdf_url: e.target.value }))}
                          className="w-full px-3 py-2 bg-cream/10 border border-primary/15 rounded-xl text-primary focus:outline-none focus:border-accent font-mono text-[11px]"
                        />
                        {settings.menu_pdf_url && (
                          <a
                            href={settings.menu_pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-primary/5 hover:bg-primary/10 rounded-xl text-primary shrink-0 border border-primary/15 flex items-center justify-center"
                            title="ทดลองเปิดไฟล์ PDF"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Upload new PDF */}
                  <div className="pt-2 border-t border-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <span className="font-semibold text-primary block">อัปโหลดไฟล์ PDF เล่มเมนูใหม่:</span>
                      <span className="text-[10px] text-primary/60">รองรับไฟล์เอกสารนามสกุล .pdf จากคอมพิวเตอร์หรือมือถือของคุณ</span>
                    </div>
                    <div>
                      <input
                        type="file"
                        id="upload-menu-pdf"
                        accept=".pdf,application/pdf"
                        className="hidden"
                        onChange={handlePdfUpload}
                        disabled={menuPdfUploading}
                      />
                      <label
                        htmlFor="upload-menu-pdf"
                        className={`inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-dark text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition-all ${
                          menuPdfUploading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <Upload className="w-4 h-4" />
                        <span>{menuPdfUploading ? "กำลังอัปโหลด PDF..." : "เลือกไฟล์ PDF เพื่ออัปโหลด"}</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowMenuHeaderEditor(false)}
                    className="px-4 py-2 text-primary/60 hover:text-primary rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    ปิดหน้าต่าง
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveMenuHeader}
                    disabled={settingsLoading}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-primary hover:bg-primary-light text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow"
                  >
                    <Save className="w-4 h-4" />
                    <span>{settingsLoading ? "กำลังบันทึก..." : "บันทึกการตั้งค่าหน้าเมนู"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Filter and Bulk Actions Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-primary/5 border border-primary/10 rounded-2xl font-thai text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-primary">กรองตามหมวดหมู่:</span>
                <select
                  value={menuCatFilter}
                  onChange={(e) => setMenuCatFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-primary/15 rounded-xl text-primary focus:outline-none cursor-pointer font-thai text-xs font-semibold"
                >
                  <option value="ทั้งหมด">ทั้งหมด (ทุกหมวดหมู่)</option>
                  {Array.from(new Set(menus.map((m) => m.category))).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {menuCatFilter !== "ทั้งหมด" && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-primary-dark/80 mr-1">จัดการทั้งหมวดหมู่ "{menuCatFilter}":</span>
                  
                  <button
                    type="button"
                    onClick={() => handleBulkToggleCategory(menuCatFilter, "unavailable")}
                    className="px-2.5 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-xl font-semibold hover:bg-red-100 transition-colors cursor-pointer"
                  >
                    ปิดขายชั่วคราวทั้งหมวด
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkToggleCategory(menuCatFilter, "available")}
                    className="px-2.5 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-xl font-semibold hover:bg-green-100 transition-colors cursor-pointer"
                  >
                    เปิดขายทั้งหมวด
                  </button>

                  <div className="w-px h-5 bg-primary/20 mx-1" />

                  <button
                    type="button"
                    onClick={() => handleBulkToggleCategory(menuCatFilter, "hide")}
                    className="px-2.5 py-1.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-xl font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    ซ่อนหน้าเว็บทั้งหมวด
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkToggleCategory(menuCatFilter, "show")}
                    className="px-2.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-semibold hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    แสดงหน้าเว็บทั้งหมวด
                  </button>
                </div>
              )}
            </div>

            {/* Menu Modal Dialog (Popup) */}
            {showMenuForm && editingMenu && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-primary/15 font-thai my-auto">
                  <div className="flex justify-between items-center pb-4 border-b border-primary/10">
                    <h3 className="font-bold text-primary text-base sm:text-lg flex items-center gap-2">
                      <Utensils className="w-5 h-5 text-accent" />
                      {editingMenu.id ? `แก้ไขเมนู: ${editingMenu.name}` : "เพิ่มเมนูอาหารใหม่"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => { setShowMenuForm(false); setEditingMenu(null); }}
                      className="p-1.5 rounded-full hover:bg-primary/5 text-primary/60 hover:text-primary cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <form onSubmit={handleSaveMenu} className="space-y-4 pt-4">
                {menuFormError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>{menuFormError}</span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-primary mb-1">ชื่อเมนู</label>
                    <input
                      type="text"
                      value={editingMenu.name || ""}
                      onChange={e => setEditingMenu(prev => ({ ...prev, name: e.target.value }))}
                      className="block w-full px-3 py-2 bg-white border border-primary/15 rounded-xl text-xs sm:text-sm focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-primary mb-1">ราคา (บาท)</label>
                    <input
                      type="number"
                      value={editingMenu.price !== undefined ? editingMenu.price : 0}
                      onChange={e => setEditingMenu(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                      className="block w-full px-3 py-2 bg-white border border-primary/15 rounded-xl text-xs sm:text-sm focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-primary mb-1">หมวดหมู่</label>
                    <select
                      value={editingMenu.category || "จานเดียว"}
                      onChange={e => setEditingMenu(prev => ({ ...prev, category: e.target.value }))}
                      className="block w-full px-3 py-2 bg-white border border-primary/15 rounded-xl text-xs sm:text-sm focus:outline-none"
                    >
                      {["เซทขันโตก", "ข้าวพันผัก", "อาหารพื้นบ้าน", "จานเดียว", "กับข้าว", "ส้มตำ", "ทานเล่น", "เครื่องดื่ม"].map(cat => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-primary mb-1">รูปภาพอาหาร</label>
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="flex-1 w-full">
                      <input
                        type="text"
                        value={editingMenu.image_url || ""}
                        onChange={e => setEditingMenu(prev => ({ ...prev, image_url: e.target.value }))}
                        placeholder="ตัวอย่าง: /images/dish.jpg หรืออัปโหลดไฟล์ด้านขวา"
                        className="block w-full px-3 py-2 bg-white border border-primary/15 rounded-xl text-xs sm:text-sm focus:outline-none"
                      />
                    </div>
                    <div className="relative shrink-0 w-full sm:w-auto">
                      <input
                        type="file"
                        accept="image/*"
                        id="menu-image-upload"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setMenuFormLoading(true);
                          setMenuFormError("");
                          await handleFileUpload(
                            file,
                            (url) => {
                              setEditingMenu(prev => ({ ...prev, image_url: url }));
                              setMenuFormLoading(false);
                            },
                            (err) => {
                              setMenuFormError(err);
                              setMenuFormLoading(false);
                            }
                          );
                        }}
                      />
                      <label
                        htmlFor="menu-image-upload"
                        className="flex items-center justify-center gap-1.5 px-4 py-2 border border-primary/20 hover:border-primary/40 bg-white hover:bg-primary/5 text-primary rounded-xl text-xs font-semibold cursor-pointer transition-all w-full sm:w-auto text-center"
                      >
                        <Plus className="w-4 h-4" />
                        <span>อัปโหลดรูปภาพ</span>
                      </label>
                    </div>
                  </div>
                  {editingMenu.image_url && (
                    <div className="mt-2 relative w-20 h-20 rounded-lg overflow-hidden border border-primary/10">
                      <img src={editingMenu.image_url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-primary mb-1">รายละเอียดส่วนผสม/คำอธิบายเพิ่มเติม</label>
                  <textarea
                    value={editingMenu.description || ""}
                    onChange={e => setEditingMenu(prev => ({ ...prev, description: e.target.value }))}
                    className="block w-full px-3 py-2 bg-white border border-primary/15 rounded-xl text-xs sm:text-sm focus:outline-none h-20 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3.5 bg-cream/40 border border-primary/5 rounded-2xl">
                  {/* Visibility Toggler */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editingMenu.is_visible !== 0}
                      onChange={e => setEditingMenu(prev => ({ ...prev, is_visible: e.target.checked ? 1 : 0 }))}
                      className="rounded text-accent focus:ring-accent w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-primary">แสดงบนเว็บไซต์</span>
                  </label>

                  {/* Availability Toggler */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editingMenu.available !== 0}
                      onChange={e => setEditingMenu(prev => ({ ...prev, available: e.target.checked ? 1 : 0 }))}
                      className="rounded text-accent focus:ring-accent w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-primary">ความพร้อมขาย (มีของ)</span>
                  </label>

                  {/* Recommendation Toggler */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!editingMenu.is_recommended}
                      onChange={e => setEditingMenu(prev => ({ ...prev, is_recommended: e.target.checked ? 1 : 0 }))}
                      className="rounded text-accent focus:ring-accent w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-primary">แนะนำในหน้าแรก</span>
                  </label>

                  {/* Seasonal Toggler */}
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!editingMenu.is_seasonal}
                      onChange={e => setEditingMenu(prev => ({ ...prev, is_seasonal: e.target.checked ? 1 : 0 }))}
                      className="rounded text-accent focus:ring-accent w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-primary">อาหารตามฤดูกาล</span>
                  </label>
                </div>
                <div className="flex gap-2 justify-end pt-3 border-t border-primary/10">
                  <button
                    type="button"
                    onClick={() => { setShowMenuForm(false); setEditingMenu(null); }}
                    className="px-5 py-2.5 border border-primary/10 hover:bg-primary/5 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={menuFormLoading}
                    className="px-6 py-2.5 bg-primary hover:bg-primary-light text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {menuFormLoading ? "กำลังบันทึก..." : "บันทึกข้อมูลเมนู"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

            {/* Menu List: Cards View vs Table View */}
            {filteredMenus.length > 0 ? (
              menuViewMode === "cards" ? (
                /* Visual Card Grid View (Merchant App Style) */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-1">
                  {filteredMenus.map(menu => (
                    <div
                      key={menu.id}
                      className={`p-4 rounded-2xl border transition-all bg-white flex flex-col justify-between ${
                        menu.available === 0
                          ? "border-red-200 bg-red-50/20 shadow-xs"
                          : "border-primary/10 shadow-xs hover:shadow-md hover:border-primary/20"
                      }`}
                    >
                      <div>
                        {/* Image & Top Badges */}
                        <div className="relative w-full h-44 rounded-xl overflow-hidden bg-primary/5 mb-3 border border-primary/5 group">
                          {menu.image_url ? (
                            <>
                              <img src={menu.image_url} alt={menu.name} className="w-full h-full object-cover" />
                              {/* Quick Action Buttons on Image */}
                              <div className="absolute bottom-2 right-2 flex items-center gap-1.5 z-10">
                                <input
                                  type="file"
                                  accept="image/*"
                                  id={`change-upload-${menu.id}`}
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    await handleFileUpload(
                                      file,
                                      (url) => handleUpdateMenuImage(menu.id, url),
                                      (err) => alert("อัปโหลดไม่สำเร็จ: " + err)
                                    );
                                  }}
                                />
                                <label
                                  htmlFor={`change-upload-${menu.id}`}
                                  className="px-2 py-1 bg-black/75 hover:bg-accent text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all backdrop-blur-xs flex items-center gap-1 shadow-xs"
                                  title="เปลี่ยนรูปภาพใหม่"
                                >
                                  <Camera className="w-3 h-3" />
                                  <span>เปลี่ยนรูป</span>
                                </label>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`ต้องการลบรูปภาพของ "${menu.name}" ใช่หรือไม่?`)) {
                                      handleUpdateMenuImage(menu.id, "");
                                    }
                                  }}
                                  className="px-2 py-1 bg-black/75 hover:bg-red-600 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all backdrop-blur-xs flex items-center gap-1 shadow-xs"
                                  title="ลบรูปภาพนี้"
                                >
                                  ✕ ลบ
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-primary/45 bg-cream/60 p-3 text-center">
                              <input
                                type="file"
                                accept="image/*"
                                id={`quick-upload-${menu.id}`}
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  await handleFileUpload(
                                    file,
                                    (url) => handleUpdateMenuImage(menu.id, url),
                                    (err) => alert("อัปโหลดไม่สำเร็จ: " + err)
                                  );
                                }}
                              />
                              <label
                                htmlFor={`quick-upload-${menu.id}`}
                                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-dashed border-primary/20 hover:border-accent hover:bg-white text-primary/70 hover:text-accent transition-all cursor-pointer w-full h-full group/label"
                              >
                                <Upload className="w-5 h-5 text-accent group-hover/label:scale-110 transition-transform" />
                                <span className="text-[11px] font-bold">+ แตะเพื่อใส่รูปเมนูนี้</span>
                                <span className="text-[9px] text-primary/40">(ใส่รูปเฉพาะบางเมนูได้)</span>
                              </label>
                            </div>
                          )}

                          {/* Category Badge */}
                          <span className="absolute top-2 left-2 px-2.5 py-1 bg-white/95 backdrop-blur-xs text-primary font-bold rounded-full text-[10px] shadow-xs pointer-events-none">
                            {menu.category}
                          </span>

                          {/* Recommendation Star Badge */}
                          {(menu.is_recommended ?? 0) === 1 && (
                            <span className="absolute top-2 right-2 px-2.5 py-1 bg-amber-400 text-amber-950 font-bold rounded-full text-[10px] shadow-xs flex items-center gap-1 pointer-events-none">
                              <Star className="w-3 h-3 fill-current" />
                              <span>แนะนำ</span>
                            </span>
                          )}

                          {/* Out of Stock Overlay */}
                          {menu.available === 0 && (
                            <div className="absolute inset-0 bg-red-950/40 backdrop-blur-xs flex items-center justify-center pointer-events-none">
                              <span className="bg-red-600 text-white font-bold px-3 py-1 rounded-full text-xs shadow-md animate-pulse">
                                🔴 หมดชั่วคราว
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Title & Price */}
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <div>
                            <h4 className="font-bold text-primary text-sm line-clamp-1">{menu.name}</h4>
                            <span className="text-[10px] text-accent-dark font-medium">{menu.category}</span>
                          </div>
                          <span className="font-bold text-accent-dark text-sm shrink-0">
                            {menu.price > 0 ? `฿${menu.price}` : "ตามน้ำหนัก"}
                          </span>
                        </div>

                        {/* Reorder Buttons (Move Up, Down, Top) */}
                        <div className="flex items-center justify-between gap-1 py-1 px-2 bg-cream/70 border border-primary/10 rounded-xl mb-2 text-[11px]">
                          <span className="text-[10px] text-primary/60 font-semibold">จัดลำดับ:</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleReorderMenu(menu.id, "top")}
                              className="px-2 py-0.5 bg-white hover:bg-accent text-primary-dark rounded-md text-[10px] font-bold shadow-2xs border border-primary/15 transition-all flex items-center gap-0.5 cursor-pointer"
                              title="ย้ายเมนูนี้ไปไว้บนสุดของหมวดนี้"
                            >
                              <ChevronsUp className="w-3 h-3 text-accent-dark" />
                              <span>บนสุด</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReorderMenu(menu.id, "up")}
                              className="p-1 bg-white hover:bg-primary/10 text-primary rounded-md text-[10px] font-bold shadow-2xs border border-primary/15 transition-all cursor-pointer"
                              title="เลื่อนขึ้น 1 อันดับ"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReorderMenu(menu.id, "down")}
                              className="p-1 bg-white hover:bg-primary/10 text-primary rounded-md text-[10px] font-bold shadow-2xs border border-primary/15 transition-all cursor-pointer"
                              title="เลื่อนลง 1 อันดับ"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {menu.description && (
                          <p className="text-[11px] text-primary/60 line-clamp-2 mb-3 leading-relaxed">
                            {menu.description}
                          </p>
                        )}
                      </div>

                      {/* Controls Bar */}
                      <div className="space-y-2 pt-3 border-t border-primary/5">
                        {/* Main Stock Availability Switch Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleMenuAvailability(menu.id, menu.available)}
                          className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                            menu.available === 1
                              ? "bg-green-100 hover:bg-green-200 text-green-800 border border-green-300"
                              : "bg-red-600 hover:bg-red-700 text-white shadow-xs"
                          }`}
                        >
                          {menu.available === 1 ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-green-700" />
                              <span>พร้อมขาย (แตะเมื่อของหมด)</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>หมดชั่วคราว (แตะเพื่อเปิดขาย)</span>
                            </>
                          )}
                        </button>

                        {/* Secondary Toggles and Edit Buttons */}
                        <div className="flex items-center justify-between gap-1 text-[10px]">
                          <div className="flex items-center gap-1">
                            {/* Recommend Toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleMenuRecommended(menu.id, menu.is_recommended ?? 0)}
                              className={`px-2 py-1 rounded-lg font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                                (menu.is_recommended ?? 0) === 1
                                  ? "bg-amber-100 text-amber-800 border-amber-300"
                                  : "bg-cream text-primary/60 border-primary/10 hover:bg-primary/5"
                              }`}
                              title="สลับเมนูแนะนำหน้าแรก"
                            >
                              <Star className={`w-3 h-3 ${(menu.is_recommended ?? 0) === 1 ? "fill-current" : ""}`} />
                              <span>แนะนำ</span>
                            </button>

                            {/* Seasonal Toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleMenuSeasonal(menu.id, menu.is_seasonal ?? 0)}
                              className={`px-2 py-1 rounded-lg font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                                (menu.is_seasonal ?? 0) === 1
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : "bg-cream text-primary/60 border-primary/10 hover:bg-primary/5"
                              }`}
                              title="สลับอาหารตามฤดูกาล"
                            >
                              <Leaf className="w-3 h-3" />
                              <span>ฤดูกาล</span>
                            </button>

                            {/* Visibility Toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleMenuVisible(menu.id, menu.is_visible ?? 1)}
                              className={`px-2 py-1 rounded-lg font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                                (menu.is_visible ?? 1) === 1
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-gray-100 text-gray-500 border-gray-300"
                              }`}
                              title="แสดงหรือซ่อนจากหน้าเว็บ"
                            >
                              {(menu.is_visible ?? 1) === 1 ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              <span>{(menu.is_visible ?? 1) === 1 ? "แสดง" : "ซ่อน"}</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditMenu(menu)}
                              className="p-1.5 text-primary hover:bg-primary/5 rounded-lg border border-primary/10 cursor-pointer"
                              title="แก้ไขรายละเอียด"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMenu(menu.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-red-100 cursor-pointer"
                              title="ลบเมนู"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Compact Table View */
                <div className="overflow-x-auto border border-primary/10 rounded-xl max-h-[50vh] overflow-y-auto">
                  <table className="min-w-full divide-y divide-primary/10 text-left text-xs sm:text-sm">
                    <thead className="bg-primary/5 font-bold text-primary font-thai sticky top-0">
                      <tr>
                        <th className="px-4 py-3">ชื่ออาหาร</th>
                        <th className="px-4 py-3">ราคา</th>
                        <th className="px-4 py-3">หมวดหมู่</th>
                        <th className="px-3 py-3 text-center">จัดลำดับ</th>
                        <th className="px-4 py-3 text-center">แสดงหน้าเว็บ</th>
                        <th className="px-4 py-3 text-center">เมนูแนะนำ</th>
                        <th className="px-4 py-3 text-center">ตามฤดูกาล</th>
                        <th className="px-4 py-3 text-center">พร้อมขาย</th>
                        <th className="px-4 py-3 text-right">ดำเนินการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/5 bg-white text-primary-dark/85">
                      {filteredMenus.map(menu => (
                        <tr key={menu.id} className="hover:bg-primary-dark/5">
                          <td className="px-4 py-3">
                            <p className="font-semibold">{menu.name}</p>
                            {menu.description && <p className="text-[10px] text-primary/60 line-clamp-1">{menu.description}</p>}
                          </td>
                          <td className="px-4 py-3 font-semibold text-accent-dark">
                            {menu.price > 0 ? `฿${menu.price}` : "ตามน้ำหนัก"}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-accent/15 text-accent-dark rounded-full text-[10px] font-semibold">
                              {menu.category}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleReorderMenu(menu.id, "top")}
                                className="px-1.5 py-0.5 bg-cream hover:bg-accent text-primary-dark rounded text-[10px] font-bold border border-primary/15 cursor-pointer shadow-2xs flex items-center gap-0.5"
                                title="ย้ายไปไว้บนสุดของหมวดหมู่นี้"
                              >
                                <ChevronsUp className="w-3 h-3 text-accent-dark" />
                                <span>บนสุด</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReorderMenu(menu.id, "up")}
                                className="p-1 bg-cream hover:bg-primary/10 text-primary rounded text-[10px] font-bold border border-primary/15 cursor-pointer shadow-2xs"
                                title="เลื่อนขึ้น 1 อันดับ"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReorderMenu(menu.id, "down")}
                                className="p-1 bg-cream hover:bg-primary/10 text-primary rounded text-[10px] font-bold border border-primary/15 cursor-pointer shadow-2xs"
                                title="เลื่อนลง 1 อันดับ"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleMenuVisible(menu.id, menu.is_visible ?? 1)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors duration-200 border ${
                                (menu.is_visible ?? 1) === 1
                                  ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                                  : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-150"
                              }`}
                              title="สลับสถานะการแสดงหน้าเว็บ"
                            >
                              {(menu.is_visible ?? 1) === 1 ? (
                                <>
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>แสดง</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>ซ่อนอยู่</span>
                                </>
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleMenuRecommended(menu.id, menu.is_recommended ?? 0)}
                              className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors duration-200 border ${
                                (menu.is_recommended ?? 0) === 1
                                  ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                  : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
                              }`}
                              title="สลับแนะนำ"
                            >
                              {(menu.is_recommended ?? 0) === 1 ? "★ แนะนำ" : "ทั่วไป"}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleMenuSeasonal(menu.id, menu.is_seasonal ?? 0)}
                              className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors duration-200 border ${
                                (menu.is_seasonal ?? 0) === 1
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                  : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
                              }`}
                              title="สลับตามฤดูกาล"
                            >
                              {(menu.is_seasonal ?? 0) === 1 ? "ฤดูกาล" : "ทั่วไป"}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleMenuAvailability(menu.id, menu.available)}
                              className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors duration-200 border ${
                                menu.available === 1
                                  ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                  : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                              }`}
                              title="สลับสินค้าหมดชั่วคราว"
                            >
                              {menu.available === 1 ? "มีสินค้า" : "หมด"}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenEditMenu(menu)}
                              className="p-1 text-primary hover:bg-primary/5 rounded-lg cursor-pointer"
                              title="แก้ไขเมนู"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMenu(menu.id)}
                              className="p-1 text-primary-dark/50 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                              title="ลบเมนู"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="text-center py-12 bg-white/50 border border-dashed border-primary/10 rounded-xl">
                <p className="text-primary/60 text-sm">ไม่พบรายการข้อมูลเมนูอาหาร</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MANAGE ARTICLES */}
        {activeTab === "articles" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-primary/5 pb-4">
              <div>
                <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-accent" />
                  จัดการเนื้อหา “ตำราลับแลง” (๓๒ ตอน)
                </h2>
                <p className="text-xs text-primary/70 mt-1">
                  แตะที่บทที่ต้องการแก้ไข เพื่อเปิดหน้าต่างพิมพ์แก้ไขข้อความ ชื่อตอน หรือเรื่องเล่าได้ทันทีครับ
                </p>
              </div>
              <button
                onClick={handleOpenAddArticle}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 self-end sm:self-auto shadow-xs"
              >
                <Plus className="w-4.5 h-4.5" />
                เขียนบทใหม่
              </button>
            </div>

            {/* Filter by Part and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-4 rounded-2xl border border-primary/10 shadow-xs">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-primary/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="พิมพ์ค้นหาบท เช่น ข้าวพันผัก, มะแขว่น, บทที่ ๑..."
                  value={articleSearch}
                  onChange={(e) => setArticleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-primary/5 border border-primary/10 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-accent text-primary placeholder:text-primary/40 font-thai"
                />
              </div>

              {/* Part selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {["ทั้งหมด", "ภาคหนึ่ง", "ภาคสอง", "ภาคสาม", "ภาคสี่", "ภาคห้า"].map((part) => (
                  <button
                    key={part}
                    type="button"
                    onClick={() => setArticlePartFilter(part)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      articlePartFilter === part
                        ? "bg-primary text-white shadow-xs font-bold"
                        : "bg-primary/5 text-primary/70 hover:bg-primary/10 hover:text-primary"
                    }`}
                  >
                    {part === "ทั้งหมด" ? "ทั้งหมด (32 ตอน)" : part}
                  </button>
                ))}
              </div>
            </div>

            {/* Article Modal Dialog (Popup) */}
            {showArticleForm && editingArticle && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-primary/15 font-thai my-auto">
                  <div className="flex justify-between items-center pb-4 border-b border-primary/10">
                    <h3 className="font-bold text-primary text-base sm:text-lg flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-accent" />
                      {editingArticle.id ? `แก้ไขบทความ / ตอน: ${editingArticle.title}` : "เขียนบทความ / ตอนใหม่"}
                    </h3>
                    <button
                      type="button"
                      onClick={() => { setShowArticleForm(false); setEditingArticle(null); }}
                      className="p-1.5 rounded-full hover:bg-primary/5 text-primary/60 hover:text-primary cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveArticle} className="space-y-4 pt-4">
                    {articleFormError && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span>{articleFormError}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-primary mb-1">หัวข้อบทความ</label>
                        <input
                          type="text"
                          value={editingArticle.title || ""}
                          onChange={e => setEditingArticle(prev => ({ ...prev, title: e.target.value }))}
                          className="block w-full px-3 py-2 bg-white border border-primary/15 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-accent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-primary mb-1">ลิงก์บทความ (Slug เช่น why-lablae)</label>
                        <input
                          type="text"
                          value={editingArticle.slug || ""}
                          onChange={e => setEditingArticle(prev => ({ ...prev, slug: e.target.value }))}
                          className="block w-full px-3 py-2 bg-white border border-primary/15 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-accent"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-primary mb-1">รูปภาพปกบทความ (ถ้ามี)</label>
                      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <div className="flex-1 w-full">
                          <input
                            type="text"
                            value={editingArticle.image_url || ""}
                            onChange={e => setEditingArticle(prev => ({ ...prev, image_url: e.target.value }))}
                            placeholder="URL รูปภาพ หรือกดอัปโหลดด้านขวา"
                            className="block w-full px-3 py-2 bg-white border border-primary/15 rounded-xl text-xs sm:text-sm focus:outline-none"
                          />
                        </div>
                        <div className="relative shrink-0 w-full sm:w-auto">
                          <input
                            type="file"
                            accept="image/*"
                            id="article-image-upload"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setArticleFormLoading(true);
                              setArticleFormError("");
                              await handleFileUpload(
                                file,
                                (url) => {
                                  setEditingArticle(prev => ({ ...prev, image_url: url }));
                                  setArticleFormLoading(false);
                                },
                                (err) => {
                                  setArticleFormError(err);
                                  setArticleFormLoading(false);
                                }
                              );
                            }}
                          />
                          <label
                            htmlFor="article-image-upload"
                            className="flex items-center justify-center gap-1.5 px-4 py-2 border border-primary/20 hover:border-primary/40 bg-white hover:bg-primary/5 text-primary rounded-xl text-xs font-semibold cursor-pointer transition-all w-full sm:w-auto text-center"
                          >
                            <Plus className="w-4 h-4" />
                            <span>อัปโหลดรูปภาพ</span>
                          </label>
                        </div>
                      </div>
                      {editingArticle.image_url && (
                        <div className="mt-2 relative w-32 h-20 rounded-lg overflow-hidden border border-primary/10">
                          <img src={editingArticle.image_url} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-primary mb-1">เนื้อหาบทความ (สามารถแก้ไขข้อความได้ทุกบรรทัด)</label>
                      <textarea
                        value={editingArticle.content || ""}
                        onChange={e => setEditingArticle(prev => ({ ...prev, content: e.target.value }))}
                        className="block w-full px-3 py-3 bg-white border border-primary/15 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-accent h-72 resize-y font-thai leading-relaxed"
                        required
                      />
                    </div>
                    <div className="flex gap-2 justify-end pt-3 border-t border-primary/10">
                      <button
                        type="button"
                        onClick={() => { setShowArticleForm(false); setEditingArticle(null); }}
                        className="px-5 py-2.5 border border-primary/10 hover:bg-primary/5 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        disabled={articleFormLoading}
                        className="px-6 py-2.5 bg-primary hover:bg-primary-light text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {articleFormLoading ? "กำลังบันทึก..." : "บันทึกการแก้ไขบทความ"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Article items list */}
            {filteredArticles.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {filteredArticles.map((art, idx) => (
                  <div
                    key={art.id}
                    onClick={() => handleOpenEditArticle(art)}
                    className="p-4 bg-white border border-primary/10 hover:border-accent hover:shadow-md rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all cursor-pointer group"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent-dark">
                          ตอนที่ {idx + 1}
                        </span>
                        {art.part_title && (
                          <span className="text-[10px] text-primary/60 font-medium">
                            {art.part_title}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-primary text-sm sm:text-base leading-tight group-hover:text-accent-dark transition-colors">
                        {art.title}
                      </h4>
                      <p className="text-xs text-primary/70 line-clamp-2 leading-relaxed">
                        {art.excerpt || art.content.replace(/[#*`]/g, "").trim().substring(0, 140)}...
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditArticle(art);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/15 hover:bg-accent text-primary rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>แตะเพื่อแก้ไข</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteArticle(art.id);
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl border border-red-100 transition-colors cursor-pointer"
                        title="ลบบทความ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white/50 border border-dashed border-primary/10 rounded-xl">
                <p className="text-primary/60 text-sm">ไม่พบบทหรือตอนที่ค้นหา (ลองเปลี่ยนคำค้นหา หรือเลือก "ทั้งหมด")</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SETTINGS & LINE NOTIFY */}
        {activeTab === "settings" && (
          <div className="space-y-6 font-thai">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-primary">ตั้งค่าระบบและข้อมูลร้าน</h2>
                <p className="text-xs text-primary/70">เลือกหมวดหมู่ที่ต้องการแก้ไขได้จากแท็บด้านล่างนี้ครับ</p>
              </div>
            </div>

            {settingsMsg && (
              <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs">
                <CheckCircle className="w-4.5 h-4.5 text-green-600" />
                <span>{settingsMsg}</span>
              </div>
            )}


            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Settings Sub-tabs Navigation */}
              <div className="flex flex-wrap gap-2 p-1.5 bg-primary/5 rounded-2xl border border-primary/10">
                <button
                  id="subtab-info"
                  type="button"
                  onClick={() => setSettingsSubTab("info")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    settingsSubTab === "info"
                      ? "bg-primary text-white shadow-xs"
                      : "text-primary/70 hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>1. ข้อมูลร้าน & เวลาเปิดปิด</span>
                </button>
                <button
                  id="subtab-appearance"
                  type="button"
                  onClick={() => setSettingsSubTab("appearance")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    settingsSubTab === "appearance"
                      ? "bg-primary text-white shadow-xs"
                      : "text-primary/70 hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <Palette className="w-4 h-4" />
                  <span>2. รูปภาพ & โทนสีร้าน</span>
                </button>
                <button
                  id="subtab-social"
                  type="button"
                  onClick={() => setSettingsSubTab("social")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    settingsSubTab === "social"
                      ? "bg-primary text-white shadow-xs"
                      : "text-primary/70 hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <Share2 className="w-4 h-4" />
                  <span>3. โซเชียลมีเดีย & แผนที่</span>
                </button>
                <button
                  id="subtab-layout"
                  type="button"
                  onClick={() => setSettingsSubTab("layout")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    settingsSubTab === "layout"
                      ? "bg-primary text-white shadow-xs"
                      : "text-primary/70 hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>4. จัดลำดับหน้าเว็บ & หมวดหมู่</span>
                </button>
                <button
                  id="subtab-security"
                  type="button"
                  onClick={() => setSettingsSubTab("security")}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    settingsSubTab === "security"
                      ? "bg-primary text-white shadow-xs"
                      : "text-primary/70 hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>5. รหัสผ่าน, แจ้งเตือน LINE & สำรองข้อมูล</span>
                </button>
              </div>

              {/* SUB-TAB 1: STORE INFO & BUTTONS */}
              {settingsSubTab === "info" && (
                <div className="space-y-6">
                  {/* Announcement Banner Box */}
                  <div className="p-5 bg-cream/50 border border-primary/15 rounded-2xl space-y-4 shadow-xs">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-primary/10 pb-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-accent/20 text-accent-dark">
                            <Megaphone className="w-4 h-4" />
                          </span>
                          <h4 className="font-bold text-sm text-primary">แถบประกาศด่วนบนสุดของเว็บ (Top Announcement Banner)</h4>
                        </div>
                        <p className="text-xs text-primary/65">
                          แสดงแถบข้อความสำคัญด้านบนสุดของทุกหน้าเว็บ (เช่น แจ้งวันหยุดเทศกาล, ฤดูทุเรียนลับแล, แจ้งโทรจองโต๊ะด่วน)
                        </p>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={settings.announcement_enabled === "1"}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            announcement_enabled: e.target.checked ? "1" : "0"
                          }))}
                          className="w-4 h-4 rounded text-accent focus:ring-accent accent-accent cursor-pointer"
                        />
                        <span className="text-xs font-bold text-primary">
                          {settings.announcement_enabled === "1" ? "🟢 เปิดใช้งานประกาศ" : "⚪ ปิดประกาศ"}
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-primary mb-1">
                          ข้อความประกาศ
                        </label>
                        <input
                          type="text"
                          value={settings.announcement_text || ""}
                          onChange={(e) => setSettings(prev => ({ ...prev, announcement_text: e.target.value }))}
                          placeholder="เช่น ช่วงเทศกาลสงกรานต์ ร้านเปิดให้บริการตามปกติ แนะนำโทรจองโต๊ะล่วงหน้า"
                          className="w-full px-3 py-2 bg-white border border-primary/20 rounded-xl text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-primary mb-1">
                          ป้ายกำกับประกาศ (Badge)
                        </label>
                        <input
                          type="text"
                          value={settings.announcement_badge || ""}
                          onChange={(e) => setSettings(prev => ({ ...prev, announcement_badge: e.target.value }))}
                          placeholder="เช่น ประกาศจากทางร้าน หรือ ข่าวสาร"
                          className="w-full px-3 py-2 bg-white border border-primary/20 rounded-xl text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-primary mb-1">
                          ลิงก์ปลายทางเมื่อคลิก (ไม่บังคับ)
                        </label>
                        <input
                          type="text"
                          value={settings.announcement_link || ""}
                          onChange={(e) => setSettings(prev => ({ ...prev, announcement_link: e.target.value }))}
                          placeholder="เช่น tel:0956283125 หรือ /about หรือ https://line.me/..."
                          className="w-full px-3 py-2 bg-white border border-primary/20 rounded-xl text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-primary mb-1">
                          ข้อความบนลิงก์
                        </label>
                        <input
                          type="text"
                          value={settings.announcement_link_text || ""}
                          onChange={(e) => setSettings(prev => ({ ...prev, announcement_link_text: e.target.value }))}
                          placeholder="เช่น อ่านเพิ่มเติม หรือ โทรจองโต๊ะทันที"
                          className="w-full px-3 py-2 bg-white border border-primary/20 rounded-xl text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* General Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="restaurant_name" className="block text-xs font-semibold text-primary mb-1">
                    ชื่อร้านอาหาร
                  </label>
                  <input
                    type="text"
                    id="restaurant_name"
                    value={settings.restaurant_name || ""}
                    onChange={e => setSettings(prev => ({ ...prev, restaurant_name: e.target.value }))}
                    className="block w-full px-3 py-2 bg-white border border-primary/10 rounded-xl text-xs sm:text-sm focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-xs font-semibold text-primary mb-1">
                    เบอร์โทรศัพท์สำหรับติดต่อ
                  </label>
                  <input
                    type="text"
                    id="phone"
                    value={settings.phone || ""}
                    onChange={e => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                    className="block w-full px-3 py-2 bg-white border border-primary/10 rounded-xl text-xs sm:text-sm focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="hours" className="block text-xs font-semibold text-primary mb-1">
                    เวลาเปิด-ปิดร้าน
                  </label>
                  <input
                    type="text"
                    id="hours"
                    value={settings.hours || ""}
                    onChange={e => setSettings(prev => ({ ...prev, hours: e.target.value }))}
                    className="block w-full px-3 py-2 bg-white border border-primary/10 rounded-xl text-xs sm:text-sm focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="admin_password" className="block text-xs font-semibold text-primary mb-1">
                    รหัสผ่านเข้าแดชบอร์ดหลังบ้าน (ต้องการเปลี่ยนรหัสผ่านให้กรอกตรงนี้)
                  </label>
                  <input
                    type="text"
                    id="admin_password"
                    value={settings.admin_password || ""}
                    onChange={e => setSettings(prev => ({ ...prev, admin_password: e.target.value }))}
                    className="block w-full px-3 py-2 bg-white border border-primary/10 rounded-xl text-xs sm:text-sm focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-xs font-semibold text-primary mb-1">
                  ที่ตั้งร้าน/ที่อยู่
                </label>
                <input
                  type="text"
                  id="address"
                  value={settings.address || ""}
                  onChange={e => setSettings(prev => ({ ...prev, address: e.target.value }))}
                  className="block w-full px-3 py-2 bg-white border border-primary/10 rounded-xl text-xs sm:text-sm focus:outline-none"
                  required
                />
              </div>
                  {/* Button & Link Configurations */}
              <div className="p-5 bg-primary-dark/5 border border-primary/10 rounded-2xl space-y-4">
                <h3 className="font-bold text-primary text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-accent rounded-full animate-pulse"></span>
                  จัดการปุ่มกดและลิงก์เชื่อมโยงบนเว็บไซต์ (Buttons & Links Manager)
                </h3>
                <p className="text-xs text-primary/70 leading-relaxed">
                  คุณพี่สามารถกำหนดชื่อตัวหนังสือบนปุ่ม และลิงก์ปลายทางของแต่ละปุ่มในหน้าต่างๆ ได้โดยตรงเหมือนใน Google Sites เพื่อควบคุมการนำทางของลูกค้าครับ
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Navbar Button */}
                  <div className="border border-primary/5 p-4 rounded-xl bg-white space-y-3">
                    <h4 className="font-semibold text-xs text-primary">1. ปุ่มบนเมนูด้านบนสุด (Navbar Button)</h4>
                    <div>
                      <label htmlFor="navbar_btn_text" className="block text-[10px] font-semibold text-primary/70 mb-1">ชื่อปุ่ม</label>
                      <input
                        type="text"
                        id="navbar_btn_text"
                        value={settings.navbar_btn_text || "ดูเมนูอาหาร"}
                        onChange={e => setSettings(prev => ({ ...prev, navbar_btn_text: e.target.value }))}
                        className="block w-full px-2 py-1.5 bg-white border border-primary/10 rounded-lg text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="navbar_btn_link" className="block text-[10px] font-semibold text-primary/70 mb-1">ลิงก์ปลายทาง (URL)</label>
                      <input
                        type="text"
                        id="navbar_btn_link"
                        value={settings.navbar_btn_link || "/menu"}
                        onChange={e => setSettings(prev => ({ ...prev, navbar_btn_link: e.target.value }))}
                        className="block w-full px-2 py-1.5 bg-white border border-primary/10 rounded-lg text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Hero Button 1 */}
                  <div className="border border-primary/5 p-4 rounded-xl bg-white space-y-3">
                    <h4 className="font-semibold text-xs text-primary">2. ปุ่มแรกด้านบนสุด (Hero Primary Button)</h4>
                    <div>
                      <label htmlFor="hero_btn1_text" className="block text-[10px] font-semibold text-primary/70 mb-1">ชื่อปุ่ม</label>
                      <input
                        type="text"
                        id="hero_btn1_text"
                        value={settings.hero_btn1_text || "ดูเมนูอาหารทั้งหมด"}
                        onChange={e => setSettings(prev => ({ ...prev, hero_btn1_text: e.target.value }))}
                        className="block w-full px-2 py-1.5 bg-white border border-primary/10 rounded-lg text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="hero_btn1_link" className="block text-[10px] font-semibold text-primary/70 mb-1">ลิงก์ปลายทาง (URL)</label>
                      <input
                        type="text"
                        id="hero_btn1_link"
                        value={settings.hero_btn1_link || "/menu"}
                        onChange={e => setSettings(prev => ({ ...prev, hero_btn1_link: e.target.value }))}
                        className="block w-full px-2 py-1.5 bg-white border border-primary/10 rounded-lg text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Hero Button 2 */}
                  <div className="border border-primary/5 p-4 rounded-xl bg-white space-y-3">
                    <h4 className="font-semibold text-xs text-primary">3. ปุ่มที่สองด้านบนสุด (Hero Secondary Button)</h4>
                    <div>
                      <label htmlFor="hero_btn2_text" className="block text-[10px] font-semibold text-primary/70 mb-1">ชื่อปุ่ม</label>
                      <input
                        type="text"
                        id="hero_btn2_text"
                        value={settings.hero_btn2_text || "รู้จักกับเรา & ตำนานลับแล"}
                        onChange={e => setSettings(prev => ({ ...prev, hero_btn2_text: e.target.value }))}
                        className="block w-full px-2 py-1.5 bg-white border border-primary/10 rounded-lg text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="hero_btn2_link" className="block text-[10px] font-semibold text-primary/70 mb-1">ลิงก์ปลายทาง (URL)</label>
                      <input
                        type="text"
                        id="hero_btn2_link"
                        value={settings.hero_btn2_link || "/about"}
                        onChange={e => setSettings(prev => ({ ...prev, hero_btn2_link: e.target.value }))}
                        className="block w-full px-2 py-1.5 bg-white border border-primary/10 rounded-lg text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Featured Dishes Button */}
                  <div className="border border-primary/5 p-4 rounded-xl bg-white space-y-3">
                    <h4 className="font-semibold text-xs text-primary">4. ปุ่มดูเมนูแนะนำเพิ่มเติม (Featured Dishes Button)</h4>
                    <div>
                      <label htmlFor="featured_btn_text" className="block text-[10px] font-semibold text-primary/70 mb-1">ชื่อปุ่ม</label>
                      <input
                        type="text"
                        id="featured_btn_text"
                        value={settings.featured_btn_text || "ดูเมนูอร่อยทั้งหมดเพิ่มเติม →"}
                        onChange={e => setSettings(prev => ({ ...prev, featured_btn_text: e.target.value }))}
                        className="block w-full px-2 py-1.5 bg-white border border-primary/10 rounded-lg text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="featured_btn_link" className="block text-[10px] font-semibold text-primary/70 mb-1">ลิงก์ปลายทาง (URL)</label>
                      <input
                        type="text"
                        id="featured_btn_link"
                        value={settings.featured_btn_link || "/menu"}
                        onChange={e => setSettings(prev => ({ ...prev, featured_btn_link: e.target.value }))}
                        className="block w-full px-2 py-1.5 bg-white border border-primary/10 rounded-lg text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Google Maps Nav button */}
                  <div className="border border-primary/5 p-4 rounded-xl bg-white space-y-3 sm:col-span-2">
                    <h4 className="font-semibold text-xs text-primary">5. ปุ่มเปิดแผนที่นำทาง (Google Maps Button ในส่วนติดต่อเรา)</h4>
                    <div>
                      <label htmlFor="contact_btn_text" className="block text-[10px] font-semibold text-primary/70 mb-1">ชื่อปุ่ม</label>
                      <input
                        type="text"
                        id="contact_btn_text"
                        value={settings.contact_btn_text || "เปิด Google Maps นำทางมาร้าน"}
                        onChange={e => setSettings(prev => ({ ...prev, contact_btn_text: e.target.value }))}
                        className="block w-full px-2 py-1.5 bg-white border border-primary/10 rounded-xl text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
                  
              <div className="flex justify-end pt-4 border-t border-primary/5">
                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="flex items-center gap-1.5 px-6 py-3 bg-primary hover:bg-primary-light text-white rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow"
                >
                  <Save className="w-4 h-4" />
                  {settingsLoading ? "กำลังบันทึก..." : "บันทึกการตั้งค่าทั้งหมด"}
                </button>
              </div>
                </div>
              )}

              {/* SUB-TAB 2: APPEARANCE & IMAGES */}
              {settingsSubTab === "appearance" && (
                <div className="space-y-6">
                  {/* Theme Settings */}
              <div className="p-5 bg-primary-dark/5 border border-primary/10 rounded-2xl space-y-4">
                <h3 className="font-bold text-primary text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-accent rounded-full"></span>
                  ปรับแต่งโทนสีและพื้นหลังของเว็บไซต์ (Theme Colors)
                </h3>
                <p className="text-xs text-primary/70 leading-relaxed">
                  คุณพี่สามารถเลือกโทนสีหลักและสีพื้นหลังของร้านได้ตามที่ต้องการครับ ระบบจะปรับเฉดสีเข้ม/อ่อนที่เข้ากันให้อัตโนมัติและแสดงผลแบบไดนามิกทั่วทั้งเว็บไซต์
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label htmlFor="theme_primary_color" className="block text-[10px] font-semibold text-primary mb-1">
                      สีหลักเรือนไม้ (Primary Color)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        id="theme_primary_color"
                        value={settings.theme_primary_color || "#46260f"}
                        onChange={e => setSettings(prev => ({ ...prev, theme_primary_color: e.target.value }))}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-primary/15 p-0"
                      />
                      <input
                        type="text"
                        value={settings.theme_primary_color || "#46260f"}
                        onChange={e => setSettings(prev => ({ ...prev, theme_primary_color: e.target.value }))}
                        className="w-16 px-1.5 py-1 bg-white border border-primary/10 rounded-lg text-[10px] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="theme_accent" className="block text-[10px] font-semibold text-primary mb-1">
                      สีทองเน้นย้ำ (Accent Color)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        id="theme_accent"
                        value={settings.theme_accent || "#d4a373"}
                        onChange={e => setSettings(prev => ({ ...prev, theme_accent: e.target.value }))}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-primary/15 p-0"
                      />
                      <input
                        type="text"
                        value={settings.theme_accent || "#d4a373"}
                        onChange={e => setSettings(prev => ({ ...prev, theme_accent: e.target.value }))}
                        className="w-16 px-1.5 py-1 bg-white border border-primary/10 rounded-lg text-[10px] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="theme_warm_bg" className="block text-[10px] font-semibold text-primary mb-1">
                      สีพื้นหลังหลัก (Background Color)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        id="theme_warm_bg"
                        value={settings.theme_warm_bg || "#faf5f0"}
                        onChange={e => setSettings(prev => ({ ...prev, theme_warm_bg: e.target.value }))}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-primary/15 p-0"
                      />
                      <input
                        type="text"
                        value={settings.theme_warm_bg || "#faf5f0"}
                        onChange={e => setSettings(prev => ({ ...prev, theme_warm_bg: e.target.value }))}
                        className="w-16 px-1.5 py-1 bg-white border border-primary/10 rounded-lg text-[10px] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="theme_cream" className="block text-[10px] font-semibold text-primary mb-1">
                      สีพื้นกล่องอาหาร (Card/Box Cream)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        id="theme_cream"
                        value={settings.theme_cream || "#fefdf9"}
                        onChange={e => setSettings(prev => ({ ...prev, theme_cream: e.target.value }))}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-primary/15 p-0"
                      />
                      <input
                        type="text"
                        value={settings.theme_cream || "#fefdf9"}
                        onChange={e => setSettings(prev => ({ ...prev, theme_cream: e.target.value }))}
                        className="w-16 px-1.5 py-1 bg-white border border-primary/10 rounded-lg text-[10px] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
                  {/* Homepage Settings */}
              <div className="p-5 bg-primary-dark/5 border border-primary/10 rounded-2xl space-y-4">
                <h3 className="font-bold text-primary text-sm">
                  ปรับแต่งหน้าแรก & รูปภาพร้าน (Customize Homepage)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 border-b border-primary/5 pb-4 mb-2">
                    <label htmlFor="brand_logo" className="block text-xs font-semibold text-primary mb-1">
                      โลโก้ของแบรนด์ (Brand Logo - แสดงมุมซ้ายบนสุดของเว็บ)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                      <div className="flex-1 w-full">
                        <input
                          type="text"
                          id="brand_logo"
                          value={settings.brand_logo || ""}
                          onChange={e => setSettings(prev => ({ ...prev, brand_logo: e.target.value }))}
                          placeholder="อัปโหลดไฟล์ด้านขวา หรือระบุลิงก์โลโก้"
                          className="block w-full px-3 py-2 bg-white border border-primary/10 rounded-xl text-xs sm:text-sm focus:outline-none"
                        />
                      </div>
                      <div className="relative shrink-0 w-full sm:w-auto">
                        <input
                          type="file"
                          accept="image/*"
                          id="logo-image-upload"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setSettingsLoading(true);
                            setSettingsMsg("");
                            await handleFileUpload(
                              file,
                              async (url) => {
                                setSettings(prev => ({ ...prev, brand_logo: url }));
                                // Auto-save immediately to database
                                try {
                                  await fetch("/api/admin/settings", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ brand_logo: url }),
                                  });
                                  setSettingsMsg("อัปโหลดและบันทึกโลโก้แบรนด์สำเร็จแล้ว! (รีเฟรชหน้าหลักของลูกค้าเพื่อดูผลได้ทันที)");
                                  router.refresh();
                                } catch (dbErr) {
                                  setSettingsMsg("อัปโหลดสำเร็จ แต่ไม่สามารถบันทึกลงฐานข้อมูลได้ กรุณากดปุ่มบันทึกการตั้งค่าที่ด้านล่าง");
                                }
                                setSettingsLoading(false);
                              },
                              (err) => {
                                setSettingsMsg(`เกิดข้อผิดพลาดในการอัปโหลด: ${err}`);
                                setSettingsLoading(false);
                              }
                            );
                          }}
                        />
                        <label
                          htmlFor="logo-image-upload"
                          className="flex items-center justify-center gap-1.5 px-4 py-2 border border-primary/20 hover:border-primary/40 bg-white hover:bg-primary/5 text-primary rounded-xl text-xs font-semibold cursor-pointer transition-all w-full sm:w-auto text-center"
                        >
                          <Plus className="w-4 h-4" />
                          <span>อัปโหลดโลโก้</span>
                        </label>
                      </div>
                    </div>
                    {settings.brand_logo && (
                      <div className="mt-2 relative w-20 h-20 rounded-lg overflow-hidden border border-primary/10 bg-primary/5 flex items-center justify-center p-1">
                        <img src={settings.brand_logo} alt="Preview Logo" className="max-w-full max-h-full object-contain" />
                      </div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="home_hero_image" className="block text-xs font-semibold text-primary mb-1">
                      รูปภาพปกด้านบนสุด (Main Banner / Hero Image)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                      <div className="flex-1 w-full">
                        <input
                          type="text"
                          id="home_hero_image"
                          value={settings.home_hero_image || ""}
                          onChange={e => setSettings(prev => ({ ...prev, home_hero_image: e.target.value }))}
                          placeholder="อัปโหลดไฟล์ด้านขวา หรือระบุลิงก์รูปภาพ"
                          className="block w-full px-3 py-2 bg-white border border-primary/10 rounded-xl text-xs sm:text-sm focus:outline-none"
                        />
                      </div>
                      <div className="relative shrink-0 w-full sm:w-auto">
                        <input
                          type="file"
                          accept="image/*"
                          id="hero-image-upload"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setSettingsLoading(true);
                            setSettingsMsg("");
                            await handleFileUpload(
                              file,
                              async (url) => {
                                setSettings(prev => ({ ...prev, home_hero_image: url }));
                                // Auto-save immediately to database
                                try {
                                  await fetch("/api/admin/settings", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ home_hero_image: url }),
                                  });
                                  setSettingsMsg("อัปโหลดและบันทึกรูปภาพปกด้านบนสุดสำเร็จแล้ว! (กรุณารีเฟรชหน้าเว็บลูกค้าเพื่อดูผลลัพธ์ใหม่)");
                                  router.refresh();
                                } catch (dbErr) {
                                  setSettingsMsg("อัปโหลดสำเร็จ แต่ไม่สามารถบันทึกลงฐานข้อมูลได้ กรุณากดปุ่มบันทึกการตั้งค่าที่ด้านล่าง");
                                }
                                setSettingsLoading(false);
                              },
                              (err) => {
                                setSettingsMsg(`เกิดข้อผิดพลาดในการอัปโหลด: ${err}`);
                                setSettingsLoading(false);
                              }
                            );
                          }}
                        />
                        <label
                          htmlFor="hero-image-upload"
                          className="flex items-center justify-center gap-1.5 px-4 py-2 border border-primary/20 hover:border-primary/40 bg-white hover:bg-primary/5 text-primary rounded-xl text-xs font-semibold cursor-pointer transition-all w-full sm:w-auto text-center"
                        >
                          <Plus className="w-4 h-4" />
                          <span>อัปโหลดรูปภาพ</span>
                        </label>
                      </div>
                    </div>
                    {settings.home_hero_image && (
                      <div className="mt-2 relative w-32 h-20 rounded-lg overflow-hidden border border-primary/10">
                        <img src={settings.home_hero_image} alt="Preview Hero" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="home_about_image" className="block text-xs font-semibold text-primary mb-1">
                      รูปภาพเรื่องราวข้างล่าง (Story Section Image)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                      <div className="flex-1 w-full">
                        <input
                          type="text"
                          id="home_about_image"
                          value={settings.home_about_image || ""}
                          onChange={e => setSettings(prev => ({ ...prev, home_about_image: e.target.value }))}
                          placeholder="อัปโหลดไฟล์ด้านขวา หรือระบุลิงก์รูปภาพ"
                          className="block w-full px-3 py-2 bg-white border border-primary/10 rounded-xl text-xs sm:text-sm focus:outline-none"
                        />
                      </div>
                      <div className="relative shrink-0 w-full sm:w-auto">
                        <input
                          type="file"
                          accept="image/*"
                          id="about-image-upload"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setSettingsLoading(true);
                            setSettingsMsg("");
                            await handleFileUpload(
                              file,
                              async (url) => {
                                setSettings(prev => ({ ...prev, home_about_image: url }));
                                // Auto-save immediately to database
                                try {
                                  await fetch("/api/admin/settings", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ home_about_image: url }),
                                  });
                                  setSettingsMsg("อัปโหลดและบันทึกรูปภาพเรื่องราวข้างล่างสำเร็จแล้ว! (กรุณารีเฟรชหน้าเว็บลูกค้าเพื่อดูผลลัพธ์ใหม่)");
                                  router.refresh();
                                } catch (dbErr) {
                                  setSettingsMsg("อัปโหลดสำเร็จ แต่ไม่สามารถบันทึกลงฐานข้อมูลได้ กรุณากดปุ่มบันทึกการตั้งค่าที่ด้านล่าง");
                                }
                                setSettingsLoading(false);
                              },
                              (err) => {
                                setSettingsMsg(`เกิดข้อผิดพลาดในการอัปโหลด: ${err}`);
                                setSettingsLoading(false);
                              }
                            );
                          }}
                        />
                        <label
                          htmlFor="about-image-upload"
                          className="flex items-center justify-center gap-1.5 px-4 py-2 border border-primary/20 hover:border-primary/40 bg-white hover:bg-primary/5 text-primary rounded-xl text-xs font-semibold cursor-pointer transition-all w-full sm:w-auto text-center"
                        >
                          <Plus className="w-4 h-4" />
                          <span>อัปโหลดรูปภาพ</span>
                        </label>
                      </div>
                    </div>
                    {settings.home_about_image && (
                      <div className="mt-2 relative w-32 h-20 rounded-lg overflow-hidden border border-primary/10">
                        <img src={settings.home_about_image} alt="Preview About" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="restaurant_desc" className="block text-xs font-semibold text-primary mb-1">
                      คำอธิบายร้านสั้นๆ หน้าแรก (Restaurant Description)
                    </label>
                    <textarea
                      id="restaurant_desc"
                      value={settings.restaurant_desc || ""}
                      onChange={e => setSettings(prev => ({ ...prev, restaurant_desc: e.target.value }))}
                      className="block w-full px-3 py-2 bg-white border border-primary/10 rounded-xl text-xs sm:text-sm focus:outline-none h-20 resize-none"
                    />
                  </div>
                </div>
              </div>
                  
              <div className="flex justify-end pt-4 border-t border-primary/5">
                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="flex items-center gap-1.5 px-6 py-3 bg-primary hover:bg-primary-light text-white rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow"
                >
                  <Save className="w-4 h-4" />
                  {settingsLoading ? "กำลังบันทึก..." : "บันทึกการตั้งค่าทั้งหมด"}
                </button>
              </div>
                </div>
              )}

              {/* SUB-TAB 3: SOCIAL MEDIA & MAPS */}
              {settingsSubTab === "social" && (
                <div className="space-y-6">
                  {/* Social Links Settings */}
              <div className="p-5 bg-primary-dark/5 border border-primary/10 rounded-2xl space-y-4">
                <h3 className="font-bold text-primary text-sm">
                  ลิงก์โซเชียลมีเดีย & รีวิวร้าน (Social Links)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="facebook_url" className="block text-xs font-semibold text-primary mb-1">
                      ลิงก์เพจ Facebook
                    </label>
                    <input
                      type="text"
                      id="facebook_url"
                      value={settings.facebook_url || ""}
                      onChange={e => setSettings(prev => ({ ...prev, facebook_url: e.target.value }))}
                      className="block w-full px-3 py-2 bg-white border border-primary/10 rounded-xl text-xs sm:text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="tiktok_url" className="block text-xs font-semibold text-primary mb-1">
                      ลิงก์ TikTok
                    </label>
                    <input
                      type="text"
                      id="tiktok_url"
                      value={settings.tiktok_url || ""}
                      onChange={e => setSettings(prev => ({ ...prev, tiktok_url: e.target.value }))}
                      className="block w-full px-3 py-2 bg-white border border-primary/10 rounded-xl text-xs sm:text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="google_reviews_url" className="block text-xs font-semibold text-primary mb-1">
                      ลิงก์หน้าเขียนรีวิว Google (Google Review)
                    </label>
                    <input
                      type="text"
                      id="google_reviews_url"
                      value={settings.google_reviews_url || ""}
                      onChange={e => setSettings(prev => ({ ...prev, google_reviews_url: e.target.value }))}
                      className="block w-full px-3 py-2 bg-white border border-primary/10 rounded-xl text-xs sm:text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="google_maps_url" className="block text-xs font-semibold text-primary mb-1">
                      ลิงก์แผนที่นำทาง Google Maps
                    </label>
                    <input
                      type="text"
                      id="google_maps_url"
                      value={settings.google_maps_url || ""}
                      onChange={e => setSettings(prev => ({ ...prev, google_maps_url: e.target.value }))}
                      className="block w-full px-3 py-2 bg-white border border-primary/10 rounded-xl text-xs sm:text-sm focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="youtube_url" className="block text-xs font-semibold text-primary mb-1">
                      ลิงก์ช่อง YouTube
                    </label>
                    <input
                      type="text"
                      id="youtube_url"
                      value={settings.youtube_url || ""}
                      onChange={e => setSettings(prev => ({ ...prev, youtube_url: e.target.value }))}
                      className="block w-full px-3 py-2 bg-white border border-primary/10 rounded-xl text-xs sm:text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>
                  
              <div className="flex justify-end pt-4 border-t border-primary/5">
                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="flex items-center gap-1.5 px-6 py-3 bg-primary hover:bg-primary-light text-white rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow"
                >
                  <Save className="w-4 h-4" />
                  {settingsLoading ? "กำลังบันทึก..." : "บันทึกการตั้งค่าทั้งหมด"}
                </button>
              </div>
                </div>
              )}

              {/* SUB-TAB 4: PAGE BUILDER & LAYOUT */}
              {settingsSubTab === "layout" && (
                <div className="space-y-6">
                  {/* Web Layout & Page Builder */}
              <div className="p-5 bg-primary-dark/5 border border-primary/10 rounded-2xl space-y-6">
                <h3 className="font-bold text-primary text-sm flex items-center gap-2 font-thai">
                  <Layout className="w-4.5 h-4.5 text-accent" />
                  ปรับแต่งโครงสร้างเลย์เอาต์หน้าเว็บ (Web Layout & Page Builder)
                </h3>
                <p className="text-xs text-primary/70 leading-relaxed font-thai">
                  คุณพี่สามารถจัดลำดับเนื้อหาก่อน-หลัง เปิด/ปิดส่วนเนื้อหาต่างๆ และเลือกรูปแบบการจัดวางสำหรับหน้าร้านและหน้าเมนูอาหารได้ตามใจชอบเลยครับ
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Homepage Layout Builder */}
                  <div className="border border-primary/5 p-4 rounded-xl bg-white space-y-4">
                    <h4 className="font-semibold text-xs text-primary flex items-center gap-1.5 border-b border-primary/5 pb-2 font-thai">
                      <span>1. ลำดับเนื้อหาหน้าแรก (Homepage Section Order)</span>
                    </h4>
                    <p className="text-[10px] text-primary/60 font-thai">กดปุ่มขึ้น/ลงเพื่อย้ายตำแหน่ง และสลับไอคอนดวงตาเพื่อแสดงหรือซ่อนส่วนนั้นๆ ครับ</p>
                    
                    <div className="space-y-2 font-thai">
                      {(() => {
                        const orderStr = settings.homepage_sections_order || "intro,featured,seasonal,social,contact";
                        const arr = orderStr.split(",").map(s => s.trim()).filter(Boolean);
                        const sectionNames: Record<string, string> = {
                          intro: "เรื่องราวและประวัติร้าน (Story / About)",
                          featured: "เมนูเด่นแนะนำประจำร้าน (Featured Dishes)",
                          seasonal: "เมนูพิเศษตามฤดูกาล (Seasonal Specialties)",
                          social: "กิจกรรมและรีวิวโซเชียลมีเดีย (Social Updates)",
                          contact: "แผนที่และการติดต่อร้าน (Map & Contact)"
                        };

                        return arr.map((key, idx) => {
                          const isShow = settings[`home_section_${key}_show`] !== "0";
                          return (
                            <div 
                              key={key} 
                              draggable
                              onDragStart={(e) => handleDragStart(e, idx)}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, idx)}
                              className={`flex items-center justify-between p-2.5 bg-cream/40 hover:bg-cream border border-primary/5 rounded-xl text-xs cursor-grab active:cursor-grabbing transition-all ${draggedIndex === idx ? 'opacity-40 border-accent' : ''}`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <GripVertical className="w-3.5 h-3.5 text-primary/45 shrink-0" />
                                <span className="font-semibold text-primary truncate max-w-[160px]">
                                  {idx + 1}. {sectionNames[key] || key}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {/* Toggle visibility */}
                                <button
                                  type="button"
                                  onClick={() => setSettings(prev => ({
                                    ...prev,
                                    [`home_section_${key}_show`]: isShow ? "0" : "1"
                                  }))}
                                  className={`p-1 rounded hover:bg-primary/5 cursor-pointer transition-colors ${isShow ? 'text-primary' : 'text-primary/30'}`}
                                  title={isShow ? "ซ่อน" : "แสดง"}
                                >
                                  {isShow ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                                {/* Move up */}
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveSection(idx, "up")}
                                  className="p-1 rounded hover:bg-primary/5 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed text-primary"
                                  title="เลื่อนขึ้น"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </button>
                                {/* Move down */}
                                <button
                                  type="button"
                                  disabled={idx === arr.length - 1}
                                  onClick={() => handleMoveSection(idx, "down")}
                                  className="p-1 rounded hover:bg-primary/5 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed text-primary"
                                  title="เลื่อนลง"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Menu Page Layout Builder */}
                  <div className="border border-primary/5 p-4 rounded-xl bg-white space-y-4 font-thai">
                    <h4 className="font-semibold text-xs text-primary border-b border-primary/5 pb-2 font-thai">
                      2. ตั้งค่าหน้าเมนูอาหาร (Menu Page Layout Settings)
                    </h4>
                    
                    <div className="space-y-3.5">
                      {/* Menu Page Style select */}
                      <div>
                        <label htmlFor="menu_page_layout" className="block text-[10px] font-semibold text-primary/70 mb-1">
                          รูปแบบการแสดงรายการอาหาร (Menu Page Style)
                        </label>
                        <select
                          id="menu_page_layout"
                          value={settings.menu_page_layout || "grid"}
                          onChange={e => setSettings(prev => ({ ...prev, menu_page_layout: e.target.value }))}
                          className="block w-full px-2.5 py-1.5 bg-white border border-primary/10 rounded-lg text-xs focus:outline-none"
                        >
                          <option value="grid">ตารางรูปภาพทันสมัย (Modern Image Grid)</option>
                          <option value="classic">สมุดรายการข้อความคลาสสิก (Classic Text Booklet)</option>
                        </select>
                      </div>

                      {/* Toggles for Header and Search */}
                      <div className="grid grid-cols-2 gap-4">
                        <label className="flex items-center gap-2 p-2 bg-cream/20 border border-primary/5 rounded-lg cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={settings.menu_page_header_show !== "0"}
                            onChange={e => setSettings(prev => ({ ...prev, menu_page_header_show: e.target.checked ? "1" : "0" }))}
                            className="rounded text-accent focus:ring-accent w-4 h-4"
                          />
                          <span className="text-[10px] font-semibold text-primary">แสดงหัวข้อหน้าเมนู</span>
                        </label>
                        <label className="flex items-center gap-2 p-2 bg-cream/20 border border-primary/5 rounded-lg cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={settings.menu_page_search_show !== "0"}
                            onChange={e => setSettings(prev => ({ ...prev, menu_page_search_show: e.target.checked ? "1" : "0" }))}
                            className="rounded text-accent focus:ring-accent w-4 h-4"
                          />
                          <span className="text-[10px] font-semibold text-primary">แสดงช่องค้นหาและตัวกรอง</span>
                        </label>
                      </div>

                      {/* Menu Categories Order List */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-semibold text-primary/70">
                          ลำดับแท็บหมวดหมู่อาหาร (Menu Categories Tab Order)
                        </label>
                        <div className="space-y-1 max-h-[140px] overflow-y-auto border border-primary/5 rounded-lg p-1.5 bg-cream/10">
                          {(() => {
                            const catsOrderStr = settings.menu_categories_order || "เซทขันโตก,ข้าวพันผัก,อาหารพื้นบ้าน,จานเดียว,กับข้าว,ส้มตำ,ของหวาน & ทานเล่น,เครื่องดื่ม";
                            const cats = catsOrderStr.split(",").map(c => c.trim()).filter(Boolean);

                            return cats.map((cat, idx) => (
                              <div 
                                key={cat} 
                                draggable
                                onDragStart={(e) => handleCatDragStart(e, idx)}
                                onDragOver={handleCatDragOver}
                                onDrop={(e) => handleCatDrop(e, idx)}
                                className={`flex items-center justify-between py-1.5 px-2.5 bg-white hover:bg-cream rounded border border-primary/5 text-[10px] cursor-grab active:cursor-grabbing transition-all ${draggedCatIndex === idx ? 'opacity-40 border-accent' : ''}`}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <GripVertical className="w-3 h-3 text-primary/45 shrink-0" />
                                  <span className="font-medium text-primary/80 truncate">{idx + 1}. {cat}</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 text-primary">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveCategory(idx, "up")}
                                    className="p-0.5 rounded hover:bg-primary/5 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                                  >
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === cats.length - 1}
                                    onClick={() => handleMoveCategory(idx, "down")}
                                    className="p-0.5 rounded hover:bg-primary/5 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                                  >
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Homepage Section Headers & Teasers */}
              <div id="admin-section-headers" className="p-5 bg-primary-dark/5 border border-primary/10 rounded-2xl space-y-6">
                <div>
                  <h3 className="font-bold text-primary text-sm flex items-center gap-2 font-thai">
                    <Sparkles className="w-4.5 h-4.5 text-accent" />
                    <span>หัวข้อและข้อความประจำส่วนของหน้าแรก (Homepage Section Headers & Teasers)</span>
                  </h3>
                  <p className="text-xs text-primary/70 leading-relaxed font-thai">
                    กำหนดป้ายข้อความ (Badge), ชื่อหัวข้อหลัก และคำบรรยายของแต่ละหมวดหมู่บนหน้าแรกได้อย่างอิสระ
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 1. Featured Dishes Section */}
                  <div className="border border-primary/10 p-4 rounded-xl bg-white space-y-4">
                    <div className="flex items-center gap-2 border-b border-primary/5 pb-2">
                      <Utensils className="w-4 h-4 text-accent" />
                      <h4 className="font-bold text-xs text-primary">ส่วนเมนูเด่นประจำร้าน (Featured Dishes)</h4>
                    </div>
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-semibold text-primary mb-1">
                          ป้ายกำกับด้านบน (Badge)
                        </label>
                        <input
                          type="text"
                          placeholder="ของกิ๋นลำเมืองลับแล"
                          value={settings.home_featured_badge ?? "ของกิ๋นลำเมืองลับแล"}
                          onChange={(e) => setSettings(prev => ({ ...prev, home_featured_badge: e.target.value }))}
                          className="w-full px-3 py-2 bg-cream/15 border border-primary/15 rounded-xl text-primary focus:outline-none focus:border-accent"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-primary mb-1">
                          หัวข้อหลัก (Section Title)
                        </label>
                        <input
                          type="text"
                          placeholder="จานเด็ดประจำบ้าน ที่อยากให้ลองชิม"
                          value={settings.home_featured_title ?? "จานเด็ดประจำบ้าน ที่อยากให้ลองชิม"}
                          onChange={(e) => setSettings(prev => ({ ...prev, home_featured_title: e.target.value }))}
                          className="w-full px-3 py-2 bg-cream/15 border border-primary/15 rounded-xl text-primary focus:outline-none focus:border-accent"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-primary mb-1">
                          ข้อความบนปุ่มลิงก์ดูทั้งหมด (Button Text)
                        </label>
                        <input
                          type="text"
                          placeholder="ดูเมนูอร่อยทั้งหมดเพิ่มเติม →"
                          value={settings.featured_btn_text ?? "ดูเมนูอร่อยทั้งหมดเพิ่มเติม →"}
                          onChange={(e) => setSettings(prev => ({ ...prev, featured_btn_text: e.target.value }))}
                          className="w-full px-3 py-2 bg-cream/15 border border-primary/15 rounded-xl text-primary focus:outline-none focus:border-accent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Seasonal Dishes Section */}
                  <div className="border border-primary/10 p-4 rounded-xl bg-white space-y-4">
                    <div className="flex items-center gap-2 border-b border-primary/5 pb-2">
                      <Leaf className="w-4 h-4 text-accent" />
                      <h4 className="font-bold text-xs text-primary">ส่วนเมนูตามฤดูกาล (Seasonal Specialties)</h4>
                    </div>
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-semibold text-primary mb-1">
                          ป้ายกำกับด้านบน (Badge)
                        </label>
                        <input
                          type="text"
                          placeholder="ของอร่อยตามฤดูกาล"
                          value={settings.home_seasonal_badge ?? "ของอร่อยตามฤดูกาล"}
                          onChange={(e) => setSettings(prev => ({ ...prev, home_seasonal_badge: e.target.value }))}
                          className="w-full px-3 py-2 bg-cream/15 border border-primary/15 rounded-xl text-primary focus:outline-none focus:border-accent"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-primary mb-1">
                          หัวข้อหลัก (Section Title)
                        </label>
                        <input
                          type="text"
                          placeholder="วัตถุดิบสดใหม่ รสชาติตามฤดู"
                          value={settings.home_seasonal_title ?? "วัตถุดิบสดใหม่ รสชาติตามฤดู"}
                          onChange={(e) => setSettings(prev => ({ ...prev, home_seasonal_title: e.target.value }))}
                          className="w-full px-3 py-2 bg-cream/15 border border-primary/15 rounded-xl text-primary focus:outline-none focus:border-accent"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-primary mb-1">
                          ข้อความบนปุ่มลิงก์ดูทั้งหมด (Button Text)
                        </label>
                        <input
                          type="text"
                          placeholder="ดูเมนูพิเศษตามฤดูกาลเพิ่มเติม →"
                          value={settings.seasonal_btn_text ?? "ดูเมนูพิเศษตามฤดูกาลเพิ่มเติม →"}
                          onChange={(e) => setSettings(prev => ({ ...prev, seasonal_btn_text: e.target.value }))}
                          className="w-full px-3 py-2 bg-cream/15 border border-primary/15 rounded-xl text-primary focus:outline-none focus:border-accent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Book Section */}
                  <div className="border border-primary/10 p-4 rounded-xl bg-white space-y-4 md:col-span-2">
                    <div className="flex items-center gap-2 border-b border-primary/5 pb-2">
                      <BookOpen className="w-4 h-4 text-accent" />
                      <h4 className="font-bold text-xs text-primary">ส่วนตำราลับแลง ๓๒ ตอน (Heritage Book Teaser)</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block font-semibold text-primary mb-1">
                          ป้ายกำกับด้านบน (Badge)
                        </label>
                        <input
                          type="text"
                          placeholder="บันทึกเรื่องเล่าเมืองลับแล"
                          value={settings.home_book_badge ?? "บันทึกเรื่องเล่าเมืองลับแล"}
                          onChange={(e) => setSettings(prev => ({ ...prev, home_book_badge: e.target.value }))}
                          className="w-full px-3 py-2 bg-cream/15 border border-primary/15 rounded-xl text-primary focus:outline-none focus:border-accent"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-primary mb-1">
                          หัวข้อหลัก (Section Title)
                        </label>
                        <input
                          type="text"
                          placeholder="ตำราลับแลง (๓๒ ตอน)"
                          value={settings.home_book_title ?? "ตำราลับแลง (๓๒ ตอน)"}
                          onChange={(e) => setSettings(prev => ({ ...prev, home_book_title: e.target.value }))}
                          className="w-full px-3 py-2 bg-cream/15 border border-primary/15 rounded-xl text-primary focus:outline-none focus:border-accent"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-primary mb-1">
                          ข้อความบนปุ่มอ่านบทความ (Button Text)
                        </label>
                        <input
                          type="text"
                          placeholder="เปิดอ่านตำราลับแลง (๓๒ ตอน)"
                          value={settings.home_book_btn_text ?? "เปิดอ่านตำราลับแลง (๓๒ ตอน)"}
                          onChange={(e) => setSettings(prev => ({ ...prev, home_book_btn_text: e.target.value }))}
                          className="w-full px-3 py-2 bg-cream/15 border border-primary/15 rounded-xl text-primary focus:outline-none focus:border-accent"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-primary mb-1">
                          คำบรรยายสรุป (Description)
                        </label>
                        <textarea
                          rows={2}
                          placeholder="เรื่องเล่าของคน ๔ รุ่น บันทึกครัวโบราณ..."
                          value={settings.home_book_description ?? "เรื่องเล่าของคน ๔ รุ่น บันทึกครัวโบราณ ที่มาของข้าวพันผัก พริกแกงตำมือ และวิถีชีวิตคนเมืองลับแลที่เขียนส่งต่อจากใจ"}
                          onChange={(e) => setSettings(prev => ({ ...prev, home_book_description: e.target.value }))}
                          className="w-full px-3 py-2 bg-cream/15 border border-primary/15 rounded-xl text-primary focus:outline-none focus:border-accent resize-y"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Testimonial & Review Card */}
              <div id="admin-testimonial-card" className="p-5 bg-primary-dark/5 border border-primary/10 rounded-2xl space-y-5 font-thai">
                <div>
                  <h3 className="font-bold text-primary text-sm flex items-center gap-2">
                    <Quote className="w-4.5 h-4.5 text-accent" />
                    <span>การ์ดรีวิวและเสียงตอบรับจากลูกค้า (Customer Testimonial & Review Card)</span>
                  </h3>
                  <p className="text-xs text-primary/70 leading-relaxed">
                    ปรับแต่งการ์ดรีวิวความประทับใจที่แสดงบนหน้าแรก ลิงก์ตรงไปยังหน้า Google Maps Reviews ของร้าน
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-primary mb-1">
                      ป้ายคะแนน / แพลตฟอร์ม (Badge)
                    </label>
                    <input
                      type="text"
                      placeholder="★ Google Maps"
                      value={settings.home_testimonial_badge ?? "★ Google Maps"}
                      onChange={(e) => setSettings(prev => ({ ...prev, home_testimonial_badge: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-primary/15 rounded-xl text-primary focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-primary mb-1">
                      ป้ายประเภท (Sub-Badge)
                    </label>
                    <input
                      type="text"
                      placeholder="รีวิวจากลูกค้า"
                      value={settings.home_testimonial_subbadge ?? "รีวิวจากลูกค้า"}
                      onChange={(e) => setSettings(prev => ({ ...prev, home_testimonial_subbadge: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-primary/15 rounded-xl text-primary focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-semibold text-primary mb-1">
                      ข้อความรีวิวความประทับใจ (Review Quote)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="อาหารรสชาติดีมาก บรรยากาศร่มรื่น นั่งกินข้าวในบ้านไม้โบราณแล้วรู้สึกอบอุ่น..."
                      value={settings.home_testimonial_text ?? "อาหารรสชาติดีมาก บรรยากาศร่มรื่น นั่งกินข้าวในบ้านไม้โบราณแล้วรู้สึกอบอุ่น ข้าวพันผักเหนียวนุ่มอร่อยมาก แนะนำเลยค่ะ!"}
                      onChange={(e) => setSettings(prev => ({ ...prev, home_testimonial_text: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-primary/15 rounded-xl text-primary focus:outline-none focus:border-accent resize-y"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-primary mb-1">
                      ชื่อลูกค้า / แหล่งที่มา (Author Signature)
                    </label>
                    <input
                      type="text"
                      placeholder="- รีวิวจากลูกค้าบน Google Maps"
                      value={settings.home_testimonial_author ?? "- รีวิวจากลูกค้าบน Google Maps"}
                      onChange={(e) => setSettings(prev => ({ ...prev, home_testimonial_author: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-primary/15 rounded-xl text-primary focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-primary mb-1">
                      ข้อความบนปุ่มลิงก์ (Button Text)
                    </label>
                    <input
                      type="text"
                      placeholder="อ่านรีวิวบน Google Maps →"
                      value={settings.home_testimonial_btn_text ?? "อ่านรีวิวบน Google Maps →"}
                      onChange={(e) => setSettings(prev => ({ ...prev, home_testimonial_btn_text: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-primary/15 rounded-xl text-primary focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>
                  
              <div className="flex justify-end pt-4 border-t border-primary/5">
                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="flex items-center gap-1.5 px-6 py-3 bg-primary hover:bg-primary-light text-white rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow"
                >
                  <Save className="w-4 h-4" />
                  {settingsLoading ? "กำลังบันทึก..." : "บันทึกการตั้งค่าทั้งหมด"}
                </button>
              </div>
                </div>
              )}


              {/* SUB-TAB 5: SECURITY & LINE NOTIFY */}
              {settingsSubTab === "security" && (
                <div className="space-y-6">
                  {/* Admin Password Card */}
                  <div className="p-5 bg-primary-dark/5 border border-primary/10 rounded-2xl space-y-4">
                    <h3 className="font-bold text-primary text-sm flex items-center gap-2">
                      <ShieldCheck className="w-4.5 h-4.5 text-accent" />
                      ความปลอดภัยและรหัสผ่านเข้าแดชบอร์ด (Admin Password)
                    </h3>
                    <p className="text-xs text-primary/70 leading-relaxed">
                      คุณพี่สามารถเปลี่ยนรหัสผ่านสำหรับเข้าสู่ระบบหลังบ้านได้ที่ช่องนี้ครับ (หากต้องการเปลี่ยน ให้พิมพ์รหัสใหม่แล้วกดบันทึกด้านล่างได้เลยครับ)
                    </p>
                    <div className="max-w-md">
                      <label htmlFor="admin_password_sec" className="block text-xs font-semibold text-primary mb-1">
                        รหัสผ่านเข้าสู่ระบบหลังบ้าน
                      </label>
                      <input
                        type="text"
                        id="admin_password_sec"
                        value={settings.admin_password || ""}
                        onChange={e => setSettings(prev => ({ ...prev, admin_password: e.target.value }))}
                        className="block w-full px-3 py-2 bg-white border border-primary/15 rounded-xl text-xs sm:text-sm focus:outline-none font-mono"
                        required
                      />
                    </div>
                  </div>

                  {/* LINE Notify Setting */}
                  <div className="p-5 bg-accent/5 border border-accent/20 rounded-2xl space-y-4">
                    <h3 className="font-bold text-primary text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-green-600 rounded-full animate-pulse"></span>
                      การเชื่อมต่อระบบแจ้งเตือนไลน์กลุ่ม (LINE Notify Token)
                    </h3>
                    <p className="text-xs text-primary/70 leading-relaxed">
                      เชื่อมต่อเพื่อให้เมื่อลูกค้ากดจองโต๊ะอาหารจากหน้าเว็บ ระบบจะส่งข้อความรายละเอียดการจองตรงเข้ากลุ่มไลน์ของร้านทันที 
                      (คุณสามารถนำ Token มาใส่ที่ช่องด้านล่างเพื่อเปิดใช้งานการแจ้งเตือนได้เลยครับ)
                    </p>
                    <div>
                      <label htmlFor="line_notify_token" className="block text-xs font-semibold text-primary mb-1">
                        LINE Notify Access Token
                      </label>
                      <input
                        type="text"
                        id="line_notify_token"
                        value={settings.line_notify_token || ""}
                        onChange={e => setSettings(prev => ({ ...prev, line_notify_token: e.target.value }))}
                        placeholder="กรอก Access Token (ตัวอย่าง: G5sF8d...)"
                        className="block w-full px-3 py-2 bg-white border border-primary/20 rounded-xl text-xs sm:text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* System Full Backup Card */}
                  <div className="p-5 bg-cream/70 border border-primary/20 rounded-2xl space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <h3 className="font-bold text-primary text-sm flex items-center gap-2">
                          <Download className="w-4.5 h-4.5 text-accent" />
                          สำรองข้อมูลระบบทั้งหมด (Full JSON Data Backup)
                        </h3>
                        <p className="text-xs text-primary/70 leading-relaxed">
                          ดาวน์โหลดข้อมูลทั้งหมดของร้าน (การตั้งค่าร้าน, เมนูอาหารทั้งหมด, บทความตำราลับแลง ๓๒ ตอน, และประวัติการจองโต๊ะ) บันทึกเก็บไว้ในเครื่องของคุณได้ตลอดเวลาเพื่อความปลอดภัยสูงสุด
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleExportBackup}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-light text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
                      >
                        <Download className="w-4 h-4 text-accent" />
                        <span>ดาวน์โหลดสำรองข้อมูล (JSON)</span>
                      </button>
                    </div>
                  </div>

                  
              <div className="flex justify-end pt-4 border-t border-primary/5">
                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="flex items-center gap-1.5 px-6 py-3 bg-primary hover:bg-primary-light text-white rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow"
                >
                  <Save className="w-4 h-4" />
                  {settingsLoading ? "กำลังบันทึก..." : "บันทึกการตั้งค่าทั้งหมด"}
                </button>
              </div>
                </div>
              )}

            </form>
          </div>
        )}

        {/* TAB 5: LIVE PREVIEW TAB */}
        {activeTab === "preview" && (
          <div className="space-y-6 font-thai">
            <div>
              <h2 className="text-xl font-bold text-primary">พรีวิวหน้าร้าน (Live Website Preview)</h2>
              <p className="text-xs text-primary/70">เลือกดูการแสดงผลของหน้าจอคอมพิวเตอร์และมือถือหลังจากกดบันทึกการตั้งค่าแล้วครับ</p>
            </div>

            <div className="p-5 bg-white border border-primary/10 rounded-2xl space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-primary/5 pb-4">
                <div>
                  <h3 className="font-bold text-primary text-sm sm:text-base flex items-center gap-2">
                    <Eye className="w-4.5 h-4.5 text-accent" />
                    จำลองหน้าร้านจริง
                  </h3>
                  <p className="text-[10px] text-primary/70 leading-relaxed font-thai">
                    คุณพี่สามารถสลับหน้าต่างๆ เพื่อพรีวิวการจัดลำดับเลย์เอาต์ ความเข้ากันของโทนสี และความสมบูรณ์บนมือถือได้ตรงนี้ครับ
                  </p>
                </div>
                
                {/* Control Panel: Page Select and Size Toggle */}
                <div className="flex flex-wrap items-center gap-3 text-xs w-full sm:w-auto">
                  {/* Page selector */}
                  <select
                    value={previewUrl}
                    onChange={(e) => setPreviewUrl(e.target.value)}
                    className="px-2.5 py-1.5 bg-cream border border-primary/10 rounded-lg text-xs font-semibold focus:outline-none cursor-pointer text-primary"
                  >
                    <option value="/">หน้าแรก (Home)</option>
                    <option value="/menu">หน้าเมนูอาหาร (Menu)</option>
                    <option value="/about">หน้ารู้จักเรา (About)</option>
                    <option value="/blog">หน้าบทความ (Blog)</option>
                  </select>

                  {/* Size Toggler */}
                  <div className="inline-flex rounded-lg border border-primary/10 p-0.5 bg-cream shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewMode("desktop")}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                        previewMode === "desktop"
                          ? "bg-primary text-white shadow-sm"
                          : "text-primary/70 hover:text-accent"
                      }`}
                    >
                      หน้าจอคอมฯ (Desktop)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode("mobile")}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                        previewMode === "mobile"
                          ? "bg-primary text-white shadow-sm"
                          : "text-primary/70 hover:text-accent"
                      }`}
                    >
                      หน้าจอมือถือ (Mobile)
                    </button>
                  </div>

                  {/* Manual Refresh button */}
                  <button
                    type="button"
                    onClick={() => setIframeKey((prev) => prev + 1)}
                    className="px-3 py-1.5 bg-primary/5 hover:bg-primary/10 text-primary border border-primary/10 rounded-lg text-[10px] font-bold transition-all cursor-pointer shrink-0"
                    title="รีเฟรชหน้าพรีวิว"
                  >
                    รีเฟรชพรีวิว
                  </button>
                </div>
              </div>

              {/* Iframe Viewport Container */}
              <div className="flex justify-center items-center bg-primary-dark/5 p-4 rounded-xl min-h-[400px]">
                {previewMode === "mobile" ? (
                  /* Mobile Emulator Mockup Bezel */
                  <div className="relative mx-auto w-[360px] h-[640px] border-8 border-gray-800 rounded-[32px] shadow-2xl overflow-hidden bg-white flex flex-col shrink-0">
                    {/* Top Speaker/Camera notch mock */}
                    <div className="absolute top-0 inset-x-0 h-4 bg-gray-800 flex justify-center items-center z-20">
                      <div className="w-16 h-2 bg-gray-900 rounded-full" />
                    </div>
                    {/* Screen iframe */}
                    <div className="flex-grow pt-4">
                      <iframe
                        key={`${previewUrl}-${previewMode}-${iframeKey}`}
                        src={previewUrl}
                        className="w-full h-full border-none"
                      />
                    </div>
                    {/* Home Indicator mock */}
                    <div className="h-3.5 bg-gray-800 flex justify-center items-center z-20">
                      <div className="w-24 h-1 bg-gray-900 rounded-full" />
                    </div>
                  </div>
                ) : (
                  /* Desktop Screen View */
                  <div className="w-full h-[600px] border border-primary/10 rounded-xl overflow-hidden bg-white shadow-sm">
                    <iframe
                      key={`${previewUrl}-${previewMode}-${iframeKey}`}
                      src={previewUrl}
                      className="w-full h-full border-none"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        </div>

        {/* Inline Live Preview Panel for large screens (>= 1280px) */}
        {showFloatingPreview && (
          <div className="hidden xl:flex w-[400px] border border-primary/10 bg-cream rounded-3xl overflow-hidden shadow-sm flex-col shrink-0 h-[750px] max-h-[calc(100vh-140px)] sticky top-28">
            {renderPreviewPanelContent()}
          </div>
        )}
      </div>

    </div>

      {/* Semi-transparent Backdrop for Drawer Preview (screens < 1280px) */}
      {showFloatingPreview && (
        <div 
          onClick={() => setShowFloatingPreview(false)}
          className="xl:hidden fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity duration-300"
        />
      )}

      {/* Slide-Drawer Mobile Preview for screens < 1280px */}
      <div
        className={`xl:hidden fixed inset-y-0 right-0 z-50 w-full max-w-md bg-cream border-l border-primary/15 shadow-2xl flex flex-col transition-transform duration-300 transform font-thai ${
          showFloatingPreview ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {renderPreviewPanelContent()}
      </div>
    </div>
  );
}
