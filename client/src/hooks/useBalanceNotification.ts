import { useEffect, useRef, createElement } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import currencyIcon from "@assets/IMG_2999_1765925106131.png";

export function useBalanceNotification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const previousBalanceRef = useRef<number | null>(null);

  useEffect(() => {
    if (user?.balance !== undefined) {
      if (
        previousBalanceRef.current !== null &&
        previousBalanceRef.current !== user.balance
      ) {
        const difference = user.balance - previousBalanceRef.current;
        const isIncrease = difference > 0;
        const amount = `${isIncrease ? "+" : ""}${difference.toFixed(2)}`;

        toast({
          description: createElement(
            "div",
            { className: "flex items-center gap-1" },
            createElement("span", { className: "font-semibold" }, amount),
            createElement("img", {
              src: currencyIcon,
              alt: "",
              className: "w-4 h-4",
            })
          ),
          variant: isIncrease ? "default" : "destructive",
        });
      }
      previousBalanceRef.current = user.balance;
    }
  }, [user?.balance, toast]);
}
