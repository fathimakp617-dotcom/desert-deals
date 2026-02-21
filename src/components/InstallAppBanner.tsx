import { memo } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useState } from "react";

interface InstallAppBannerProps {
  variant?: "banner" | "button";
}

const InstallAppBanner = memo(({ variant = "banner" }: InstallAppBannerProps) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed || !isInstallable) return null;

  if (variant === "button") {
    return (
      <Button
        onClick={install}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Download className="w-4 h-4" />
        Install App
      </Button>
    );
  }

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-center gap-3">
      <div className="flex-shrink-0 w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
        <Smartphone className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">Install Desert Deal</p>
        <p className="text-xs text-muted-foreground">Add to home screen for quick access</p>
      </div>
      <Button onClick={install} size="sm" className="flex-shrink-0 gap-1.5">
        <Download className="w-3.5 h-3.5" />
        Install
      </Button>
      <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
});

InstallAppBanner.displayName = "InstallAppBanner";

export default InstallAppBanner;
