import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const dirPath = path.join(process.cwd(), "public/data/consumption");

  const files = fs.readdirSync(dirPath);

  const hotels = files
    .filter((file) => file.endsWith(".xlsx"))
    .map((file) => ({
      name: file.replace(".xlsx", "").replace(/_/g, " "),
      file: `/data/consumption/${file}`,
    }));

return NextResponse.json(hotels);
}
