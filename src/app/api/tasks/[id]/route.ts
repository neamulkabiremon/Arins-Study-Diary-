import { NextResponse } from "next/server";

export async function PATCH() {
  return NextResponse.json(
    {
      error:
        "This Next.js route is retired. Call the Lambda API at NEXT_PUBLIC_API_BASE_URL/tasks/:id",
      migratedTo: "aws-lambda",
    },
    { status: 410 },
  );
}
