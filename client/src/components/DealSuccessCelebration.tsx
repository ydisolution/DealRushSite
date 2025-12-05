import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PartyPopper, Sparkles, Star, Gift, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DealSuccessCelebrationProps {
  isOpen: boolean;
  dealName: string;
  finalPrice: number;
  originalPrice: number;
  discountPercent: number;
  totalUnitsSold?: number;
  onClose: () => void;
}

export default function DealSuccessCelebration({
  isOpen,
  dealName,
  finalPrice,
  originalPrice,
  discountPercent,
  totalUnitsSold = 0,
  onClose,
}: DealSuccessCelebrationProps) {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; delay: number; color: string }>>([]);
  const savings = originalPrice - finalPrice;

  useEffect(() => {
    if (isOpen) {
      const colors = ["#22c55e", "#eab308", "#3b82f6", "#ec4899", "#8b5cf6"];
      const newConfetti = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
      setConfetti(newConfetti);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          data-testid="deal-success-celebration"
        >
          {confetti.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{ y: -20, x: `${piece.x}vw`, opacity: 1, scale: 0 }}
              animate={{
                y: "110vh",
                opacity: [1, 1, 0],
                scale: [0, 1, 1],
                rotate: [0, 360, 720],
              }}
              transition={{
                duration: 3,
                delay: piece.delay,
                ease: "easeOut",
              }}
              className="absolute top-0 w-3 h-3 rounded-full"
              style={{ backgroundColor: piece.color, left: `${piece.x}%` }}
            />
          ))}

          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-background rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-success/20 via-transparent to-warning/20" />
            
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
              className="relative mb-6"
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-success to-success/80 flex items-center justify-center shadow-lg">
                <PartyPopper className="h-12 w-12 text-white" />
              </div>
              
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute -top-2 -right-2"
              >
                <Sparkles className="h-8 w-8 text-warning" />
              </motion.div>
              
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -bottom-1 -left-1"
              >
                <Star className="h-6 w-6 text-warning fill-warning" />
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative space-y-4"
            >
              <h2 className="text-2xl font-bold text-foreground">
                מזל טוב!
              </h2>
              
              <p className="text-lg text-muted-foreground">
                הדיל נסגר בהצלחה
              </p>
              
              <div className="py-4 px-6 bg-success/10 rounded-xl">
                <p className="text-sm text-muted-foreground mb-1">{dealName}</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-muted-foreground line-through text-lg">
                    ₪{originalPrice.toLocaleString()}
                  </span>
                  <motion.span
                    initial={{ scale: 0.5 }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="text-3xl font-bold text-success"
                  >
                    ₪{finalPrice.toLocaleString()}
                  </motion.span>
                </div>
              </div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: "spring" }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/20 text-warning font-bold"
              >
                <TrendingDown className="h-5 w-5" />
                <span>חסכת {discountPercent}%</span>
                <span className="text-sm">(₪{savings.toLocaleString()})</span>
              </motion.div>

              {totalUnitsSold > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-sm text-muted-foreground"
                >
                  <Gift className="h-4 w-4 inline-block ml-1" />
                  {totalUnitsSold} יחידות נמכרו בסה"כ
                </motion.p>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="pt-4"
              >
                <Button 
                  size="lg" 
                  onClick={onClose}
                  className="w-full gap-2"
                  data-testid="button-close-celebration"
                >
                  <Sparkles className="h-4 w-4" />
                  מעולה!
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
