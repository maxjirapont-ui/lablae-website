"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronRight, Sparkles, Image as ImageIcon, Heart, ArrowLeft, Maximize2 } from "lucide-react";

export interface StoryData {
  id: "house" | "wood" | "family" | "kitchen";
  emoji: string;
  coverImage?: string;
  badge: string;
  stat: string;
  statLabel: string;
  title: string;
  subtitle: string;
  quote: string;
  quoteAuthor: string;
  paragraphs: string[];
  photos: {
    url: string;
    caption: string;
    tag?: string;
  }[];
  highlights: {
    title: string;
    desc: string;
  }[];
}

export const DEFAULT_STORIES: StoryData[] = [
  {
    id: "house",
    emoji: "🏛️",
    coverImage: "/uploads/1780565008509_ldvq14.JPG",
    badge: "มรดกสถาปัตยกรรม",
    stat: "100+ ปี",
    statLabel: "อายุบ้านไม้",
    title: "บ้านไม้ 100 ปี (เรือนหม่อนน้อย)",
    subtitle: "บ้านไม้สองชั้นหลังใหญ่ ยุคพระศรีพนมมาศวางผังเมืองลับแล",
    quote: "“ที่นี่ไม่ใช่แค่ร้านอาหาร แต่คือบ้านของครอบครัวเราที่ผ่านแดดฝนมาเกินหนึ่งศตวรรษ”",
    quoteAuthor: "ลูกหลานรุ่น 4 ผู้ดูแลเรือน",
    paragraphs: [
      "อายุกว่าหนึ่งศตวรรษ บ้านไม้สองชั้นหลังนี้สร้างขึ้นราว พ.ศ. 2460 กว่า โดย 'พ่อขากลิ้งและแม่ขายอด' ตั้งอยู่หลังวัดป่ายาง ในยุคที่พระศรีพนมมาศเพิ่งวางผังเมืองลับแลเสร็จไม่นาน การสร้างเรือนใหญ่ในยุคนั้นคือการประกาศว่าครอบครัวนี้จะหยั่งรากลึกบนแผ่นดินลับแลแห่งนี้ตลอดไป",
      "ตัวบ้านสร้างด้วยไม้ทั้งหลัง เสาไม้ต้นใหญ่ตั้งอยู่บนฐานหินธรรมชาติ ใต้ถุนยกสูงโปร่งโล่ง ลมเย็นพัดผ่านตลอดวัน ชานพักกว้างขวาง และหลังคาลาดเอียงรับน้ำฝนตามภูมิปัญญาการสร้างบ้านในหุบเขาเมืองลับแล",
      "ในยุคที่เรือนโบราณทั่วเมืองลับแลเริ่มถูกรื้อขายเป็นไม้เก่า เรือนหลังนี้รอดพ้นมาได้เพราะมี 'หม่อนน้อย' (หญิงชราเท้าเปล่าผู้ทอผ้าซิ่นตีนจก) ยืนหยัดอยู่เฝ้าเรือนเพียงลำพังนานหลายสิบปี จนส่งต่อมาถึงรุ่นตาเงิน-ยายจัน และลูกหลานรุ่นปัจจุบัน",
      "วันนี้ เราเปิดใต้ถุนบ้านเป็นร้านอาหาร 'ลำลำลับแล' เพื่อให้บ้านกลับมาหายใจ มีคนเดินขึ้นลง มีเสียงหัวเราะ และต้อนรับผู้มาเยือนเมืองลับแลทุกคน 'เหมือนมากินข้าวบ้านญาติ' ครับ",
    ],
    photos: [
      {
        url: "/uploads/1780565008509_ldvq14.JPG",
        caption: "ป้ายไม้แกะสลัก 'เรือนหม่อนน้อย' โคมล้านนาหลากสี และหน้าต่างไม้โบราณ",
        tag: "ตัวเรือนจริง",
      },
      {
        url: "/uploads/1788435835557_pn69j3.jpg",
        caption: "ใต้ถุนบ้านไม้ เสาไม้โบราณ โต๊ะไม้ และโคมแขวนใต้ถุนที่เปิดรับลมตลอดวัน",
        tag: "ใต้ถุนเรือน",
      },
      {
        url: "/uploads/1780576555949_mol0l7.JPG",
        caption: "จักรยานโบราณและโคมประดับหน้าเรือน สะท้อนวิถีชีวิตดั้งเดิมของชาวลับแล",
        tag: "บรรยากาศหน้าร้าน",
      },
      {
        url: "/uploads/1788435028044_hvewx3.jpg",
        caption: "ซุ้มทางเดินและแสงไฟอบอุ่นยามค่ำคืนของเรือน 100 ปี",
        tag: "บรรยากาศยามเย็น",
      },
    ],
    highlights: [
      { title: "บ้านไม้โบราณทั้งหลัง", desc: "คัดไม้แก่ลายสวย ปลวกมอดไม่กิน ทนทานนานนับศตวรรษ" },
      { title: "เสาตั้งบนฐานหินธรรมชาติ", desc: "ภูมิปัญญาดั้งเดิม ป้องกันความชื้นจากดินขึ้นสู่เนื้อไม้" },
      { title: "ใต้ถุนสูงโปร่งรับลม", desc: "ลมเย็นพัดผ่านตลอดเวลา นั่งทานอาหารสบายแม้ในฤดูร้อน" },
    ],
  },
  {
    id: "wood",
    emoji: "🔨",
    coverImage: "/uploads/1788435835557_pn69j3.jpg",
    badge: "ภูมิปัญญาช่างโบราณ",
    stat: "0 ตัว",
    statLabel: "ไร้ตะปู เข้าเดือยไม้",
    title: "0 ตัว ไร้ตะปู – ภูมิปัญญาช่างไม้ล้านนาโบราณ",
    subtitle: "เข้าเดือย เข้าลิ่ม สลักไม้ขัดกันเอง ไม้ขยับได้ ไม้หายใจได้ จึงอยู่ทนเกินร้อยปี",
    quote: "“ช้ากว่า ยากกว่า แต่ทนทานกว่าเหล็กใดๆ — ปรัชญาของช่างโบราณเมืองลับแล”",
    quoteAuthor: "ภูมิปัญญาช่างสร้างเรือนลับแล",
    paragraphs: [
      "ความมหัศจรรย์ของเรือนหลังนี้คือ 'ไม่ใช้ตะปูเหล็กแม้แต่ตัวเดียว' ในการยึดโครงสร้างหลักของตัวบ้าน",
      "ช่างไม้โบราณใช้ระบบ 'เข้าเดือย เข้าลิ่ม เข้าสลัก' (Mortise and Tenon Joinery) โดยใช้สิ่วและขวานเจาะบากไม้เสา คาน รอด ตง ให้มีเดือยตัวผู้สอดเข้ากับรูเดือยตัวเมียอย่างแนบสนิท แล้วตอกลิ่มไม้แห้งสนิทอัดแน่นขัดไว้",
      "ทำไมถึงทนกว่าตะปูเหล็ก? ในหุบเขาลับแลที่มีความชื้นสูง หากตอกตะปูเหล็ก สนิมจะกัดกินและบวมดันเนื้อไม้แตกหัก แต่การเข้าสลักไม้ ไม้ทุกชิ้นจะยืดหดตัวตามความชื้นและอุณหภูมิไปพร้อมกัน ไม้จึง 'หายใจได้' และแน่นสนิทขึ้นตามกาลเวลา",
      "เมื่อแวะมาที่ร้าน ลองเอามือสัมผัสเสาไม้ต้นใหญ่ และแหงนมองขื่อคานใต้ถุนบ้าน ท่านจะเห็นรอยบากเข้าเดือยของช่างไม้เมื่อ 100 ปีก่อนที่ยังคงทำหน้าที่ค้ำจุนบ้านหลังนี้อย่างแข็งแรงสมบูรณ์",
    ],
    photos: [
      {
        url: "/uploads/1788435835557_pn69j3.jpg",
        caption: "เสาไม้ต้นใหญ่และโครงสร้างขื่อคานใต้ถุน ที่เชื่อมต่อด้วยการเข้าเดือยไร้ตะปู",
        tag: "เสาและขื่อคาน",
      },
      {
        url: "/uploads/1780565008509_ldvq14.JPG",
        caption: "ฝาประกบไม้สักแนวนอนและวงกบหน้าต่างโบราณ สอดรับกันด้วยลิ่มไม้",
        tag: "ฝาเรือนไม้โบราณ",
      },
      {
        url: "/uploads/1780576555949_mol0l7.JPG",
        caption: "ชายคาและซุ้มไม้โบราณที่ยังคงความแข็งแรงแม้เวลาผ่านมากว่า 100 ปี",
        tag: "โครงสร้างหลังคา",
      },
    ],
    highlights: [
      { title: "ไร้ตะปูเหล็ก 100%", desc: "ไม่เกิดสนิม ไม่ดันเนื้อไม้แตก ทนต่อแผ่นดินไหวและลมพายุ" },
      { title: "ไม้หายใจได้", desc: "รอยต่อเข้าเดือยยืดหดตามฤดูกาลได้โดยโครงสร้างไม่พังทลาย" },
      { title: "ลิ่มไม้ขัดเดือย", desc: "เนื้อไม้แกร่งขึ้นตามกาลเวลา ยิ่งอยู่ยิ่งแน่น" },
    ],
  },
  {
    id: "family",
    emoji: "👨‍👩‍👧‍👦",
    coverImage: "/images/menu/khantoke_100years.jpg",
    badge: "มรดก 4 รุ่นคน",
    stat: "4 รุ่นคน",
    statLabel: "สืบทอดรสมือครอบครัว",
    title: "4 รุ่นคน – สายใยและรสมือครอบครัวจากทวดสู่หลาน",
    subtitle: "จากปิ่นโตหน้ารถป๊อปน้อย สู่โต๊ะกับข้าวใต้ถุนเรือนไม้โบราณ",
    quote: "“นี่คือรสมือครอบครัวเรา ไม่ได้อวดว่าเลิศที่สุด แต่รับรองว่าเป็นของจริง ที่เรากินกันมาตั้งแต่ทวด”",
    quoteAuthor: "คำของตาเงิน–ยายจัน",
    paragraphs: [
      "บ้านหลังนี้ไม่ได้มีแค่ตัวบ้านเก่า แต่มีลมหายใจและความทรงจำของครอบครัวเราที่สืบทอดต่อเนื่องกันมาถึง 4 ชั่วอายุคน",
      "รุ่นที่ 1 · ผู้สร้างเรือน: 'พ่อขากลิ้ง กับ แม่ขายอด' — สองท่านผู้บุกเบิกสร้างเรือนไม้ไร้ตะปูหลังนี้หลังวัดป่ายาง วางรากฐานความมั่นคงให้ลูกหลาน",
      "ผู้เฝ้าเรือน: 'หม่อนน้อย' — หญิงชราเท้าเปล่าผู้ใช้ชีวิตบนเรือนใหญ่เพียงลำพัง ทอผ้าซิ่นตีนจกบนกี่ใต้ถุน เลี้ยงหมู เลี้ยงหลาน และยืนหยัดไม่ยอมให้ใครมารื้อขายเรือนเป็นไม้เก่า",
      "รุ่นที่ 3 · ผู้ให้รสมือ: 'ตาเงิน กับ ยายจัน' — ตาทำกับข้าว ยายจัดใส่ปิ่นโต ผูกหน้ารถป๊อปน้อยคู่ใจ ขี่ไปส่งลูกหลานกินทีละบ้าน กับข้าวเดินทางก่อนคำว่าเดลิเวอรีจะเกิดหลายสิบปี พริกแกงทุกครกตาเงินยายจันโขลกเองจนกลายเป็นรสมือเฉพาะตระกูล",
      "รุ่นที่ 4 · วันที่บ้านกลับมาหายใจ: ลูกหลานรุ่นปัจจุบันตัดสินใจเปิดร้านอาหารที่ใต้ถุน เพื่อให้บ้านได้มีชีวิต รักษาสูตรกับข้าวของตากับยายไว้ และต้อนรับทุกคนให้ 'เหมือนมากินข้าวบ้านญาติ'",
    ],
    photos: [
      {
        url: "/uploads/1788435835557_pn69j3.jpg",
        caption: "ป้าย 'เรือนหม่อนน้อย' และโต๊ะรับประทานอาหารใต้ถุนบ้านที่ลูกหลานร่วมกันดูแล",
        tag: "มรดกหม่อนน้อย",
      },
      {
        url: "/images/menu/khantoke_100years.jpg",
        caption: "สำรับขันโตกบ้าน 100 ปี รวมกับข้าวสูตรของตาเงินและยายจัน",
        tag: "สำรับครอบครัว",
      },
      {
        url: "/uploads/1788435028044_hvewx3.jpg",
        caption: "บ้านที่กลับมามีแสงไฟอบอุ่น มีคนแวะเวียนมากินข้าวบ้านญาติทุกวัน",
        tag: "บ้านกลับมาหายใจ",
      },
    ],
    highlights: [
      { title: "รุ่น 1: ผู้สร้าง", desc: "พ่อขากลิ้งและแม่ขายอด วางรากฐานและสร้างเรือนไร้ตะปู" },
      { title: "หม่อนน้อย: ผู้เฝ้าเรือน", desc: "ทอผ้าซิ่นตีนจกเฝ้าบ้านไม่ให้ถูกรื้อขายเป็นไม้เก่า" },
      { title: "รุ่น 3: ผู้ให้รสมือ", desc: "ตาเงินกับยายจัน กำเนิดสำรับปิ่นโตหน้ารถป๊อปน้อย" },
      { title: "รุ่น 4: ชุบชีวิต", desc: "เปิดร้านใต้ถุนบ้าน รักษารสมือโบราณสู่คนรุ่นใหม่" },
    ],
  },
  {
    id: "kitchen",
    emoji: "🌶️",
    coverImage: "/images/menu/moo_tod_prik_kha.jpg",
    badge: "ครัวสดมือ 100%",
    stat: "ตำมือ 100%",
    statLabel: "พริกแกงสดไม่สำเร็จรูป",
    title: "ตำมือ 100% – พริกแกงสดจากป้า ๆ ในครัวลับแล",
    subtitle: "ไม่ใช้พริกแกงสำเร็จรูป ไม่ใช้ผงชูรส พริกแกงโขลกสดด้วยครกหินทุกเช้า",
    quote: "“พริกแกงป้าชุมกับป้าชิดยังทำเองทุกวัน เสียงสากกระทบครกหินคือสัญญาณว่าครัวบ้านเราเปิดแล้ว”",
    quoteAuthor: "แม่ครัวบ้าน 100 ปี",
    paragraphs: [
      "หัวใจที่ทำให้อาหารร้านลำลำลับแลมีรสชาติเฉพาะตัว คือ 'เครื่องในครก' ที่ไม่มีทางหาได้จากพริกแกงสำเร็จรูปในท้องตลาด",
      "ทุกเช้าตรู่ในครัว ป้าชุม ป้าชิด และแม่ครัวประจำบ้าน 100 ปี จะเริ่มวันด้วยการเด็ดพริกแห้ง ปอกกระเทียมไทยพันธุ์ลับแล หั่นข่า ตะไคร้ ขมิ้นชัน และคั่วมะแขว่นจนกลิ่นหอมฟุ้งลอยไปทั่วใต้ถุนบ้าน",
      "จากนั้นจะช่วยกันโขลกในครกหินด้วยมือจนเนื้อเนียนละเอียด น้ำมันหอมระเหยจากสมุนไพรสดจึงแตกตัวออกมาเต็มที่ ให้รสชาติเผ็ดลึก หอมละมุน กลมกล่อม และมีมิติที่พริกแกงเครื่องปั่นไม่สามารถทำได้",
      "จานเด็ดที่กำเนิดจากพริกแกงตำมือนี้ ได้แก่ 'หมูทอดลับแลพริกข่า' สามชั้นทอดคลุกพริกข่าคั่วหอม, 'แกงอ่อมหมู/ไก่' ตุ๋นเตาถ่านข้ามวันจนนุ่มละลายในปาก, 'น้ำพริกหนุ่ม-น้ำพริกอ่อง' ย่างพริกบนเตาถ่านสดใหม่ทุกวัน และ 'ชุดขันโตกบ้าน 100 ปี' สำรับรวมรอยต่อวัฒนธรรมล้านนา-สุโขทัย",
    ],
    photos: [
      {
        url: "/images/menu/moo_tod_prik_kha.jpg",
        caption: "หมูทอดลับแลพริกข่า จานซิกเนเจอร์อันดับหนึ่ง คลุกเคล้าพริกข่าตำมือหอมกรุ่น",
        tag: "จานเด็ดซิกเนเจอร์",
      },
      {
        url: "/images/menu/nam_prik_noom.jpg",
        caption: "น้ำพริกหนุ่ม พริกหนุ่มเผาเตาถ่านตำสดคู่กระเทียมไทย เสิร์ฟพร้อมแคบหมูและผักลวก",
        tag: "ตำสดทุกวัน",
      },
      {
        url: "/images/menu/nam_prik_ong.jpg",
        caption: "น้ำพริกอ่อง เคี่ยวมะเขือส้มกับหมูสับ รสชาติเปรี้ยวหวานกลมกล่อมสูตรยายจัน",
        tag: "สูตรโบราณ",
      },
      {
        url: "/images/menu/khantoke_big.jpg",
        caption: "สำรับขันโตกชุดใหญ่ รวมทุกเมนูพริกแกงตำมือสำหรับรับประทานร่วมวง",
        tag: "สำรับขันโตก",
      },
      {
        url: "/uploads/1788429941334_yfy6ar.JPG",
        caption: "สามชั้นทอดกรอบเสิร์ฟคู่พริกข่าคั่วและน้ำจิ้มสูตรพิเศษบ้าน 100 ปี",
        tag: "ครัวคุณป้า",
      },
    ],
    highlights: [
      { title: "โขลกครกหินสดใหม่ทุกเช้า", desc: "น้ำมันหอมระเหยจากสมุนไพรแตกตัว กลิ่นหอมฟุ้งยาวนาน" },
      { title: "สมุนไพรพื้นบ้านลับแล", desc: "กระเทียมลับแล มะแขว่นหอม และผักสดจากสวนหลังบ้าน" },
      { title: "รสมือป้า ๆ ในครอบครัว", desc: "ปรุงด้วยความใส่ใจและสูตรดั้งเดิม ไม่ใช้ผงชูรสปรุงแต่ง" },
    ],
  },
];

interface QuickFactsStoryModalProps {
  customStoriesData?: Partial<Record<"house" | "wood" | "family" | "kitchen", Partial<StoryData>>>;
}

export default function QuickFactsStoryModal({ customStoriesData }: QuickFactsStoryModalProps) {
  const [activeStoryId, setActiveStoryId] = useState<"house" | "wood" | "family" | "kitchen" | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Merge default with custom stories if provided
  const stories = DEFAULT_STORIES.map((story) => {
    const custom = customStoriesData?.[story.id];
    if (!custom) return story;

    let paragraphs = story.paragraphs;
    if (typeof custom.paragraphs === "string") {
      const split = (custom.paragraphs as string)
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter(Boolean);
      if (split.length > 0) paragraphs = split;
    } else if (Array.isArray(custom.paragraphs) && custom.paragraphs.length > 0) {
      paragraphs = custom.paragraphs;
    }

    const photos = custom.photos && custom.photos.length > 0 ? custom.photos : story.photos;

    return {
      ...story,
      ...custom,
      badge: custom.badge?.trim() || story.badge,
      title: custom.title?.trim() || story.title,
      subtitle: custom.subtitle !== undefined ? custom.subtitle : story.subtitle,
      quote: custom.quote !== undefined ? custom.quote : story.quote,
      quoteAuthor: custom.quoteAuthor !== undefined ? custom.quoteAuthor : story.quoteAuthor,
      stat: custom.stat?.trim() || story.stat,
      statLabel: custom.statLabel?.trim() || story.statLabel,
      paragraphs,
      photos,
      coverImage: custom.coverImage?.trim() || photos[0]?.url || story.coverImage,
    };
  });

  const currentStory = stories.find((s) => s.id === activeStoryId);

  // Listen to hash change for deep linking e.g. #story=house
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash.includes("story=house")) setActiveStoryId("house");
      else if (hash.includes("story=wood")) setActiveStoryId("wood");
      else if (hash.includes("story=family")) setActiveStoryId("family");
      else if (hash.includes("story=kitchen")) setActiveStoryId("kitchen");
    };
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, []);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (activeStoryId !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [activeStoryId]);

  return (
    <>
      {/* 4 Interactive Quick Fact Cards on the page */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
        {stories.map((story) => (
          <button
            key={story.id}
            type="button"
            onClick={() => setActiveStoryId(story.id)}
            className="group relative p-3 sm:p-3.5 rounded-2xl bg-[#261810] border border-accent/25 hover:border-accent hover:shadow-[0_0_20px_rgba(212,163,115,0.25)] transition-all duration-300 transform hover:-translate-y-1 text-center flex flex-col items-center justify-between cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-accent"
          >
            {/* Top Indicator badge */}
            <span className="absolute top-2.5 right-2.5 text-[9px] font-bold text-accent/60 group-hover:text-accent transition-colors">
              <ChevronRight className="w-3.5 h-3.5 inline-block group-hover:translate-x-0.5 transition-transform" />
            </span>

            <span className="relative block w-full aspect-4/3 mb-2.5 rounded-xl overflow-hidden border border-accent/30 bg-black/30 shadow-sm">
              <img
                src={story.coverImage || story.photos[0]?.url}
                alt={`ภาพจริง: ${story.statLabel}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </span>
            <div>
              <p className="font-thai font-bold text-base sm:text-lg text-accent leading-tight">
                {story.stat}
              </p>
              <p className="text-[11px] sm:text-xs font-thai text-[#f7eee3]/75 mt-0.5">
                {story.statLabel}
              </p>
            </div>

            <div className="mt-2.5 pt-2 border-t border-accent/15 w-full flex items-center justify-center gap-1 text-[10px] sm:text-[11px] font-thai text-accent group-hover:underline">
              <span>กดดูเรื่องราว & ภาพ</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </button>
        ))}
      </div>

      {/* Story Details Modal Dialog */}
      {currentStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-4xl max-h-[90vh] bg-[#1a100a] border border-accent/35 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#f7eee3]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Header & Close button */}
            <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-accent/20 bg-[#241710]/90 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="relative w-10 h-10 rounded-xl overflow-hidden border border-accent/30 bg-black/30 shrink-0">
                  <img
                    src={currentStory.coverImage || currentStory.photos[0]?.url}
                    alt={`ภาพจริง: ${currentStory.statLabel}`}
                    className="w-full h-full object-cover"
                  />
                </span>
                <div>
                  <span className="text-[10px] sm:text-xs font-thai font-semibold text-accent uppercase tracking-wider">
                    {currentStory.badge}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold font-thai text-[#fff8ee] line-clamp-1">
                    {currentStory.title}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveStoryId(null);
                  if (window.location.hash.includes("story=")) {
                    history.pushState(null, "", window.location.pathname);
                  }
                }}
                className="p-2 rounded-full bg-accent/10 hover:bg-accent/25 text-[#f7eee3] transition-colors cursor-pointer"
                aria-label="ปิดหน้าต่าง"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Story Navigation Tabs inside Modal */}
            <div className="flex items-center gap-1.5 px-4 sm:px-7 py-2.5 bg-[#140c07] border-b border-accent/15 overflow-x-auto scrollbar-thin shrink-0">
              {stories.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveStoryId(s.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-thai font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    s.id === currentStory.id
                      ? "bg-accent text-[#1a100a] shadow-xs"
                      : "bg-[#241710] text-[#f7eee3]/70 hover:text-accent hover:bg-accent/15 border border-accent/20"
                  }`}
                >
                  <span className="relative w-5 h-5 rounded-md overflow-hidden border border-current/20 shrink-0">
                    <img
                      src={s.coverImage || s.photos[0]?.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </span>
                  <span>{s.stat} {s.statLabel}</span>
                </button>
              ))}
            </div>

            {/* Modal Body Scroll Area */}
            <div className="overflow-y-auto p-5 sm:p-7 space-y-8 flex-grow scrollbar-thin scrollbar-thumb-accent/25">
              {/* Header Title & Quote */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold font-thai text-[#fff8ee]">
                    {currentStory.title}
                  </h2>
                  <p className="text-xs sm:text-sm font-thai text-accent">
                    {currentStory.subtitle}
                  </p>
                </div>

                {currentStory.quote && (
                  <blockquote className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-accent/20 via-[#261810] to-accent/10 border-l-4 border-accent text-xs sm:text-sm font-thai italic text-[#f7eee3]/95 leading-relaxed">
                    {currentStory.quote}
                    {currentStory.quoteAuthor && (
                      <span className="block not-italic font-semibold text-accent text-xs mt-1.5 text-right">
                        — {currentStory.quoteAuthor}
                      </span>
                    )}
                  </blockquote>
                )}
              </div>

              {/* Photo Gallery Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-accent font-thai font-bold text-xs sm:text-sm">
                    <ImageIcon className="w-4 h-4" />
                    <span>คลังภาพบันทึกความทรงจำ ({currentStory.photos.length} รูป)</span>
                  </div>
                  <span className="text-[11px] text-[#f7eee3]/60 font-thai">
                    แตะที่รูปเพื่อดูขนาดใหญ่
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
                  {currentStory.photos.map((photo, pIdx) => (
                    <div
                      key={pIdx}
                      onClick={() => setLightboxIndex(pIdx)}
                      className="group relative rounded-2xl overflow-hidden bg-[#241710] border border-accent/25 hover:border-accent shadow-xs hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col"
                    >
                      <div className="relative aspect-4/3 w-full overflow-hidden bg-black/40">
                        <img
                          src={photo.url}
                          alt={photo.caption}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {photo.tag && (
                          <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-xs text-[10px] font-thai text-accent font-bold border border-accent/30">
                            {photo.tag}
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="p-2 rounded-full bg-black/60 text-white shadow-md">
                            <Maximize2 className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                      <div className="p-3 font-thai text-xs text-[#f7eee3]/90 leading-relaxed bg-[#20130b] flex-grow flex items-center">
                        <p className="line-clamp-2">{photo.caption}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3 Key Highlights Badges */}
              {currentStory.highlights && currentStory.highlights.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {currentStory.highlights.map((hl, hlIdx) => (
                    <div
                      key={hlIdx}
                      className="p-3.5 sm:p-4 rounded-2xl bg-[#241710] border border-accent/20 space-y-1"
                    >
                      <span className="text-xs font-thai font-bold text-accent">
                        ✦ {hl.title}
                      </span>
                      <p className="text-[11px] font-thai text-[#f7eee3]/80 leading-relaxed">
                        {hl.desc}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Story Narrative Text */}
              <div className="space-y-4 font-thai text-sm sm:text-base leading-relaxed text-[#f7eee3]/90 border-t border-accent/20 pt-6">
                <h4 className="text-base font-bold text-accent flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  เรื่องราวฉบับเต็ม
                </h4>
                {currentStory.paragraphs.map((p, pIdx) => (
                  <p key={pIdx} className="indent-4 leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>
            </div>

            {/* Modal Bottom CTA Footer */}
            <div className="px-5 sm:px-7 py-3.5 border-t border-accent/20 bg-[#241710] shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs font-thai text-[#f7eee3]/70 text-center sm:text-left">
                แวะมาสัมผัสบรรยากาศจริงที่ <strong>ร้านลำลำลับแลบ้าน 100 ปี</strong>
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href="/about"
                  className="flex-1 sm:flex-none text-center px-4 py-2 rounded-full border border-accent/40 hover:bg-accent/15 text-xs font-thai font-medium transition-colors"
                >
                  อ่านตำราลับแลทั้งหมด →
                </a>
                <a
                  href="/menu"
                  className="flex-1 sm:flex-none text-center px-5 py-2 rounded-full bg-accent hover:brightness-110 text-[#1a100a] text-xs font-thai font-bold shadow-md transition-all"
                >
                  ดูเมนูอาหาร
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Fullscreen Image View */}
      {currentStory && lightboxIndex !== null && currentStory.photos[lightboxIndex] && (
        <div 
          className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-between p-4 backdrop-blur-lg animate-in fade-in"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Lightbox Header */}
          <div className="w-full max-w-5xl flex items-center justify-between py-2 text-white shrink-0">
            <span className="text-xs font-thai text-accent">
              รูปที่ {lightboxIndex + 1} จาก {currentStory.photos.length}
            </span>
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              aria-label="ปิดรูปภาพขยาย"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Lightbox Image */}
          <div 
            className="relative max-w-5xl max-h-[75vh] flex items-center justify-center my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentStory.photos[lightboxIndex].url}
              alt={currentStory.photos[lightboxIndex].caption}
              className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl border border-white/10"
            />
          </div>

          {/* Lightbox Footer Caption */}
          <div 
            className="w-full max-w-3xl text-center pb-4 pt-2 font-thai text-sm sm:text-base text-white/90 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="bg-black/60 px-4 py-2.5 rounded-2xl border border-white/10 inline-block">
              {currentStory.photos[lightboxIndex].caption}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
