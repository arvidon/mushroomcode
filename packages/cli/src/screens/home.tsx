import { useCallback } from "react";
import { useNavigate } from "react-router";
import { Header } from "../components/header";
import { InputBar } from "../components/input-bar";
import { usePromptConfig } from "../providers/prompt-config";
import { TextAttributes } from "@opentui/core";
import { getAuth } from "../lib/auth";
import { performLogin } from "../lib/oauth";
import { useToast } from "../providers/toast";

export function Home() {
  const navigate = useNavigate();
  const { mode, model } = usePromptConfig();
  const toast = useToast();

  const handleSubmit = useCallback(
    async (text: string) => {
      if (!getAuth()) {
        toast.show({ message: "Sign in to this backend to continue. Opening browser..." });
        try {
          await performLogin();
        } catch (error) {
          toast.show({ variant: "error", message: error instanceof Error ? error.message : "Sign-in failed" });
          return;
        }
      }
      navigate("/sessions/new", { state: { message: text, mode, model } });
    },
    [navigate, mode, model, toast],
  );

  return (
    <box
      alignItems="center"
      justifyContent="center"
      flexGrow={1}
      gap={2}
      position="relative"
      width="100%"
      height="100%"
    >
      <Header />
      <box width="100%" maxWidth={78} paddingX={2} flexDirection="column" gap={1}>
        <InputBar onSubmit={handleSubmit} />
        <box flexDirection="row" gap={1} flexShrink={0} marginLeft="auto">
          <text>tab</text>
          <text attributes={TextAttributes.DIM}>agents</text>
        </box>
      </box>
    </box>
  );
};
