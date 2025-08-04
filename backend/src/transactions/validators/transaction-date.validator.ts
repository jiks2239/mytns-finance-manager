import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { TransactionStatus } from '../transactions.enums';

export function IsValidTransactionDate(
  statusProperty: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isValidTransactionDate',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [statusProperty],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) {
            // If no date is provided, it's optional and will default to current date
            return true;
          }

          const [statusPropertyName] = args.constraints;
          const status = (args.object as any)[statusPropertyName];

          if (!status) {
            // If no status is provided, let other validators handle it
            return true;
          }

          const transactionDate = new Date(value);
          const today = new Date();
          today.setHours(23, 59, 59, 999); // End of today

          // Completed statuses should have dates in the past or today
          const completedStatuses = [
            TransactionStatus.DEPOSITED,
            TransactionStatus.CLEARED,
            TransactionStatus.SETTLED,
            TransactionStatus.TRANSFERRED,
            TransactionStatus.DEBITED,
            TransactionStatus.RECEIVED,
            TransactionStatus.CANCELLED,
          ];

          if (completedStatuses.includes(status)) {
            return transactionDate <= today;
          }

          // Pending transactions can have any date (past, present, or future)
          if (status === TransactionStatus.PENDING) {
            return true;
          }

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          const [statusPropertyName] = args.constraints;
          const status = (args.object as any)[statusPropertyName];

          const completedStatuses = [
            TransactionStatus.DEPOSITED,
            TransactionStatus.CLEARED,
            TransactionStatus.SETTLED,
            TransactionStatus.TRANSFERRED,
            TransactionStatus.DEBITED,
            TransactionStatus.RECEIVED,
            TransactionStatus.CANCELLED,
          ];

          if (completedStatuses.includes(status)) {
            return `Transaction date cannot be in the future when status is "${status}". Completed transactions must have a date in the past or today.`;
          }

          return 'Invalid transaction date for the given status';
        },
      },
    });
  };
}
