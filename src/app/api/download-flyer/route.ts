import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as Blob | null;
        let filename = req.headers.get('x-filename');

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!filename) {
            filename = `flyer-${Date.now()}.jpg`;
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Ensure downloads directory exists
        const publicDir = path.join(process.cwd(), 'public', 'downloads');
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }

        const filePath = path.join(publicDir, filename);
        fs.writeFileSync(filePath, buffer);

        // Return the public URL
        const url = `/downloads/${filename}`;

        return NextResponse.json({ url });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
