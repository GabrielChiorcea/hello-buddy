import { useNavigate } from "react-router-dom";
import { ChevronRight, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { texts } from "@/config/texts";
import { motion } from "framer-motion";

const Welcome = () => {
  const navigate = useNavigate();

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
