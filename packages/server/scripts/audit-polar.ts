import { createPolar } from "@polar-sh/sdk/2026-04";
import { authenticateOAuthRequest } from "../src/lib/auth";
import { homedir } from "node:os";
import { join } from "node:path";

const polar = createPolar({ accessToken: process.env.POLAR_ACCESS_TOKEN!, environment: "sandbox" });
const product = await polar.products.get(process.env.POLAR_PRODUCT_ID!);
const meter = await polar.meters.get(process.env.POLAR_CREDITS_METER_ID!);
for (const benefit of product.benefits) {
  if (benefit.type === "meter_credit") {
    const creditedMeter = await polar.meters.get(benefit.properties.meter_id);
    console.log(JSON.stringify({ creditedMeter: {
      id: creditedMeter.id, name: creditedMeter.name,
      filter: creditedMeter.filter, aggregation: creditedMeter.aggregation,
      archivedAt: creditedMeter.archived_at,
    } }, null, 2));
  }
}
console.log(JSON.stringify({
  product: { id: product.id, name: product.name, prices: product.prices, benefits: product.benefits },
  meter,
}, null, 2));

const saved = await Bun.file(join(homedir(), ".nightcode", "auth.json")).json();
const auth = await authenticateOAuthRequest(new Request("https://mushroomcodeserver-production-5a18.up.railway.app/sessions", {
  headers: { Authorization: `Bearer ${saved.token}` },
}));
if (!auth) throw new Error("Saved login is not valid; cannot identify purchasing customer");
const state = await polar.customers.getStateExternal(auth.userId);
console.log(JSON.stringify({ customerId: state.id, externalId: state.external_id, activeMeters: state.active_meters, grantedBenefits: state.granted_benefits }, null, 2));
const orders = await polar.orders.list({ customer_id: state.id, limit: 10 });
console.log(JSON.stringify({ orders: orders.items.map(order => ({
  id: order.id, status: order.status, productId: order.product_id, totalAmount: order.total_amount,
  customerId: order.customer_id, checkoutId: order.checkout_id,
})) }, null, 2));
