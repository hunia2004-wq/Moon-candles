import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

type OrderItem = {
  productName: string;
  color?: string | null;
  scent?: string | null;
  price: number;
  quantity: number;
};

const SAGE = "#8FAA82";
const SAND = "#EFE3C4";
const WHITE = "#FFFFFF";

// Gmail's mobile dark mode inverts plain background colors but leaves cells
// with a background-image alone. A same-color gradient locks the color in,
// while background-color stays as a fallback for other clients.
const solid = (c: string) =>
  `background-color: ${c}; background-image: linear-gradient(${c}, ${c});`;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      email,
      customerName,
      orderNumber,
      items,
      subtotal,
      shippingFee,
      total,
    }: {
      email: string;
      customerName: string;
      orderNumber: string;
      items: OrderItem[];
      subtotal: number;
      shippingFee: number;
      total: number;
    } = body;

    if (!email || !orderNumber) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const itemsHtml = items
      .map(
        (item) => `
          <tr>
            <td
              style="
                padding: 16px 0;
                border-bottom: 1px solid ${SAGE};
                vertical-align: top;
              "
            >
              <div
                style="
                  font-weight: 700;
                  font-size: 15px;
                  color: ${SAGE};
                  margin-bottom: 5px;
                "
              >
                ${item.productName}
              </div>

              ${
                item.color || item.scent
                  ? `
                    <div
                      style="
                        font-size: 12px;
                        color: ${SAGE};
                        margin-bottom: 5px;
                      "
                    >
                      ${[item.color, item.scent]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  `
                  : ""
              }

              <div
                style="
                  font-size: 12px;
                  color: ${SAGE};
                "
              >
                ${item.price} EGP × ${item.quantity}
              </div>
            </td>

            <td
              style="
                padding: 16px 0;
                border-bottom: 1px solid ${SAGE};
                text-align: right;
                vertical-align: top;
                font-size: 15px;
                font-weight: 700;
                color: ${SAGE};
              "
            >
              ${(item.price * item.quantity).toLocaleString()} EGP
            </td>
          </tr>
        `
      )
      .join("");

    const firstName =
      customerName?.trim().split(" ")[0] || "there";

    const STRIPE_COUNT = 21;
    const stripesHtml = Array.from({ length: STRIPE_COUNT })
      .map((_, i) => {
        const c = i % 2 === 0 ? SAGE : SAND;
        return `<td bgcolor="${c}" style="${solid(c)} height: 10px; line-height: 10px; font-size: 0;">&nbsp;</td>`;
      })
      .join("");

    const html = `
      <!DOCTYPE html>
      <html lang="en" style="color-scheme: light only; supported-color-schemes: light only;">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
        <style>
          :root { color-scheme: light only; supported-color-schemes: light only; }
        </style>
      </head>
      <body bgcolor="${SAND}" style="margin: 0; padding: 0; ${solid(SAND)}">

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${SAND}" style="${solid(SAND)}">
        <tr>
          <td align="center" bgcolor="${SAND}" style="${solid(SAND)} font-family: Georgia, serif; padding: 40px 20px;">

            <table role="presentation" align="center" width="480" cellpadding="0" cellspacing="0" border="0" bgcolor="${WHITE}" style="max-width: 480px; width: 100%; ${solid(WHITE)} border-radius: 16px; overflow: hidden;">
              <tr>
                <td bgcolor="${WHITE}" style="${solid(WHITE)}">

                  <!-- STRIPE BAR -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                    <tr>${stripesHtml}</tr>
                  </table>

                  <!-- TOP SAGE STRIPE -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td bgcolor="${SAGE}" style="${solid(SAGE)} text-align: center; padding: 32px 24px;">
                        <div style="color: ${SAND}; font-size: 11px; letter-spacing: 0.2em; margin-bottom: 10px;">
                          THANK YOU FOR YOUR ORDER
                        </div>

                        <h1 style="margin: 0; color: ${SAND}; font-size: 27px; letter-spacing: 0.08em; font-weight: 700;">
                          MOON CANDLES
                        </h1>
                      </td>
                    </tr>
                  </table>

                  <!-- SAND STRIPE — INTRO -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td bgcolor="${SAND}" style="${solid(SAND)} padding: 30px 28px;">
                        <p style="margin: 0 0 10px; color: ${SAGE}; font-size: 20px; font-weight: 700;">
                          Hi ${firstName}, ✨
                        </p>

                        <p style="margin: 0; color: ${SAGE}; font-size: 15px; line-height: 1.75;">
                          Thank you so much for your order, every candle is poured
                          and every giveaway is packed with care, and we can't wait
                          for yours to arrive. We hope it brings a little extra
                          warmth and light to your day. 🌙
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- SAGE STRIPE — ORDER NUMBER -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td bgcolor="${SAGE}" style="${solid(SAGE)} padding: 22px 28px;">
                        <div style="color: ${SAND}; font-size: 10px; text-transform: uppercase; letter-spacing: 0.18em; margin-bottom: 6px;">
                          ORDER NUMBER
                        </div>

                        <div style="color: ${SAND}; font-size: 24px; font-weight: 700;">
                          #${orderNumber}
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- SAND STRIPE — ORDER -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td bgcolor="${SAND}" style="${solid(SAND)} padding: 28px;">
                        <div style="color: ${SAGE}; font-size: 12px; font-weight: 700; letter-spacing: 0.18em; margin-bottom: 12px;">
                          YOUR ORDER
                        </div>

                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
                          ${itemsHtml}
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- SAGE STRIPE — ORDER TOTALS -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td bgcolor="${SAGE}" style="${solid(SAGE)} padding: 24px 28px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 6px 0; color: ${SAND}; font-size: 14px;">
                              Subtotal
                            </td>
                            <td style="padding: 6px 0; color: ${SAND}; font-size: 14px; text-align: right;">
                              ${subtotal.toLocaleString()} EGP
                            </td>
                          </tr>

                          <tr>
                            <td style="padding: 6px 0; color: ${SAND}; font-size: 14px;">
                              Shipping
                            </td>
                            <td style="padding: 6px 0; color: ${SAND}; font-size: 14px; text-align: right;">
                              ${shippingFee.toLocaleString()} EGP
                            </td>
                          </tr>

                          <tr>
                            <td colspan="2" style="padding-top: 14px; border-top: 1px solid ${SAND};"></td>
                          </tr>

                          <tr>
                            <td style="padding-top: 4px; color: ${SAND}; font-size: 18px; font-weight: 700;">
                              Total
                            </td>
                            <td style="padding-top: 4px; color: ${SAND}; font-size: 20px; font-weight: 700; text-align: right;">
                              ${total.toLocaleString()} EGP
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- SAND STRIPE — MESSAGE -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td bgcolor="${SAND}" style="${solid(SAND)} padding: 28px; text-align: center;">
                        <p style="margin: 0; color: ${SAGE}; font-size: 14px; line-height: 1.7;">
                          We'll have this ready and on its way to you soon. 🌙
                        </p>

                        <p style="margin: 14px 0 0; color: ${SAGE}; font-size: 12px; line-height: 1.7;">
                          If anything comes up, just reply to this email or
                          reach us on Instagram
                          <strong>@the_moon_candlesshop</strong>.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- FINAL SAGE STRIPE -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td bgcolor="${SAGE}" style="${solid(SAGE)} padding: 26px 20px; text-align: center;">
                        <div style="color: ${SAND}; font-size: 10px; letter-spacing: 0.18em; margin-bottom: 8px;">
                          WITH LOVE
                        </div>

                        <div style="color: ${SAND}; font-size: 15px; font-weight: 700;">
                          The Moon Candles Team 🕯️
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- FINAL SAND STRIPE -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td bgcolor="${SAND}" style="${solid(SAND)} height: 18px; line-height: 18px; font-size: 0;">&nbsp;</td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>

          </td>
        </tr>
      </table>

      </body>
      </html>
    `;

    const { error } = await resend.emails.send({
      from: "Moon Candles <onboarding@resend.dev>",
      to: email,
      replyTo: "themooncandleshopp@gmail.com",
      subject: `Your Moon Candles order #${orderNumber} is confirmed 🌙`,
      html,
    });

    if (error) {
      console.error("Resend error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Failed to send order confirmation:", err);

    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}