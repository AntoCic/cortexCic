import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface AccordionContextType {
  open: boolean;
  toggle: () => void;
}

const AccordionContext = createContext<AccordionContextType | undefined>(
  undefined,
);

const useAccordion = () => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error("useAccordion must be used within an Accordion component");
  }
  return context;
};

export interface AccordionProps {
  defaultOpen?: boolean;
  className?: string;
  children?: ReactNode;
}

const AccordionRoot: React.FC<AccordionProps> = ({
  defaultOpen = false,
  className,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  const toggle = () => {
    setOpen(!open);
  };

  return (
    <AccordionContext.Provider value={{ open, toggle }}>
      <div className={`accordion ${className || ""}`.trim()}>{children}</div>
    </AccordionContext.Provider>
  );
};

const AccordionHeader: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const { open, toggle } = useAccordion();

  return (
    <h2 className="accordion-header">
      <button
        className={`accordion-button ${open ? "" : "collapsed"}`}
        type="button"
        onClick={toggle}
        style={{
          backgroundColor: "transparent",
          boxShadow: "none",
          color: "inherit",
          borderBottom: "1px solid rgba(0, 0, 0, 0.125)",
        }}
      >
        {children}
      </button>
    </h2>
  );
};

const AccordionBody: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const { open } = useAccordion();

  return (
    <div className={`accordion-collapse collapse ${open ? "show" : ""}`}>
      <div className="accordion-body">{children}</div>
    </div>
  );
};

export const Accordion = Object.assign(AccordionRoot, {
  Header: AccordionHeader,
  Body: AccordionBody,
});
