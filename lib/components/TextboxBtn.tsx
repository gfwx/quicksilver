"use client";

/**
 * This is primarily used with the client-side textbox only.
 * Since it takes event handlers as input, it is not suitable for SSR
 */

import { ArrowUp, StopCircle } from "lucide-react";
import * as ai from "ai";
import { useEffect, useState } from "react";

export const TextBoxButton = ({
  status,
  active_handler,
  disabled_handler,
}: {
  status: ai.ChatStatus;
  active_handler: React.FormEventHandler<HTMLFormElement>;
  disabled_handler: React.FormEventHandler<HTMLFormElement>;
}) => {
  const [ready_state, set_ready_state] = useState(status === "ready");
  useEffect(() => {
    set_ready_state(status === "ready");
  }, [status]);

  if (ready_state) {
    return (
      <button
        type="submit"
        onClick={(e) =>
          active_handler(e as unknown as React.FormEvent<HTMLFormElement>)
        }
        className="bg-blue-500 w-[48px] h-[48px] rounded-full flex justify-center items-center"
      >
        <ArrowUp color="white" width={28} height={28} />
      </button>
    );
  } else {
    return (
      <button
        onClick={(e) =>
          disabled_handler(e as unknown as React.FormEvent<HTMLFormElement>)
        }
        className="bg-black w-[48px] h-[48px] rounded-full flex justify-center items-center"
      >
        <StopCircle color="white" width={28} height={28} />
      </button>
    );
  }
};
