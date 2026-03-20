import { memo } from "react";
import { RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

const ConnectionErrorBanner = memo(({ show }: { show: boolean }) => {
  const queryClient = useQueryClient();

  if (!show) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-center gap-3 text-sm text-amber-800">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Showing cached products. Connection issue detected.</span>
      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs border-amber-300 hover:bg-amber-100"
        onClick={() => queryClient.invalidateQueries({ queryKey: ["db-products"] })}
      >
        <RefreshCw className="w-3 h-3 mr-1" />
        Retry
      </Button>
    </div>
  );
});

ConnectionErrorBanner.displayName = "ConnectionErrorBanner";
export default ConnectionErrorBanner;
