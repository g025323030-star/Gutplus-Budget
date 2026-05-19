import { Holiday } from '../enums/holiday.enum';

export interface HolidayExpenseTemplate {
  holiday: Holiday;
  displayName: string;
  defaultItems: string[];
}
