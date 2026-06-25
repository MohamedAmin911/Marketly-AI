import Image from "next/image";

import logoImg from "@/components/shared/logo.png";
import { cn } from "@/lib/utils";

export function BrandMark({ className, logoClassName }: { className?: string; logoClassName?: string }) {
  return (
    <div className={cn("flex items-center mt-10 mb-4", className)}>
      <Image 
        alt="Marketly AI Logo" 
        className={cn("h-60 w-auto object-contain drop-shadow-[0_8px_18px_var(--focus-ring)]", logoClassName)}
        priority
        src={logoImg} 
      />
    </div>
  );
}
