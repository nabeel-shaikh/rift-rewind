// client/src/app/page.tsx
import { redirect } from "next/navigation";

export default function RootRedirect() {
  return (
    <div
      className="min-h-screen bg-[#101822] text-white font-display flex flex-col"
      style={{
        backgroundImage: "url('/assets/images/app_page.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {redirect("/home")}
    </div>
  );
}
