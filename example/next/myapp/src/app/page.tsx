"use client";

import { richmd } from "@richmd/core";
import { useState } from "react";
import parse from 'html-react-parser';

export default function Home() {
  const [text, setMarkdown] = useState('');

  return (
    <div className="w-full h-screen flex flex-row">
      <textarea className="w-600 h-500" onChange={(e) => setMarkdown(e.target.value)}></textarea>
      <div className="w-500">{parse(richmd(text))}</div>
    </div>
  )
}
