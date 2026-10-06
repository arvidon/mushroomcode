import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { 
  DEFAULT_CHAT_MODEL_ID, 
  Mode,
  type ModeType,
  type SupportChatModelId,
} from "@mushroomcode/shared";

type PromptConfigContextValue = {
  mode: ModeType;
  toggleMode: () => void;
  setMode: (mode: ModeType) => void;
  model: SupportChatModelId;
  setModel: (model: SupportChatModelId) => void;
};

const PromptConfigContext = createContext<PromptConfigContextValue | null>(null);

export function usePromptConfig(): PromptConfigContextValue {
  const value = useContext(PromptConfigContext);
  if (!value) {
    throw new Error("usePromptConfig must be used within a PromptConfigProvider");
  }
  return value;
};

type PromptConfigProviderProps = {
  children: ReactNode;
};

export function PromptConfigProvider({ children }: PromptConfigProviderProps) {
  const [mode, setMode] = useState<ModeType>(Mode.BUILD);
  const [model, setModel] = useState<SupportChatModelId>(DEFAULT_CHAT_MODEL_ID);

  const toggleMode = useCallback(() => {
    setMode((m) => (m === Mode.BUILD ? Mode.PLAN : Mode.BUILD));
  }, []);

  return (
    <PromptConfigContext.Provider 
      value={{ 
        mode, 
        toggleMode, 
        setMode, 
        model, 
        setModel
    }}>
      {children}
    </PromptConfigContext.Provider>
  );
};