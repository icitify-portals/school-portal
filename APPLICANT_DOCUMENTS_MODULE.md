# Applicant Documents & Role Transition Module

This module manages the upload and approval of applicant documents (passport photos and signatures) and handles role transitions from applicant to fresher to student status.

## Overview

The module implements a complete workflow for:
1. **Document Management**: Upload, review, and approve applicant documents
2. **Role Transitions**: Automatic and manual role transitions through admission stages
3. **Access Control**: Role-based access to document upload functionality
4. **Audit Trail**: Complete tracking of all role transitions and document approvals

## Key Features

### 1. Document Management System
- **File Upload**: Secure upload of passport photos and signatures
- **File Validation**: Type checking, size limits, and format validation
- **Review Process**: Admin approval/rejection workflow with reasons
- **Status Tracking**: Real-time status updates for applicants

### 2. Role Transition System
- **Applicant → Fresher**: Upon admission confirmation
- **Fresher → Student**: After document approval and registration
- **Manual Transitions**: Admin-controlled role changes
- **Audit Logging**: Complete history of all role changes

### 3. Access Control
- **Applicant**: Can only view admission status
- **Fresher**: Can upload required documents
- **Student**: Full access to student portal
- **Admin/Staff**: Document approval and role management

## Database Schema

### Updated Tables

#### `users` (Modified)
```sql
role: ENUM('admin', 'staff', 'student', 'applicant', 'fresher') DEFAULT 'applicant'
```

### New Tables

#### `applicant_documents`
```sql
- id: Primary key
- user_id: Reference to users table
- document_type: 'passport_photo' or 'signature'
- file_url: Path to uploaded file
- file_name: Original filename
- file_size: File size in bytes
- mime_type: File MIME type
- status: 'pending', 'approved', or 'rejected'
- uploaded_at: Upload timestamp
- approved_by: Admin who approved
- approved_at: Approval timestamp
- rejection_reason: Reason for rejection
```

#### `role_transitions`
```sql
- id: Primary key
- user_id: Reference to users table
- from_role: Previous role
- to_role: New role
- transition_type: 'admission_utme', 'admission_de', or 'manual'
- reason: Transition reason
- academic_session: Academic session
- level: Student level (100 for UTME, 200 for DE)
- matric_number: Assigned matric number
- programme_id: Reference to programmes table
- processed_by: Admin who processed transition
- processed_at: Transition timestamp
```

## User Workflows

### 1. Applicant Workflow
```
1. JAMB Verification → Role: applicant
2. Profile Claim → Role: applicant
3. Wait for Admission → Role: applicant
4. Admission Confirmation → Role: fresher
5. Document Upload → Role: fresher
6. Document Approval → Role: student
```

### 2. Document Upload Process (Fresher Only)
```
1. Access Fresher Portal (/fresher)
2. Upload Passport Photo
3. Upload Signature
4. Wait for Admin Review
5. Receive Approval/Rejection
6. Re-upload if Rejected
7. Proceed to Registration when Approved
```

### 3. Admin Review Process
```
1. Access Document Center (/admin/applicant-documents)
2. Filter by Status/Type
3. Review Documents
4. Approve or Reject with Reasons
5. Track Statistics
6. Manage Role Transitions
```

## API Endpoints

### Document Upload
- **POST** `/api/upload-document`
  - Headers: `X-Document-Type: passport_photo|signature`
  - Body: FormData with file
  - Response: Success/error message

### Document Management
- `uploadApplicantDocument()` - Upload document with validation
- `getApplicantDocuments()` - Get current user's documents
- `getAllApplicantDocuments()` - Get all documents (admin)
- `approveDocument()` - Approve document
- `rejectDocument()` - Reject document with reason

### Role Management
- `transitionUserRole()` - Transition user role
- `getRoleTransitions()` - Get transition history
- `canUploadDocuments()` - Check upload permissions
- `getDocumentUploadStatus()` - Get upload completion status

## File Upload Specifications

### Supported Formats
- **Images**: JPEG, PNG, JPG
- **Maximum Size**: 2MB per file
- **Storage**: `/public/uploads/applicant-documents/`

### File Naming Convention
```
{userId}_{documentType}_{timestamp}.{extension}
Example: 123_passport_photo_1640995200000.jpg
```

### Validation Rules
- File type checking
- File size limits
- MIME type verification
- Secure file storage

## User Interfaces

### Fresher Portal (`/fresher`)
- **Document Upload Dashboard**: Progress tracking and upload interface
- **Status Display**: Real-time approval status
- **Requirements Display**: Document specifications and guidelines
- **Re-upload Functionality**: Handle rejected documents

### Admin Document Center (`/admin/applicant-documents`)
- **Document Review Interface**: Preview and approve/reject documents
- **Filtering System**: Status, type, and search filters
- **Statistics Dashboard**: Overview of approval rates
- **Bulk Actions**: Mass approval capabilities

### Role Transition Management (`/admin/role-transitions`)
- **Transition History**: Complete audit trail
- **Manual Transitions**: Override automatic transitions
- **User Search**: Find users for manual role changes
- **Statistics**: Transition metrics and analytics

## Document Requirements

### Passport Photo Requirements
- **Format**: JPEG or PNG
- **Size**: Maximum 2MB
- **Content**: Recent passport-sized photograph
- **Background**: Plain white background
- **Quality**: Clear face visibility
- **Specifications**: Standard passport photo dimensions

### Signature Requirements
- **Format**: JPEG or PNG
- **Size**: Maximum 2MB
- **Content**: Clear signature on white background
- **Ink Color**: Black or dark blue ink
- **Quality**: Proper size and clarity
- **Specifications**: Scanned or photographed signature

## Role Transition Logic

### Automatic Transitions

#### Admission Confirmation (Applicant → Fresher)
```typescript
// Triggered when admission is confirmed
await transitionUserRole(
  userId,
  'fresher',
  'admission_utme', // or 'admission_de'
  academicSession,
  100, // or 200 for DE
  null, // matric number assigned later
  programmeId,
  'Admission confirmed'
);
```

#### Document Approval (Fresher → Student)
```typescript
// Triggered when all documents are approved
await transitionUserRole(
  userId,
  'student',
  'manual',
  academicSession,
  currentLevel,
  matricNumber,
  programmeId,
  'Documents approved and ready for registration'
);
```

### Manual Transitions
- Admin-initiated role changes
- Special circumstances handling
- Bulk role updates
- Error corrections

## Security Features

### File Security
- **Path Traversal Protection**: Secure file path handling
- **File Type Validation**: MIME type and extension checking
- **Size Limits**: Prevent oversized uploads
- **Secure Storage**: Isolated upload directory

### Access Control
- **Role-Based Access**: Different permissions per role
- **Authentication Required**: All actions require login
- **Authorization Checks**: Verify user permissions
- **Audit Logging**: Track all administrative actions

## Error Handling

### Upload Errors
- **Invalid File Type**: Clear error messages
- **Size Exceeded**: Inform user of limits
- **Storage Issues**: Handle disk space problems
- **Network Errors**: Retry mechanisms

### Validation Errors
- **Missing Required Fields**: Form validation
- **Permission Denied**: Access control messages
- **Role Restrictions**: Clear role-based explanations

## Performance Optimization

### File Handling
- **Streaming Upload**: Handle large files efficiently
- **Compression**: Optimize file storage
- **Caching**: Cache frequently accessed documents
- **CDN Integration**: Optional CDN for file delivery

### Database Optimization
- **Indexing**: Proper database indexes
- **Query Optimization**: Efficient data retrieval
- **Connection Pooling**: Handle concurrent requests
- **Caching**: Cache role and permission data

## Monitoring and Analytics

### Document Statistics
- Upload rates by document type
- Approval/rejection ratios
- Processing times
- Error rates

### Role Transition Analytics
- Transition frequency
- Time between transitions
- Manual vs automatic transitions
- Role distribution metrics

## Integration Points

### Admission System
- Seamless integration with existing admission flow
- Automatic role transitions on admission confirmation
- Document requirements based on programme

### Registration System
- Document approval prerequisite for registration
- Role-based registration access
- Matric number assignment

### Student Information System
- Complete student profile with documents
- Role-based access to student services
- Historical data preservation

## Configuration

### File Upload Settings
```typescript
const uploadConfig = {
  maxFileSize: 2 * 1024 * 1024, // 2MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/jpg'],
  uploadPath: '/public/uploads/applicant-documents/',
  maxRetries: 3
};
```

### Role Transition Settings
```typescript
const roleConfig = {
  automaticTransitions: true,
  requireDocumentApproval: true,
  defaultAcademicSession: '2026/2027',
  transitionNotifications: true
};
```

## Troubleshooting

### Common Issues
1. **Upload Failures**: Check file size and format
2. **Permission Errors**: Verify user role and permissions
3. **Role Transition Issues**: Check transition logic and prerequisites
4. **Document Not Found**: Verify file paths and storage

### Debug Tools
- File upload logs
- Role transition history
- Error tracking system
- Performance monitoring

## Migration Guide

### Database Migration
1. Run `0011_applicant_documents.sql`
2. Update existing user roles if needed
3. Create upload directories
4. Set proper file permissions

### Data Migration
```sql
-- Update existing users to applicant role if needed
UPDATE users SET role = 'applicant' WHERE role = 'student' AND id NOT IN (SELECT user_id FROM students);
```

## Future Enhancements

### Planned Features
- **Document OCR**: Automatic text extraction from documents
- **Face Recognition**: Automated passport photo validation
- **Digital Signatures**: Support for digital signature formats
- **Mobile App**: Native mobile document upload
- **Batch Processing**: Bulk document approval
- **Integration APIs**: External system integration

### Scalability Improvements
- **Cloud Storage**: S3/Google Cloud integration
- **Microservices**: Separate document service
- **Load Balancing**: Distribute upload processing
- **Caching Layer**: Redis integration for performance

## Support and Maintenance

### Regular Tasks
- Monitor storage usage
- Review approval queues
- Update role configurations
- Backup document storage

### Support Documentation
- User guides for document upload
- Admin training materials
- API documentation
- Troubleshooting guides

This module provides a comprehensive solution for managing applicant documents and role transitions while maintaining security, performance, and user experience standards.
