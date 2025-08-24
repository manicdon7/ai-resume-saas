import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = new Uint8Array(bytes);

        let extractedText = '';

        // Handle different file types
        if (file.type === 'text/plain') {
            // Handle TXT files
            const decoder = new TextDecoder('utf-8');
            extractedText = decoder.decode(buffer);
        } else if (file.type === 'application/pdf') {
            // Handle PDF files with pdf-parse
            try {
                const pdfParse = await import('pdf-parse/lib/pdf-parse.js');
                const nodeBuffer = Buffer.from(buffer);
                const data = await pdfParse.default(nodeBuffer);
                extractedText = data.text;

                if (!extractedText || extractedText.trim().length === 0) {
                    return NextResponse.json({
                        error: "Could not extract text from PDF. The PDF might be image-based or encrypted.",
                        text: "",
                        suggestion: "Try copying the text manually: Open PDF → Select All (Ctrl+A/Cmd+A) → Copy → Paste below"
                    });
                }
            } catch (error) {
                console.error('PDF parsing error:', error);
                return NextResponse.json({
                    error: "Error processing PDF file. Please try copying the text manually.",
                    text: "",
                    suggestion: "Quick tip: Open your PDF → Select All (Ctrl+A/Cmd+A) → Copy (Ctrl+C/Cmd+C) → Paste below"
                });
            }
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            // Handle DOCX files with mammoth
            try {
                const mammoth = await import('mammoth');
                const nodeBuffer = Buffer.from(buffer);
                const result = await mammoth.extractRawText({ buffer: nodeBuffer });
                extractedText = result.value;

                if (!extractedText) {
                    return NextResponse.json({
                        error: "Could not extract text from DOCX file.",
                        text: ""
                    });
                }
            } catch (error) {
                console.error('DOCX parsing error:', error);
                return NextResponse.json({
                    error: "Error processing DOCX file. Please try again or copy and paste the text.",
                    text: ""
                });
            }
        } else if (file.type === 'application/msword') {
            // DOC files are more complex, provide helpful message
            return NextResponse.json({
                error: "Legacy DOC files are not supported. Please save as DOCX, PDF, or TXT format.",
                text: ""
            });
        } else {
            return NextResponse.json(
                { error: "Unsupported file type. Please use PDF, DOCX, or TXT files." },
                { status: 400 }
            );
        }

        // Clean up the extracted text
        extractedText = extractedText
            .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
            .replace(/\n\s*\n/g, '\n')  // Replace multiple newlines with single newline
            .trim();

        if (!extractedText) {
            return NextResponse.json({
                error: "No text could be extracted from the file. Please try copying and pasting instead.",
                text: ""
            });
        }

        return NextResponse.json({
            text: extractedText,
            message: "Text extracted successfully!"
        });

    } catch (error) {
        console.error('Error extracting text:', error);
        return NextResponse.json(
            { error: "Error processing file. Please try again or copy and paste your text." },
            { status: 500 }
        );
    }
}