import { NextRequest, NextResponse } from "next/server";
import { uploadApplicantDocument } from "@/actions/applicant-documents";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const documentType = request.headers.get('X-Document-Type') as 'passport_photo' | 'signature';

    if (!documentType || !['passport_photo', 'signature'].includes(documentType)) {
      return NextResponse.json(
        { success: false, error: "Invalid document type" },
        { status: 400 }
      );
    }

    const result = await uploadApplicantDocument(formData, documentType);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
