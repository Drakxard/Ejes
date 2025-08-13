import { NextResponse } from "next/server"
import { events } from "../../../../lib/events"

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const event = events.find((e) => e.id === params.id)
  if (event) return NextResponse.json(event)
  return NextResponse.json({ message: "Not found" }, { status: 404 })
}

