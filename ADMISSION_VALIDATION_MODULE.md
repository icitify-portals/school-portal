# Admission Validation Module

This module implements comprehensive validation for UTME subject combinations and O-Level requirements in the school admission system.

## Overview

The Admission Validation Module ensures that candidates meet the specific subject requirements for their chosen programmes before admission. It provides:

1. **UTME Subject Combination Validation** - Validates that candidates have the correct UTME subjects for their programme
2. **O-Level Requirements Validation** - Validates O-Level results against programme requirements
3. **Flexible Configuration** - Institutions can configure requirements per programme
4. **Real-time Validation** - Automatic validation during the admission process
5. **Comprehensive Reporting** - Detailed validation reports and statistics

## Features

### 1. UTME Subject Validation
- **Compulsory Subjects**: Define subjects that must be taken
- **Alternative Subjects**: Allow alternative subject combinations
- **Subject Mapping**: Map candidate UTME subjects to programme requirements
- **Validation Logic**: Automatic validation with detailed feedback

### 2. O-Level Requirements Validation
- **Minimum Grade Requirements**: Set minimum acceptable grades per subject
- **Two Sitting Support**: Configure whether to accept combined results from different exam bodies
- **Sixth Subject Requirement**: Optional requirement for 6 subjects instead of 5
- **Grade Validation**: Automatic grade comparison against minimum requirements

### 3. Programme Configuration
- **Per-Programme Setup**: Different requirements for each programme
- **Template System**: Pre-configured templates for common programme types
- **Bulk Configuration**: Copy requirements between programmes
- **Flexible Rules**: Support for complex validation scenarios

## Database Schema

### New Tables

#### `programme_utme_requirements`
```sql
- id: Primary key
- programme_id: Reference to programmes table
- subject_name: Name of the required subject
- is_compulsory: Whether the subject is mandatory
- is_alternative: Whether alternative subjects are allowed
- alternative_subjects: JSON array of alternative subjects
- created_at: Timestamp
```

#### `programme_o_level_requirements`
```sql
- id: Primary key
- programme_id: Reference to programmes table
- subject_name: Name of the required subject
- is_compulsory: Whether the subject is mandatory
- min_grade: Minimum acceptable grade (e.g., 'C6')
- accept_two_sittings: Whether to accept results from two sittings
- sixth_subject_required: Whether 6 subjects are required
- created_at: Timestamp
```

#### `admission_validations`
```sql
- id: Primary key
- jamb_reg_no: Reference to JAMB candidate
- programme_id: Reference to programme
- utme_subjects_valid: UTME validation result
- utme_validation_details: Detailed UTME validation info
- o_level_valid: O-Level validation result
- o_level_validation_details: Detailed O-Level validation info
- overall_status: Overall validation status
- validated_at: Validation timestamp
- validated_by: User who performed validation
```

### Updated Tables

#### `jamb_candidates` (Added columns)
```sql
- utme_subjects_valid: UTME validation status
- o_level_valid: O-Level validation status
- validation_details: JSON validation details
- validation_status: Overall validation status
- validated_at: Last validation timestamp
```

## API Actions

### Validation Actions (`/src/actions/admission-validation.ts`)

#### `validateUtmeSubjects(jambRegNo, programmeId)`
Validates UTME subjects against programme requirements.

#### `validateOLevelResults(jambRegNo, programmeId)`
Validates O-Level results against programme requirements.

#### `validateCandidateAdmission(jambRegNo, programmeId)`
Performs comprehensive validation of both UTME and O-Level requirements.

#### `getCandidateValidationStatus(jambRegNo)`
Retrieves current validation status for a candidate.

#### `batchValidateProgrammeCandidates(programmeId)`
Validates all candidates for a specific programme.

### Requirements Management (`/src/actions/programme-requirements.ts`)

#### UTME Requirements
- `addUtmeRequirement()` - Add new UTME requirement
- `updateUtmeRequirement()` - Update existing requirement
- `deleteUtmeRequirement()` - Remove requirement

#### O-Level Requirements
- `addOLevelRequirement()` - Add new O-Level requirement
- `updateOLevelRequirement()` - Update existing requirement
- `deleteOLevelRequirement()` - Remove requirement

#### Templates
- `applyUtmeTemplate()` - Apply pre-configured UTME template
- `applyOLevelTemplate()` - Apply pre-configured O-Level template
- `copyProgrammeRequirements()` - Copy requirements between programmes

## Pre-configured Templates

### UTME Subject Templates

#### ENGINEERING
- **Compulsory**: English Language, Mathematics, Physics, Chemistry
- **Alternatives**: None

#### MEDICINE
- **Compulsory**: English Language, Mathematics, Physics, Chemistry, Biology
- **Alternatives**: None

#### LAW
- **Compulsory**: English Language, Literature in English
- **Alternatives**: 
  - Government: Economics, History, Geography, CRS/IRS
  - Mathematics: Economics, Commerce, Accounting

#### COMPUTER_SCIENCE
- **Compulsory**: English Language, Mathematics, Physics
- **Alternatives**: Chemistry, Biology, Economics, Geography

#### MASS_COMMUNICATION
- **Compulsory**: English Language, Literature in English
- **Alternatives**: Government, Economics, History, Geography, CRS/IRS, Mathematics

### O-Level Templates

#### SCIENCE
- **Compulsory**: English Language, Mathematics, Physics, Chemistry
- **Optional**: Biology, Agricultural Science, Geography
- **Min Grade**: C6
- **Two Sittings**: Accepted
- **6th Subject**: Required

#### ARTS
- **Compulsory**: English Language, Literature in English
- **Optional**: Government, History, Geography, CRS/IRS, Economics
- **Min Grade**: C6
- **Two Sittings**: Accepted
- **6th Subject**: Required

#### SOCIAL_SCIENCE
- **Compulsory**: English Language, Mathematics
- **Optional**: Economics, Government, Geography, Accounting, Commerce
- **Min Grade**: C6
- **Two Sittings**: Accepted
- **6th Subject**: Required

#### MEDICINE
- **Compulsory**: English Language, Mathematics, Physics, Chemistry, Biology
- **Optional**: Agricultural Science, Geography
- **Min Grade**: B3
- **Two Sittings**: Not Accepted
- **6th Subject**: Not Required

## User Interface

### Admin Interfaces

#### Validation Dashboard (`/admin/admission/validation`)
- Overview of validation statistics
- Programme-wise validation status
- Batch validation capabilities
- Filter and search candidates
- Detailed validation reports

#### Requirements Configuration (`/admin/admission/validation/requirements`)
- Programme selection interface
- UTME requirements management
- O-Level requirements management
- Template application
- Bulk operations

#### Updated Admission Ledger (`/admin/admission`)
- Enhanced candidate listing with validation status
- Real-time validation indicators
- Quick access to validation details

### Student Interface

#### Updated Claim Process (`/admission/claim`)
- Real-time validation status display
- Detailed validation feedback
- Clear indication of requirements met/not met

## Implementation Workflow

### 1. Setup Phase
1. Run database migration (`0010_admission_validation.sql`)
2. Configure programme requirements
3. Apply appropriate templates
4. Set up validation rules

### 2. Validation Phase
1. Import JAMB candidate data
2. Run batch validation for programmes
3. Review validation results
4. Handle special cases manually

### 3. Admission Phase
1. Candidates claim profiles
2. System displays validation status
3. Invalid combinations are flagged
4. Admin can make manual overrides if needed

## Configuration Examples

### Engineering Programme Setup
```typescript
// UTME Requirements
await addUtmeRequirement(1, "English Language", true, false, []);
await addUtmeRequirement(1, "Mathematics", true, false, []);
await addUtmeRequirement(1, "Physics", true, false, []);
await addUtmeRequirement(1, "Chemistry", true, false, []);

// O-Level Requirements
await addOLevelRequirement(1, "English Language", true, "C6", true, true);
await addOLevelRequirement(1, "Mathematics", true, "C6", true, true);
await addOLevelRequirement(1, "Physics", true, "C6", true, true);
await addOLevelRequirement(1, "Chemistry", true, "C6", true, true);
await addOLevelRequirement(1, "Biology", false, "C6", true, true);
```

### Law Programme with Alternatives
```typescript
// UTME Requirements with alternatives
await addUtmeRequirement(1, "English Language", true, false, []);
await addUtmeRequirement(1, "Literature in English", true, false, []);
await addUtmeRequirement(1, "Government", false, true, ["Economics", "History", "Geography", "CRS/IRS"]);
await addUtmeRequirement(1, "Mathematics", false, true, ["Economics", "Commerce", "Accounting"]);
```

## Validation Logic

### UTME Validation Process
1. Parse candidate UTME subjects from JSON
2. Retrieve programme requirements
3. Check compulsory subjects are present
4. Validate alternative subject combinations
5. Generate detailed validation report
6. Update candidate validation status

### O-Level Validation Process
1. Retrieve all O-Level results for candidate
2. Check sitting requirements (single vs. two sittings)
3. Validate minimum grade requirements
4. Check subject count requirements
5. Generate detailed validation report
6. Update candidate validation status

### Grade Comparison Logic
```typescript
const gradeOrder = ['A1', 'B2', 'B3', 'C4', 'C5', 'C6', 'D7', 'E8', 'F9'];
function isGradePassing(candidateGrade: string, minGrade: string): boolean {
  return gradeOrder.indexOf(candidateGrade) <= gradeOrder.indexOf(minGrade);
}
```

## Error Handling

### Common Validation Errors
- **Missing Compulsory Subject**: Required subject not found in candidate results
- **Insufficient Grade**: Candidate grade below minimum requirement
- **Invalid Sitting Combination**: Multiple sittings when not allowed
- **Insufficient Subjects**: Less than required number of subjects
- **Invalid Subject Combination**: Wrong combination of alternatives

### Error Messages
The system provides detailed error messages to help candidates understand why their validation failed:
- Specific missing subjects
- Grade requirements not met
- Sitting policy violations
- Subject count requirements

## Reporting

### Validation Reports
- Programme-wise validation statistics
- Subject combination analysis
- Grade distribution reports
- Validation failure reasons
- Historical validation data

### Export Capabilities
- CSV export of validation results
- PDF reports for management
- Excel format for detailed analysis
- JSON export for integration

## Integration Points

### Existing Admission Flow
- Seamless integration with current admission process
- No disruption to existing workflows
- Backward compatibility with existing data
- Gradual rollout capability

### Future Enhancements
- API endpoints for external validation
- Mobile app integration
- Automated notification system
- Machine learning for requirement optimization

## Security Considerations

### Data Protection
- Encrypted storage of validation details
- Access control for validation configuration
- Audit trail for validation changes
- Secure API endpoints

### Validation Integrity
- Tamper-proof validation records
- Digital signatures for validation results
- Role-based validation permissions
- Validation history tracking

## Performance Optimization

### Batch Processing
- Efficient batch validation algorithms
- Background processing for large datasets
- Progress tracking for long operations
- Resource usage optimization

### Caching Strategy
- Cached validation results
- Programme requirement caching
- Optimized database queries
- Reduced database round trips

## Troubleshooting

### Common Issues
1. **Migration Failures**: Check database permissions and existing schema
2. **Validation Errors**: Verify programme requirements configuration
3. **Performance Issues**: Implement batch processing for large datasets
4. **UI Problems**: Check component imports and state management

### Debug Tools
- Validation detail logging
- Database query logging
- Performance monitoring
- Error tracking systems

## Migration Guide

### From Legacy System
1. Export existing admission data
2. Map current requirements to new schema
3. Run validation migration script
4. Verify validation results
5. Update UI components
6. Train administrators

### Data Migration
```sql
-- Example migration script
UPDATE jamb_candidates SET validation_status = 'PENDING' WHERE validation_status IS NULL;
```

## Support and Maintenance

### Regular Maintenance
- Monitor validation accuracy
- Update programme requirements
- Review validation templates
- Optimize performance

### Support Channels
- Technical documentation
- Admin training materials
- User guides
- Troubleshooting guides

This module provides a comprehensive solution for admission validation while maintaining flexibility for different institutional requirements and ensuring data integrity throughout the admission process.
