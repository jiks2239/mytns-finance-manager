import {
  IsOptional,
  IsString,
  IsDateString,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

// Custom validator to check that cleared date is not before due date
function IsClearedDateValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isClearedDateValid',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as CreateChequeTransactionDetailsDto;
          if (!value || !obj.cheque_due_date) return true; // Skip validation if either date is missing

          const dueDate = new Date(obj.cheque_due_date);
          const clearedDate = new Date(value);

          // Reset time to midnight for date-only comparison
          dueDate.setHours(0, 0, 0, 0);
          clearedDate.setHours(0, 0, 0, 0);

          return clearedDate >= dueDate;
        },
        defaultMessage() {
          return 'Cheque cleared date cannot be before the due date';
        },
      },
    });
  };
}

export class CreateChequeTransactionDetailsDto {
  @IsString()
  cheque_number: string;

  @IsDateString()
  @IsOptional()
  cheque_issue_date?: string; // Renamed from cheque_given_date

  @IsDateString()
  @IsOptional()
  cheque_submitted_date?: string; // NEW: For cheque submission tracking

  @IsDateString()
  cheque_due_date: string;

  @IsDateString()
  @IsOptional()
  @IsClearedDateValid({
    message: 'Cheque cleared date cannot be before the due date',
  })
  cheque_cleared_date?: string;

  @IsOptional()
  cheque_bounce_charge?: number; // NEW: For bounced cheques

  @IsString()
  @IsOptional()
  notes?: string;
}
