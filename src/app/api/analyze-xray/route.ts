import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  console.log('[API] Received analyze-xray request');
  
  try {
    const formData = await request.formData();
    console.log('[API] FormData parsed');
    
    const file = formData.get('file') as File;
    console.log('[API] File from form:', file ? `${file.name} (${file.size} bytes)` : 'NO FILE');

    if (!file) {
      console.error('[API] No file in request');
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Save uploaded file temporarily
    console.log('[API] Converting file to buffer...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log('[API] Buffer created:', buffer.length, 'bytes');
    
    const uploadDir = join(process.cwd(), 'uploads');
    const tempFilePath = join(uploadDir, `temp_${Date.now()}_${file.name}`);
    console.log('[API] Temp file path:', tempFilePath);
    
    console.log('[API] Writing file to disk...');
    await writeFile(tempFilePath, buffer);
    console.log('[API] File written successfully');

    try {
      // Execute Python script
      const pythonScript = join(process.cwd(), 'models', 'xray_api.py');
      const pythonCommand = `python "${pythonScript}" "${tempFilePath}"`;
      console.log('[API] Executing Python command:', pythonCommand);
      
      const { stdout, stderr } = await execAsync(pythonCommand);
      console.log('[API] Python stdout:', stdout);
      if (stderr) console.log('[API] Python stderr:', stderr);
      
      // Parse result
      console.log('[API] Parsing result...');
      const result = JSON.parse(stdout);
      console.log('[API] Result parsed successfully:', { label: result.label, probability: result.probability });

      // Clean up temp file
      console.log('[API] Cleaning up temp file...');
      await unlink(tempFilePath);
      console.log('[API] Temp file deleted');

      console.log('[API] Sending successful response');
      return NextResponse.json(result);
    } catch (error) {
      // Clean up temp file even on error
      console.error('[API] Error during Python execution or parsing:', error);
      try {
        await unlink(tempFilePath);
        console.log('[API] Temp file cleaned up after error');
      } catch (cleanupError) {
        console.error('[API] Failed to cleanup temp file:', cleanupError);
      }
      
      throw error;
    }
  } catch (error) {
    console.error('[API] Top-level error processing X-ray:', error);
    return NextResponse.json(
      { error: 'Failed to process X-ray image', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
