import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { gcs_uri } = await req.json();

    const res = await fetch(
      "https://us-central1-ai-fintech-hackathon.cloudfunctions.net/valuation-research-function",
      {
        method: "POST",
        headers: {
          "x-api-key": process.env.VALUATION_API_KEY as string,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gcs_uri }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: errText }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
