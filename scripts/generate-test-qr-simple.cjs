const { SignJWT } = require('jose');

// Simple JWT-based QR pass generator for testing
const JWT_SECRET = new TextEncoder().encode('your-super-secret-key-change-in-production');

async function generateTestQRPass(data) {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + (24 * 60 * 60); // 24 hours

  const signedData = {
    ...data,
    issuedAt: now,
    expiresAt,
    issuer: 'school-portal-security',
  };

  const jwt = await new SignJWT(signedData)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(expiresAt)
    .sign(JWT_SECRET);

  return {
    qrData: jwt,
    expiresAt: new Date(expiresAt * 1000),
  };
}

async function generateTestQRPasses() {
  console.log('🔧 Generating test QR passes for Security Gateway testing...');
  
  try {
    // Test Student Gate Pass
    const studentPass = await generateTestQRPass({
      type: 'student_gate',
      entityId: 1,
      entityType: 'user',
      schoolPortalId: '2023/123456'
    });
    console.log('\n👨‍🎓 Student Gate Pass QR Data:');
    console.log(studentPass.qrData);
    console.log('Expires:', studentPass.expiresAt);
    
    // Test Library Book Pass
    const libraryPass = await generateTestQRPass({
      type: 'library_book',
      entityId: 1,
      entityType: 'library_resource',
      schoolPortalId: '2023/123456',
      barcode: 'LIB-001234'
    });
    console.log('\n📚 Library Book Pass QR Data:');
    console.log(libraryPass.qrData);
    console.log('Expires:', libraryPass.expiresAt);
    
    // Test Visitor Pass
    const visitorPass = await generateTestQRPass({
      type: 'visitor_pass',
      entityId: 1,
      entityType: 'visitor',
      visitorName: 'John Doe',
      purpose: 'Meeting with Dean'
    });
    console.log('\n👤 Visitor Pass QR Data:');
    console.log(visitorPass.qrData);
    console.log('Expires:', visitorPass.expiresAt);
    
    console.log('\n🎯 Test QR Passes Generated Successfully!');
    console.log('📱 Use these QR codes to test at: http://localhost:3000/security/gateway');
    console.log('💡 Copy any QR data above and generate a QR code image to test scanning');
    console.log('🔗 QR Code Generator: https://qr-code-generator.com/');
    
  } catch (error) {
    console.error('❌ Error generating test passes:', error.message);
  }
}

generateTestQRPasses();
