import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { plan, email, businessName } = await ioJson(request);

    // Determine price
    let amount = 99000; // default Starter
    let planName = "Starter Plan";

    if (plan === "business") {
      amount = 199000;
      planName = "Business Plan";
    }

    const orderId = `MENUIN-SUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    // Detect sandbox or production URL
    const isProduction = !serverKey.startsWith("SB-");
    const midtransUrl = isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    const authHeader = `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`;

    const midtransBody = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
        currency: "IDR",
      },
      item_details: [
        {
          id: plan,
          price: amount,
          quantity: 1,
          name: `Langganan MENUIN - ${planName}`,
        },
      ],
      customer_details: {
        first_name: businessName,
        email: email,
      },
      credit_card: {
        secure: true,
      },
    };

    const response = await fetch(midtransUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(midtransBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Midtrans API Error:", errorText);
      return NextResponse.json(
        { error: "Gagal membuat transaksi di Midtrans" },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      token: data.token,
      redirect_url: data.redirect_url,
    });
  } catch (error) {
    console.error("Checkout API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

async function ioJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
