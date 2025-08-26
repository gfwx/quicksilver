import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation"
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001'

export async function GET() {
  try {
    redirect(SERVER_URL + '/auth/login')
  }
  catch (e) {
    return NextResponse.json({ error: 'Could not connect to authentication API.' }, { status: 500 })
  }
}
