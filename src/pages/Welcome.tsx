import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Download, ChevronRight, UtensilsCrossed, Share2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { texts } from "@/config/texts";
import { motion } from "framer-motion";
import { isIOS, isAndroid, isStandalone } from "@/utils/device";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Welcome = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [iosSheetOpen, setIosSheetOpen] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const [showAndroidChromeHint, setShowAndroidChromeHint] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    if (isStandalone()) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (!showIosHint) return;
    const t = setTimeout(() => setShowIosHint(false), 8000);
    return () => clearTimeout(t);
  }, [showIosHint]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleIosInstall = () => {
    setIosSheetOpen(true);
  };

  const handleTakeMeThere = () => {
    setIosSheetOpen(false);
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    setShowIosHint(true);
  };

  const handleAndroidNoPrompt = () => {
    setShowAndroidChromeHint(true);
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-primary overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-primary-foreground/5" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary-foreground/5" />
        <div className="absolute top-1/4 left-10 w-20 h-20 rounded-full bg-primary-foreground/5" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center max-w-sm">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="w-28 h-28 rounded-3xl bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center shadow-2xl"
        >
          <UtensilsCrossed className="w-14 h-14 text-primary-foreground" strokeWidth={1.5} />
        </motion.div>

        {/* App name & tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-4xl font-bold text-primary-foreground tracking-tight">
            {texts.app.name}
          </h1>
          <p className="mt-3 text-primary-foreground/75 text-lg leading-relaxed">
            {texts.app.tagline}
          </p>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col gap-3 w-full mt-4"
        >
          {/* Install button: Android with prompt = direct install; iOS = sheet + "Du-mă acolo"; Android without prompt = show Chrome hint */}
          {!isInstalled && deferredPrompt && (
            <Button
              onClick={handleInstall}
              variant="outline"
              size="lg"
              className="w-full bg-primary-foreground/15 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/25 hover:text-primary-foreground backdrop-blur-sm h-14 text-base gap-2"
            >
              <Download className="w-5 h-5" />
              {texts.pwa.installButton}
            </Button>
          )}
          {!isInstalled && !deferredPrompt && isIOS() && (
            <Button
              onClick={handleIosInstall}
              variant="outline"
              size="lg"
              className="w-full bg-primary-foreground/15 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/25 hover:text-primary-foreground backdrop-blur-sm h-14 text-base gap-2"
            >
              <Download className="w-5 h-5" />
              {texts.pwa.installButtonIos}
            </Button>
          )}
          {!isInstalled && !deferredPrompt && isAndroid() && (
            <>
              <Button
                onClick={handleAndroidNoPrompt}
                variant="outline"
                size="lg"
                className="w-full bg-primary-foreground/15 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/25 hover:text-primary-foreground backdrop-blur-sm h-14 text-base gap-2"
              >
                <Download className="w-5 h-5" />
                {texts.pwa.installButton}
              </Button>
              {showAndroidChromeHint && (
                <p className="text-primary-foreground/70 text-sm text-center">
                  {texts.pwa.androidChromeHint}
                </p>
              )}
            </>
          )}

          {/* iOS install sheet: steps + "Du-mă acolo" */}
          <Sheet open={iosSheetOpen} onOpenChange={setIosSheetOpen}>
            <SheetContent side="bottom" className="rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>{texts.pwa.iosSheetTitle}</SheetTitle>
                <SheetDescription className="text-left space-y-3 pt-2">
                  <p>1. {texts.pwa.iosStep1}</p>
                  <p>2. {texts.pwa.iosStep2}</p>
                  <p>3. {texts.pwa.iosStep3}</p>
                </SheetDescription>
              </SheetHeader>
              <SheetFooter className="flex-col gap-2 pt-4">
                <Button onClick={handleTakeMeThere} className="w-full gap-2">
                  <Share2 className="w-4 h-4" />
                  {texts.pwa.takeMeThere}
                </Button>
                <Button variant="ghost" onClick={() => setIosSheetOpen(false)} className="w-full">
                  {texts.pwa.gotIt}
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {/* iOS hint at bottom after "Du-mă acolo" */}
          {showIosHint && (
            <button
              type="button"
              onClick={() => setShowIosHint(false)}
              className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-primary-foreground/95 text-primary py-4 px-4 shadow-lg safe-area-bottom"
              aria-label="Închide"
            >
              <Share2 className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">{texts.pwa.hintMessage}</span>
              <ChevronDown className="w-5 h-5 shrink-0 opacity-70" />
            </button>
          )}

          {/* Enter shop */}
          <Button
            onClick={() => navigate("/home")}
            size="lg"
            className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 h-14 text-base font-semibold gap-2 shadow-lg"
          >
            Intră în magazin
            <ChevronRight className="w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Welcome;
