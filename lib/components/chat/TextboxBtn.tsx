"use client";
import { ArrowUp, StopCircle } from "lucide-react";
import * as ai from "ai";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export const TextBoxButton = ({
  status,
  active_handler,
  disabled_handler,
}: {
  status: ai.ChatStatus;
  active_handler: React.FormEventHandler<HTMLFormElement>;
  disabled_handler: React.FormEventHandler<HTMLFormElement>;
}) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const readyState = status === "ready";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="submit"
        disabled
        className="w-[48px] h-[48px] rounded-full flex justify-center items-center bg-gray-400"
      >
        <ArrowUp color="white" width={28} height={28} />
      </button>
    );
  }

  if (readyState) {
    return (
      <button
        type="submit"
        onClick={(e) =>
          active_handler(e as unknown as React.FormEvent<HTMLFormElement>)
        }
        className={cn(
          "w-[48px] h-[48px] rounded-full flex justify-center items-center",
          resolvedTheme === "dark" ? "bg-white" : "bg-blue-500",
        )}
      >
        <ArrowUp
          color={resolvedTheme === "dark" ? "black" : "white"}
          width={28}
          height={28}
        />
      </button>
    );
  } else {
    return (
      <button
        onClick={(e) =>
          disabled_handler(e as unknown as React.FormEvent<HTMLFormElement>)
        }
        className={cn(
          "w-[48px] h-[48px] rounded-full flex justify-center items-center",
          resolvedTheme === "dark" ? "bg-red-500" : "bg-black",
        )}
      >
        <StopCircle color={"white"} width={28} height={28} />
      </button>
    );
  }
};
