import { NextResponse } from "next/server";

/**
 * Production APIs live on AWS Lambda + API Gateway.
 * See NEXT_PUBLIC_API_BASE_URL and backend/.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "This Next.js route is retired. Call the Lambda API at NEXT_PUBLIC_API_BASE_URL/extract",
      migratedTo: "aws-lambda",
    },
    { status: 410 },
  );
}
