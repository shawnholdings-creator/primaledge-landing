/**
 * LoginModalContext — lightweight context to open/close the login modal
 * from anywhere in the app (nav, hero, product pages).
 */
import { createContext, useContext, useState, type ReactNode } from "react";

interface LoginModalContextType {
  isOpen: boolean;
  openLoginModal: (redirectTo?: string) => void;
  closeLoginModal: () => void;
  redirectTo: string | undefined;
}

const LoginModalContext = createContext<LoginModalContextType | null>(null);

export function LoginModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | undefined>(undefined);

  const openLoginModal = (path?: string) => {
    setRedirectTo(path);
    setIsOpen(true);
  };

  const closeLoginModal = () => {
    setIsOpen(false);
    setRedirectTo(undefined);
  };

  return (
    <LoginModalContext.Provider
      value={{ isOpen, openLoginModal, closeLoginModal, redirectTo }}
    >
      {children}
    </LoginModalContext.Provider>
  );
}

export function useLoginModal(): LoginModalContextType {
  const ctx = useContext(LoginModalContext);
  if (!ctx)
    throw new Error("useLoginModal must be used within LoginModalProvider");
  return ctx;
}
