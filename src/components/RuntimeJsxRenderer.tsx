"use client";

import { useState, useEffect, ComponentType } from "react";
import * as React from "react";

declare global {
  interface Window {
    Babel: {
      transform: (code: string, options: object) => { code: string };
    };
  }
}

let babelPromise: Promise<void> | null = null;

function loadBabel(): Promise<void> {
  if (typeof window !== "undefined" && window.Babel) return Promise.resolve();
  if (babelPromise) return babelPromise;
  babelPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/@babel/standalone/babel.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Babel"));
    document.head.appendChild(script);
  });
  return babelPromise;
}

function compileJsx(source: string): ComponentType {
  // Strip leading metadata comments (// key: value lines at top of file)
  let code = source.replace(/^(?:\/\/[^\n]*\n?)*/, "").trimStart();

  // Strip "use client" directive and import statements
  code = code
    .replace(/^['"]use client['"];?\n?/, "")
    .replace(/^import\s[\s\S]*?from\s['"][^'"]+['"];?\n?/gm, "");

  // Capture the exported default component name
  let componentName = "__DefaultExport__";

  // export default function Name() / export default class Name
  code = code.replace(
    /export\s+default\s+(function|class)\s+(\w+)/,
    (_, keyword, name) => {
      componentName = name;
      return `${keyword} ${name}`;
    }
  );

  // export default SomeName; (bare identifier — must come after the above)
  code = code.replace(/export\s+default\s+(\w+)\s*;?/, (_, name) => {
    componentName = name;
    return "";
  });

  // Append return so the factory function returns the component
  code += `\n;return ${componentName};`;

  const result = window.Babel.transform(code, {
    presets: ["react"],
    filename: "post.jsx",
  });

  const factory = new Function(
    "React",
    "useState",
    "useEffect",
    "useRef",
    "useMemo",
    "useCallback",
    "useReducer",
    "useContext",
    "useId",
    result.code
  );

  return factory(
    React,
    React.useState,
    React.useEffect,
    React.useRef,
    React.useMemo,
    React.useCallback,
    React.useReducer,
    React.useContext,
    React.useId
  );
}

export default function RuntimeJsxRenderer({ source }: { source: string }) {
  const [Component, setComponent] = useState<ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBabel()
      .then(() => {
        try {
          const comp = compileJsx(source);
          setComponent(() => comp);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Compilation failed");
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load renderer");
      });
  }, [source]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 font-sans">
        Render error: {error}
      </div>
    );
  }

  if (!Component) {
    return (
      <div className="text-sm text-ink-faint font-sans py-8 text-center animate-pulse">
        Loading...
      </div>
    );
  }

  return <Component />;
}
