import { Holiday } from '../enums/holiday.enum';

export interface HolidayExpenseItemGroup {
  groupName: string;
  items: string[];
}

export interface HolidayExpenseTemplate {
  holiday: Holiday;
  displayName: string;
  itemGroups: HolidayExpenseItemGroup[];
}
