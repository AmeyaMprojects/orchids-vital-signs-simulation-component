import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { writeFile, unlink } from 'fs/promises';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  console.log('[API] Received analyze-vitals request');
  
  try {
    const body = await request.json();
    console.log('[API] Request body:', body);
    
    const { vitals, ageGroup } = body;

    if (!vitals || !ageGroup) {
      console.error('[API] Missing vitals or ageGroup');
      return NextResponse.json(
        { error: 'Missing vitals or ageGroup' },
        { status: 400 }
      );
    }

    // Prepare input for Python script
    const inputData = {
      vitals: {
        Temperature_C: vitals.temp,
        Temperature_trend: vitals.tempTrend,
        SpO2_percent: vitals.spo2,
        SpO2_trend: vitals.spo2Trend,
        HeartRate_bpm: vitals.hr,
        HeartRate_trend: vitals.hrTrend,
        RespRate_bpm: vitals.rr,
        RespRate_trend: vitals.rrTrend,
        Cough: vitals.cough,
        Retractions: vitals.retractions
      },
      age_group: ageGroup
    };

    const inputJson = JSON.stringify(inputData);
    console.log('[API] Input for Python:', inputJson);

    // Write input to temporary file to avoid command-line escaping issues on Windows
    const tempInputFile = join(process.cwd(), 'uploads', `vitals_input_${Date.now()}.json`);
    await writeFile(tempInputFile, inputJson);

    try {
      // Execute Python script with temp file
      const pythonScript = join(process.cwd(), 'models', 'vitals_api.py');
      const pythonCommand = `python "${pythonScript}" "${tempInputFile}"`;
      console.log('[API] Executing Python command');
      
      const { stdout, stderr } = await execAsync(pythonCommand, {
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      if (stderr) console.log('[API] Python stderr:', stderr);
      console.log('[API] Python stdout:', stdout);

      // Parse Python output
      const result = JSON.parse(stdout.trim());
      console.log('[API] Analysis result:', result);

      // Clean up temp file
      await unlink(tempInputFile).catch(() => {});

      if (result.error) {
        return NextResponse.json(
          { error: result.error, traceback: result.traceback },
          { status: 500 }
        );
      }

      return NextResponse.json(result);
      
    } catch (error) {
      // Clean up temp file on error
      await unlink(tempInputFile).catch(() => {});
      throw error;
    }
    
  } catch (error) {
    console.error('[API] Error analyzing vitals:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to analyze vitals',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
