import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Resource from "@/models/Resource";

// GET /api/resources
export async function GET() {
  try {
    await dbConnect();
    const resources = await Resource.find();
    return NextResponse.json(resources);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST /api/resources
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const newResource = await Resource.create(body);
    return NextResponse.json(newResource, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// Note: POST handler remains here for creating new resources.
