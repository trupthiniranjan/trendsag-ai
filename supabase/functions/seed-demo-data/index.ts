// Seeds realistic demo comments for the authenticated user.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEMO = [
  { platform: "Flipkart", author: "Priya S.", product: "Wireless Earbuds Pro", rating: 5, text: "Absolutely love these! Sound quality is amazing and battery lasts all day. Worth every rupee." },
  { platform: "Meesho", author: "Rohan K.", product: "Cotton Kurta", rating: 2, text: "Material is thinner than shown in photos. Disappointed with the quality at this price." },
  { platform: "Amazon", author: "Anjali M.", product: "Steel Water Bottle", rating: 4, text: "Good build, keeps water cold for hours. Lid is a bit hard to open though." },
  { platform: "Flipkart", author: "Vikram R.", product: "Wireless Earbuds Pro", rating: 1, text: "Stopped working after 2 weeks. Customer service is horrible, no response for days." },
  { platform: "Meesho", author: "Sneha P.", product: "Embroidered Saree", rating: 5, text: "Beautiful saree, exactly like the picture! Fast delivery too." },
  { platform: "Amazon", author: "Arjun N.", product: "LED Desk Lamp", rating: 3, text: "Decent lamp for the price. Brightness is okay but the touch controls are unresponsive sometimes." },
  { platform: "Flipkart", author: "Kavya I.", product: "Cotton Kurta", rating: 4, text: "Fabric is comfortable but the size runs slightly large. Order one size down." },
  { platform: "Whatsapp", author: "Manoj T.", product: "General", rating: null, text: "BUY CHEAP CRYPTO 1000% RETURNS click bit.ly/scam now!!!" },
  { platform: "Meesho", author: "Divya L.", product: "Wireless Earbuds Pro", rating: 5, text: "Great earbuds at this price. Bass is excellent." },
  { platform: "Flipkart", author: "Rahul B.", product: "Steel Water Bottle", rating: 2, text: "Started leaking after a few days. Returning it." },
  { platform: "Amazon", author: "Pooja H.", product: "LED Desk Lamp", rating: 5, text: "Perfect for my study desk. Multiple brightness levels are very useful." },
  { platform: "Flipkart", author: "Suresh G.", product: "Wireless Earbuds Pro", rating: 4, text: "Good product overall but the case scratches easily." },
  { platform: "Meesho", author: "Neha A.", product: "Embroidered Saree", rating: 3, text: "Color is slightly different from website but still nice." },
  { platform: "Amazon", author: "Karan V.", product: "Cotton Kurta", rating: 5, text: "Bahut achha hai, fitting perfect, color exactly same as picture." },
  { platform: "Whatsapp", author: "Spam Bot", product: "x", rating: null, text: "Earn money from home!! WhatsApp +91xxxxxxxxxx now!" },
  { platform: "Flipkart", author: "Megha S.", product: "Wireless Earbuds Pro", rating: 1, text: "Right earbud not working at all. Very poor quality control." },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const rows = DEMO.map((d) => ({
      user_id: user.id,
      platform: d.platform,
      author: d.author,
      product: d.product,
      rating: d.rating,
      original_text: d.text,
      raw_payload: d,
    }));
    const { data: inserted } = await supabase.from("comments").insert(rows).select("id");

    // Trigger analysis async
    const fnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/analyze-comment`;
    inserted?.forEach((r) => {
      fetch(fnUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_id: r.id }),
      }).catch(() => {});
    });

    return json({ success: true, count: rows.length });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
