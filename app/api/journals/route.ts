import { NextResponse } from "next/server";
import { getJournalOptions } from "@/lib/journals";
import { getProfileOptions } from "@/lib/profile-options";

export const runtime = "edge";

export async function GET() {
  try {
    const journalOptions = getJournalOptions();
    const profileOptions = getProfileOptions();

    return NextResponse.json({
      journals: journalOptions,
      profile: profileOptions,
    });
  } catch (error) {
    console.error("Error fetching options:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch options",
      },
      { status: 500 }
    );
  }
}
