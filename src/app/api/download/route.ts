import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
    const filename = req.nextUrl.searchParams.get('file');

    if (!filename) {
        return new NextResponse('Filename required', { status: 400 });
    }

    // Security: Prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), 'public', 'downloads', safeFilename);

    if (!fs.existsSync(filePath)) {
        return new NextResponse('File not found', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    const headers = new Headers();
    headers.set('Content-Type', 'image/jpeg');
    headers.set('Content-Disposition', `attachment; filename="${safeFilename}"`);

    return new NextResponse(fileBuffer, {
        status: 200,
        headers,
    });
}
