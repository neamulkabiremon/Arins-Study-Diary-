import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      error:
        "This Next.js route is retired. Call the Lambda API at NEXT_PUBLIC_API_BASE_URL/encouragement",
      migratedTo: "aws-lambda",
    },
    { status: 410 },
  );
}

export async function POST() {
  return GET();
}
