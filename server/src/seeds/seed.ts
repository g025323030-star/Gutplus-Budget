import 'reflect-metadata';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/user.entity';
import { Household } from '../entities/household.entity';
import { FamilyMember, FamilyMemberRole } from '../entities/family-member.entity';
import { Account, AccountType } from '../entities/account.entity';
import { Category, CategoryType, CategoryFrequency } from '../entities/category.entity';
import { BudgetItem } from '../entities/budget-item.entity';
import { BudgetPlan } from '../entities/budget-plan.entity';

async function seedDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('🗄️ Database connected');

    // Clear existing data (only in non-production environments)
    if (process.env.NODE_ENV !== 'production') {
      const queryRunner = AppDataSource.createQueryRunner();
      console.log('🧹 Clearing existing data...');
      try {
        // Use TRUNCATE ... CASCADE to handle foreign key constraints
        await queryRunner.query(
          'TRUNCATE TABLE "budget_item" CASCADE'
        );
        await queryRunner.query(
          'TRUNCATE TABLE "budget_plan" CASCADE'
        );
        await queryRunner.query(
          'TRUNCATE TABLE "category" CASCADE'
        );
        await queryRunner.query(
          'TRUNCATE TABLE "family_member" CASCADE'
        );
        await queryRunner.query(
          'TRUNCATE TABLE "account" CASCADE'
        );
        await queryRunner.query(
          'TRUNCATE TABLE "household" CASCADE'
        );
        await queryRunner.query(
          'TRUNCATE TABLE "user" CASCADE'
        );
        console.log('✅ Existing data cleared');
      } catch (clearError) {
        const errorMessage =
          clearError instanceof Error
            ? clearError.message
            : 'Unknown error';
        console.warn(
          '⚠️ Warning: Could not clear tables. Tables may be empty already.',
          errorMessage
        );
      }
    } else {
      console.log(
        '⏭️ Skipping data clear in production environment'
      );
    }

    // Create Users
    console.log('👤 Creating users...');
    const userRepository = AppDataSource.getRepository(User);
    const user1 = await userRepository.save({
      lastName: 'כהן',
      cycle: 'Standard',
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      subscriptionType: 'Monthly',
      email: 'david.cohen@example.com',
      password: 'password123', // במציאות - צריך להצפין
    });

    const user2 = await userRepository.save({
      lastName: 'לוי',
      cycle: 'Premium',
      expirationDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000),
      subscriptionType: 'Yearly',
      email: 'sarah.levy@example.com',
      password: 'password456',
    });

    console.log('✅ Users created');

    // Create Households
    console.log('🏠 Creating households...');
    const householdRepository = AppDataSource.getRepository(Household);
    const household1 = await householdRepository.save({
      name: 'משפחת כהן',
      email: 'david.cohen@example.com',
      familySize: 4,
      user: user1,
    });

    const household2 = await householdRepository.save({
      name: 'משפחת לוי',
      email: 'sarah.levy@example.com',
      familySize: 3,
      user: user2,
    });

    console.log('✅ Households created');

    // Create Family Members
    console.log('👨‍👩‍👧‍👦 Creating family members...');
    const familyMemberRepository = AppDataSource.getRepository(FamilyMember);
    await familyMemberRepository.save([
      {
        name: 'דוד כהן',
        role: FamilyMemberRole.Parent,
        household: household1,
      },
      {
        name: 'רחל כהן',
        role: FamilyMemberRole.Parent,
        household: household1,
      },
      {
        name: 'אביב כהן',
        role: FamilyMemberRole.Child,
        household: household1,
      },
      {
        name: 'סרה לוי',
        role: FamilyMemberRole.Parent,
        household: household2,
      },
      {
        name: 'אהרן לוי',
        role: FamilyMemberRole.Parent,
        household: household2,
      },
    ]);

    console.log('✅ Family members created');

    // Create Accounts
    console.log('🏦 Creating accounts...');
    const accountRepository = AppDataSource.getRepository(Account);
    const account1 = await accountRepository.save({
      name: 'חשבון בנק ראשי',
      type: AccountType.BANK,
      balance: '15000',
      currency: 'ILS',
      monthlyPayment: null,
      interestRate: null,
      urgencyLevel: 1,
      household: household1,
    });

    const account2 = await accountRepository.save({
      name: 'כרטיס אשראי',
      type: AccountType.CREDIT_CARD,
      balance: '2500',
      currency: 'ILS',
      monthlyPayment: '500',
      interestRate: '9.5',
      urgencyLevel: 3,
      household: household1,
    });

    const account3 = await accountRepository.save({
      name: 'חשבון חסכון',
      type: AccountType.BANK,
      balance: '50000',
      currency: 'ILS',
      monthlyPayment: null,
      interestRate: null,
      urgencyLevel: 1,
      household: household2,
    });

    console.log('✅ Accounts created');

    // Create Categories (global defaults — no household, no frequency)
    console.log('🏷️ Creating categories...');
    const categoryRepository = AppDataSource.getRepository(Category);
    const expenseCategory = await categoryRepository.save({
      name: 'הוצאות ביתיות',
      type: CategoryType.EXPENSE,
      household: null,
      parentCategory: null,
    });

    const groceryCategory = await categoryRepository.save({
      name: 'מכולת',
      type: CategoryType.EXPENSE,
      household: null,
      parentCategory: expenseCategory,
    });

    const utilityCategory = await categoryRepository.save({
      name: 'חשמל ומים',
      type: CategoryType.EXPENSE,
      household: null,
      parentCategory: expenseCategory,
    });

    const incomeCategory = await categoryRepository.save({
      name: 'הכנסות',
      type: CategoryType.INCOME,
      household: null,
      parentCategory: null,
    });

    console.log('✅ Categories created');

    // Create Budget Items
    console.log('💳 Creating budget items...');
    const budgetItemRepository = AppDataSource.getRepository(BudgetItem);
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    await budgetItemRepository.save([
      {
        amount: '450',
        date: today,
        description: 'קנייה במכולת',
        needsReview: false,
        frequency: CategoryFrequency.MONTHLY,
        endDate: null,
        household: household1,
        category: groceryCategory,
        account: account1,
      },
      {
        amount: '180',
        date: sevenDaysAgo,
        description: 'בדק מים וחשמל',
        needsReview: false,
        frequency: CategoryFrequency.MONTHLY,
        endDate: null,
        household: household1,
        category: utilityCategory,
        account: account1,
      },
      {
        amount: '5000',
        date: thirtyDaysAgo,
        description: 'שכר חודשי',
        needsReview: false,
        frequency: CategoryFrequency.MONTHLY,
        endDate: null,
        household: household1,
        category: incomeCategory,
        account: account1,
      },
      {
        amount: '125',
        date: today,
        description: 'תשלום כרטיס אשראי',
        needsReview: false,
        frequency: CategoryFrequency.MONTHLY,
        endDate: null,
        household: household1,
        category: null,
        account: account2,
      },
    ]);

    console.log('✅ תחומים נוצרו');

    // Create Budget Plans
    console.log('📊 Creating budget plans...');
    const budgetPlanRepository = AppDataSource.getRepository(BudgetPlan);
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    await budgetPlanRepository.save([
      {
        amount: '800',
        month: currentMonth,
        year: currentYear,
        household: household1,
        category: groceryCategory,
      },
      {
        amount: '300',
        month: currentMonth,
        year: currentYear,
        household: household1,
        category: utilityCategory,
      },
      {
        amount: '1000',
        month: currentMonth,
        year: currentYear,
        household: household1,
        category: expenseCategory,
      },
    ]);

    console.log('✅ Budget plans created');

    console.log('✨ Seed data created successfully!');
    console.log(`\n📧 Test users created:`);
    console.log(`  1. Email: david.cohen@example.com`);
    console.log(`  2. Email: sarah.levy@example.com`);

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
