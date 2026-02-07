import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import mongoose from "mongoose";

export async function GET() {
  try {
    const conn = await dbConnect();
    return NextResponse.json({
      status: "connected",
      readyState: mongoose.connection.readyState,
      dbName: mongoose.connection.name,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: error.message,
        stack: error.stack,
      },
      { status: 500 },
    );
  }
}
