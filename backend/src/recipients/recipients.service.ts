// Removed misplaced duplicate of findByAccountId
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recipient, RecipientType } from './recipients.entity';
import { CreateRecipientDto } from './dto/create-recipient.dto';
import { UpdateRecipientDto } from './dto/update-recipient.dto';

// If you have a Transaction entity, import it for relation checks
// import { Transaction } from '../transactions/transaction.entity';

@Injectable()
export class RecipientsService {
  constructor(
    @InjectRepository(Recipient)
    private readonly recipientRepository: Repository<Recipient>,
    // @InjectRepository(Transaction)
    // private readonly transactionRepository: Repository<Transaction>,
  ) {}

  /** 1. Create a new recipient */
  async create(createRecipientDto: CreateRecipientDto): Promise<Recipient> {
    // Optional: Check for duplicate GST
    if (createRecipientDto.gst_number) {
      const existing = await this.recipientRepository.findOne({
        where: { gst_number: createRecipientDto.gst_number },
      });
      if (existing) {
        throw new BadRequestException(
          'Recipient with this GST number already exists.',
        );
      }
    }
    const recipient = this.recipientRepository.create(createRecipientDto);
    return await this.recipientRepository.save(recipient);
  }

  /** 2. Get all recipients */
  async findAll(): Promise<Recipient[]> {
    return await this.recipientRepository.find();
  }

  /** 3. Get recipient by ID */
  async findOne(id: number): Promise<Recipient> {
    const recipient = await this.recipientRepository.findOne({ where: { id } });
    if (!recipient) throw new NotFoundException('Recipient not found.');
    return recipient;
  }

  /** 4. Update recipient by ID */
  async update(
    id: number,
    updateRecipientDto: UpdateRecipientDto,
  ): Promise<Recipient> {
    const recipient = await this.recipientRepository.findOne({ where: { id } });
    if (!recipient) throw new NotFoundException('Recipient not found.');
    Object.assign(recipient, updateRecipientDto);
    return await this.recipientRepository.save(recipient);
  }

  /** 5. Delete recipient by ID (restrict if linked transactions) */
  async remove(id: number): Promise<void> {
    const recipient = await this.recipientRepository.findOne({ where: { id } });
    if (!recipient) throw new NotFoundException('Recipient not found.');

    // Restrict delete if linked transactions exist (to be implemented)
    // const txCount = await this.transactionRepository.count({ where: { recipient_id: id } });
    // if (txCount > 0) {
    //   throw new BadRequestException('Cannot delete recipient with linked transactions.');
    // }

    await this.recipientRepository.delete(id);
  }

  /** 6. Find all recipients by type */
  async findByType(recipient_type: RecipientType): Promise<Recipient[]> {
    return await this.recipientRepository.find({ where: { recipient_type } });
  }

  /** 7. Search recipients by name */
  async findByName(name: string): Promise<Recipient[]> {
    return await this.recipientRepository
      .createQueryBuilder('recipient')
      .where('recipient.name ILIKE :name', { name: `%${name}%` })
      .getMany();
  }

  /** 8. Lookup recipient by GST number */
  async findByGSTNumber(gst_number: string): Promise<Recipient | undefined> {
    return await this.recipientRepository.findOne({ where: { gst_number } });
  }

  /** 9. Find all recipients under a particular account (via transactions) */
  async findByAccount(_account_id: number): Promise<Recipient[]> {
    // Placeholder: This assumes you'll later have a Transaction entity
    // that links accounts to recipients. This query gets unique recipients
    // who have transactions from the given account.

    // Example with real transactions:

    return await this.recipientRepository
      .createQueryBuilder('recipient')
      .innerJoin(
        'transactions',
        'transaction',
        'transaction.recipient_id = recipient.id',
      )
      .where('transaction.account_id = :account_id', {
        account_id: _account_id,
      })
      .distinct(true)
      .getMany();

    // For now, returns an empty array until transactions are implemented:

    return [];
  }

  /** 9a. Find recipients belonging to a particular account ID
   * For account A recipients page, this returns:
   * - All regular recipients (customer, supplier, etc.) created for account A
   * - Excludes all ACCOUNT-type recipients and OWNER-type recipients (Self) from view
   */
  async findByAccountId(account_id: number): Promise<Recipient[]> {
    return await this.recipientRepository
      .createQueryBuilder('recipient')
      .where('recipient.account_id = :account_id', { account_id })
      .andWhere('recipient.recipient_type != :accountType', {
        accountType: RecipientType.ACCOUNT,
      })
      .andWhere('recipient.recipient_type != :ownerType', {
        ownerType: RecipientType.OWNER,
      })
      .getMany();
  }

  /** 9b. Find recipients for general transactions (suppliers, customers, etc.)
   * For account A transaction creation, this returns:
   * - All regular recipients (customer, supplier, etc.) created for account A
   * - Excludes ACCOUNT-type recipients as they are only for specific use cases like bank charges
   * - Excludes OWNER-type recipients (Self) as they are auto-assigned for cash deposits
   */
  async findRecipientsForTransactions(
    account_id: number,
  ): Promise<Recipient[]> {
    return await this.recipientRepository
      .createQueryBuilder('recipient')
      .where(
        'recipient.account_id = :account_id AND recipient.recipient_type != :accountType AND recipient.recipient_type != :ownerType',
        {
          account_id,
          accountType: RecipientType.ACCOUNT,
          ownerType: RecipientType.OWNER,
        },
      )
      .getMany();
  }

  /** 11. Find ACCOUNT-type recipients for internal transfers (excludes source account) */
  async findAccountRecipientsForTransfer(
    sourceAccountId: number,
  ): Promise<Recipient[]> {
    return await this.recipientRepository
      .createQueryBuilder('recipient')
      .where('recipient.recipient_type = :type', {
        type: RecipientType.ACCOUNT,
      })
      .andWhere('recipient.account_id != :sourceAccountId', { sourceAccountId })
      .andWhere('recipient.account_id IS NOT NULL')
      .getMany();
  }
}
