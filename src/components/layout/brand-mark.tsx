import Image from "next/image";

import logoImg from "@/components/shared/logo.png";
import logoLightImg from "@/components/shared/logoLight.png";
import { cn } from "@/lib/utils";

export function BrandMark({ className, logoClassName }: { className?: string; logoClassName?: string }) {
  return (
    <div className={cn("flex items-center", className)}>
      <Image 
        alt="Marketly AI Logo" 
        className={cn("h-48 w-auto object-contain drop-shadow-[0_8px_18px_var(--focus-ring)] logo-dark -my-20", logoClassName)}
        priority
        src={logoImg} 
      />
      <Image 
        alt="Marketly AI Logo" 
        className={cn("h-8 w-auto object-contain drop-shadow-[0_8px_18px_var(--focus-ring)] logo-light", logoClassName)}
        priority
        src={logoLightImg} 
      />
    </div>
  );
}
