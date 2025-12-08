import { NextRequest, NextResponse } from 'next/server'

// GET /api/tables/[id]/rows - Get all rows for a table
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // TODO: Fetch from database
    const rows: any[] = []

    return NextResponse.json({ rows }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch rows' },
      { status: 500 }
    )
  }
}

// POST /api/tables/[id]/rows - Create a new row
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    // TODO: Save to database
    const newRow = {
      id: `r${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({ row: newRow }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create row' },
      { status: 500 }
    )
  }
}
