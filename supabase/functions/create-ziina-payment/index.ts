import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ZIINA_API_KEY = Deno.env.get("ZIINA_API_KEY");
    if (!ZIINA_API_KEY) {
      throw new Error("ZIINA_API_KEY is not configured");
    }

    const body = await req.json();
    const { amount, order_number, customer_name, customer_email, customer_phone, items, shipping_address, user_id, success_url, cancel_url } = body;

    if (!amount || !order_number || !customer_name || !customer_email || !items) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Amount must be in fils (base units) for AED — 1 AED = 100 fils
    const amountInFils = Math.round(amount * 100);

    const message = `Order ${order_number} - ${customer_name}`;

    // Create payment intent with Ziina
    const zinaResponse = await fetch("https://api-v2.ziina.com/api/payment_intent", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ZIINA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountInFils,
        currency_code: "AED",
        message,
        success_url: success_url || `${req.headers.get("origin") || "https://testingdeserts.lovable.app"}/?order=${order_number}&payment=success`,
        cancel_url: cancel_url || `${req.headers.get("origin") || "https://testingdeserts.lovable.app"}/checkout?payment=cancelled`,
        failure_url: `${req.headers.get("origin") || "https://testingdeserts.lovable.app"}/checkout?payment=failed`,
        test: false,
      }),
    });

    const zinaData = await zinaResponse.json();

    if (!zinaResponse.ok) {
      console.error("Ziina API error:", zinaData);
      throw new Error(zinaData?.latest_error?.message || zinaData?.message || `Ziina API error (${zinaResponse.status})`);
    }

    // Create the order in our database with payment_status = "awaiting_payment"
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const subtotal = items.reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0);
    const shipping = 20;
    const total = subtotal + shipping;

    const { data: orderData, error: orderError } = await supabaseClient
      .from("orders")
      .insert({
        order_number,
        customer_name,
        customer_email,
        customer_phone: customer_phone || null,
        user_id: user_id || null,
        items: items.map((item: any) => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          selectedSize: item.selectedSize || null,
        })),
        shipping_address,
        subtotal,
        shipping,
        total,
        payment_method: "ziina",
        payment_status: "awaiting_payment",
        order_status: "pending",
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      throw new Error("Failed to create order: " + orderError.message);
    }

    // Deduct stock
    for (const item of items) {
      await supabaseClient.rpc("show_limit"); // warm up
      const { data: product } = await supabaseClient
        .from("products")
        .select("stock_quantity")
        .eq("id", item.productId)
        .single();

      if (product) {
        const newStock = Math.max(0, product.stock_quantity - (item.quantity || 1));
        await supabaseClient
          .from("products")
          .update({ stock_quantity: newStock })
          .eq("id", item.productId);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        redirect_url: zinaData.redirect_url,
        payment_intent_id: zinaData.id,
        order_number,
        order: orderData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating Ziina payment:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
