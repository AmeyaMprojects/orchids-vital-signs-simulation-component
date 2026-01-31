import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { writeFile, unlink } from 'fs/promises';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  console.log('[API] Received generate-report request');
  
  try {
    const body = await request.json();
    console.log('[API] Request body:', body);
    
    const { 
      vitals_probability, 
      age_group, 
      image_probability = 0,
      shap_contributors, 
      age_adjusted_flags,
      risk_factors_text 
    } = body;

    if (!vitals_probability || !age_group || !shap_contributors || !age_adjusted_flags || !risk_factors_text) {
      console.error('[API] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Prepare input for Python script
    const inputData = {
      vitals_probability,
      age_group,
      image_probability,
      shap_contributors,
      age_adjusted_flags,
      risk_factors_text
    };

    const inputJson = JSON.stringify(inputData);
    console.log('[API] Input for Python:', inputJson);

    // Write input to temporary file
    const tempInputFile = join(process.cwd(), 'uploads', `report_input_${Date.now()}.json`);
    await writeFile(tempInputFile, inputJson);

    try {
      // Execute Python script
      const pythonScript = join(process.cwd(), 'models', 'report_generator.py');
      const pythonCommand = `python "${pythonScript}" "${tempInputFile}"`;
      console.log('[API] Executing Python command');
      
      const { stdout, stderr } = await execAsync(pythonCommand, {
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      if (stderr) console.log('[API] Python stderr:', stderr);
      console.log('[API] Python stdout:', stdout);

      // Parse Python output
      const result = JSON.parse(stdout.trim());
      console.log('[API] Report result:', result);

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
    console.error('[API] Error generating report:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate report',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
