import { memo } from "react";
import { RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

const ConnectionErrorBanner = memo(({ onRetry }: { onRetry: () => void }) => (
  <div className="w-full py-12 flex flex-col items-center justify-center gap-4 text-center px-4">
    <WifiOff className="w-12 h-12 text-muted-foreground" />
    <h3 className="text-lg font-semibold text-foreground">Unable to load products</h3>
    <p className="text-sm text-muted-foreground max-w-md">
      We're having trouble connecting to our servers. This is usually temporary — please try again.
    </p>
    <Button onClick={onRetry} variant="outline" className="gap-2">
      <RefreshCw className="w-4 h-4" />
      Retry
    </Button>
  </div>
));

ConnectionErrorBanner.displayName = "ConnectionErrorBanner";
export default ConnectionErrorBanner;
