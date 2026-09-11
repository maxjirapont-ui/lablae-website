import Link from "next/link";

const questions = {
  menu: [
    ["มากินสองคน สั่งอะไรดี?", "มาสองคน แนะนำขันโตกบ้าน 100 ปีครับ ได้กับข้าวหลายอย่างครบในชุดเดียว ดูราคาและรายการอาหารในชุดได้ด้านล่างครับ"],
    ["มีอาหารพื้นเมืองลับแลอะไรอีกบ้าง?", "นอกจากกับข้าวบ้าน 100 ปีแล้ว ที่ร้านยังมีข้าวพันผักและหมี่พันครับ"],
    ["ต้องจองโต๊ะล่วงหน้าไหม?", "ถ้ามากันประมาณ 8 คนขึ้นไป แนะนำจองล่วงหน้าครับ จะได้เตรียมโต๊ะยาวให้นั่งด้วยกัน ส่วนกลุ่มเล็กมาได้เลย ไม่จำเป็นต้องจองครับ ที่ร้านมีโต๊ะรองรับหลายโต๊ะ และตอนนี้อาหารออกค่อนข้างไวแล้ว"],
  ],
  directions: [
    ["จากซุ้มประตูเมืองลับแล มาร้านอย่างไร?", "เข้าซุ้มประตูเมืองลับแลมาแล้ว เลี้ยวขวาเข้าซอยสาธารณสุข ตรงมาจนสุดซอย แล้วเลี้ยวขวาเข้าซุ้มวัดป่ายางครับ หรือกดเปิด Google Maps ด้านบนเพื่อนำทางมาร้านได้เลย"],
    ["ที่ร้านมีที่จอดรถไหม?", "มีที่จอดรถครับ ตอนนี้เพิ่มพื้นที่จอดรถไว้รองรับลูกค้ามากขึ้นแล้ว"],
    ["มาเป็นคณะใหญ่ควรจองไหม?", "ถ้ามาประมาณ 8 คนขึ้นไป จองล่วงหน้าจะสะดวกกว่าครับ ทางร้านจะได้เตรียมโต๊ะยาวให้นั่งด้วยกัน ส่วนกลุ่มเล็กไม่จำเป็นต้องจองครับ"],
  ],
};

export default function VisitQuestions({ kind }: { kind: keyof typeof questions }) {
  return (
    <section className="rounded-2xl border border-accent/25 bg-[#241710] p-5 font-thai sm:p-7">
      <h2 className="text-xl font-bold text-primary">{kind === "menu" ? "เลือกอาหารและวางแผนก่อนมา" : "เส้นทาง ที่จอดรถ และการจอง"}</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {questions[kind].map(([question, answer]) => (
          <div key={question}>
            <h3 className="text-base font-bold text-primary">{question}</h3>
            <p className="mt-2 text-sm leading-7 text-primary/80">{answer}</p>
          </div>
        ))}
      </div>
      <Link href="/#booking" className="mt-5 inline-block text-sm font-semibold text-accent underline underline-offset-4">จองโต๊ะสำหรับกลุ่มใหญ่</Link>
    </section>
  );
}
