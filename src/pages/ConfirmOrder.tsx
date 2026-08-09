import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Result = {
  success?: boolean;
  already?: boolean;
  error?: string;
  status?: string;
  order_number?: string;
  customer_name?: string;
  total?: number;
};

const ConfirmOrder = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const action = searchParams.get("action") === "cancel" ? "cancel" : "confirm";

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!token) {
        setResult({ error: "This confirmation link is not valid." });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("confirm-order-link", {
        body: { token, action },
      });

      if (cancelled) return;

      if (error) {
        setResult({ error: "We could not update your order. Please contact us on WhatsApp." });
      } else {
        setResult(data as Result);
      }
      setLoading(false);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [token, action]);

  const isError = !!result?.error;
  const isCancel = action === "cancel";

  return (
    <>
      <Helmet>
        <title>Order Confirmation | Desert Deal</title>
        <meta name="description" content="Confirm or cancel your Desert Deal order in one tap." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <main className="min-h-screen flex items-center justify-center bg-background px-4 py-16">
        <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          {loading ? (
            <>
              <Loader2 className="mx-auto mb-6 h-10 w-10 animate-spin text-muted-foreground" />
              <h1 className="text-xl font-heading text-foreground">Updating your order…</h1>
            </>
          ) : isError ? (
            <>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h1 className="mb-2 text-xl font-heading text-foreground">Link not valid</h1>
              <p className="text-sm text-muted-foreground">{result?.error}</p>
            </>
          ) : (
            <>
              <div
                className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full ${
                  isCancel ? "bg-destructive/10" : "bg-emerald-100"
                }`}
              >
                {isCancel ? (
                  <XCircle className="h-8 w-8 text-destructive" />
                ) : (
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                )}
              </div>

              <h1 className="mb-2 text-2xl font-heading text-foreground">
                {isCancel ? "Order Cancelled" : "Order Confirmed!"}
              </h1>
              <p className="mb-6 text-sm text-muted-foreground">
                {result?.already
                  ? `Your order is already marked as ${result?.status}.`
                  : isCancel
                    ? "We have cancelled your order. Nothing will be delivered."
                    : "Thank you! We are preparing your order for delivery."}
              </p>

              {result?.order_number && (
                <div className="mb-6 rounded-lg bg-muted/50 p-4">
                  <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Order Number</p>
                  <p className="text-lg font-medium text-primary">{result.order_number}</p>
                  {typeof result.total === "number" && (
                    <p className="mt-2 text-sm text-muted-foreground">{result.total} AED</p>
                  )}
                </div>
              )}
            </>
          )}

          <Button asChild variant="outline" className="mt-2 w-full">
            <Link to="/">Continue Shopping</Link>
          </Button>
        </section>
      </main>
    </>
  );
};

export default ConfirmOrder;
