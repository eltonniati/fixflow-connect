
import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface CardHoverEffectProps {
  items: {
    title: string;
    description: string;
    icon?: React.ReactNode;
  }[];
  className?: string;
}

export function CardHoverEffect({ items, className }: CardHoverEffectProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
      {items.map((item, idx) => (
        <div
          key={idx}
          className="relative group block p-6 bg-white rounded-xl border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-lg"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <div className="relative z-10">
            <div className="p-3 rounded-full bg-fixflow-50 inline-flex mb-4">
              {item.icon}
            </div>
            <h3 className="text-lg font-medium mb-2 text-gray-900">{item.title}</h3>
            <p className="text-sm text-gray-500">{item.description}</p>
          </div>
          
          <div
            className={cn(
              "absolute inset-0 rounded-xl bg-fixflow-50/0 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:bg-fixflow-50/5",
              hoveredIndex === idx && "opacity-100 bg-fixflow-50/5"
            )}
          />
          
          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-fixflow-400 to-fixflow-500 scale-x-0 transition-transform duration-500 group-hover:scale-x-100 rounded-b-xl",
              hoveredIndex === idx && "scale-x-100"
            )}
          />
        </div>
      ))}
    </div>
  );
}
