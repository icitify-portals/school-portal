"use client";

import React from 'react';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

interface LatexRendererProps {
  content: string;
  containsLatex?: boolean;
}

export default function LatexRenderer({ content, containsLatex = false }: LatexRendererProps) {
  if (!containsLatex) {
    return <span className="whitespace-pre-wrap">{content}</span>;
  }

  return (
    <div className="latex-container prose prose-sm max-w-none prose-slate">
      <Latex>{content}</Latex>
    </div>
  );
}
