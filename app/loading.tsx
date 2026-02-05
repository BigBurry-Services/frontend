"use client";

import React from "react";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-t-2 border-b-2 border-primary animate-spin"></div>
        <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-t-2 border-b-2 border-primary/20"></div>
      </div>
    </div>
  );
}
