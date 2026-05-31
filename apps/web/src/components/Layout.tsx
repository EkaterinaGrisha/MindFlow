import { Outlet } from "react-router-dom";
import MobileBottomBar from "./MobileBottomBar";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import TourOverlay from "./onboarding/TourOverlay";

export default function Layout() {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:ml-64 flex flex-col min-h-screen pb-16 lg:pb-0">
        <TopBar />
        <main className="flex-grow p-8 lg:p-12">
          <Outlet />
        </main>
        <footer className="py-12 px-8 border-t border-outline-variant/10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex flex-col gap-2">
              <span className="text-xl font-black text-primary">MindFlow</span>
              <p className="text-xs text-on-surface-variant font-medium">© 2024 MindFlow Digital. All Rights Reserved.</p>
            </div>
            <div className="flex gap-8">
              <a href="#" className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">Terms</a>
              <a href="#" className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">API</a>
            </div>
          </div>
        </footer>
      </div>
      <MobileBottomBar />
      <TourOverlay />
    </div>
  );
}
