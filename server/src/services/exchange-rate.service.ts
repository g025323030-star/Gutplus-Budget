import { Repository } from 'typeorm';
import { CurrencyCode } from '@gutplus/shared';
import { AppDataSource } from '../config/data-source';
import { ExchangeRate } from '../entities/exchange-rate.entity';

const FRANKFURTER_BASE_URL = 'https://api.frankfurter.dev/v1/latest';

/** Returns today's date as YYYY-MM-DD (UTC). */
const todayIso = (): string => new Date().toISOString().slice(0, 10);

/**
 * Multiply two decimal strings without using floating-point arithmetic.
 * Rounds the result to 2 decimal places, returned as a string.
 */
const multiplyDecimals = (a: string, b: string): string => {
  // Count decimal places in each operand
  const [aInt, aFrac = ''] = a.split('.');
  const [bInt, bFrac = ''] = b.split('.');
  const aDecimals = aFrac.length;
  const bDecimals = bFrac.length;

  // Convert to integers by removing decimal points
  const aInteger = BigInt(aInt + aFrac);
  const bInteger = BigInt(bInt + bFrac);

  // Multiply
  const product = aInteger * bInteger;
  const totalDecimals = aDecimals + bDecimals;

  // Re-insert decimal point
  const productStr = product.toString();
  let result: string;
  if (totalDecimals === 0) {
    result = productStr;
  } else if (productStr.length <= totalDecimals) {
    result = '0.' + productStr.padStart(totalDecimals, '0');
  } else {
    const insertAt = productStr.length - totalDecimals;
    result = productStr.slice(0, insertAt) + '.' + productStr.slice(insertAt);
  }

  // Round to 2 decimal places
  const [intPart, fracPart = ''] = result.split('.');
  if (fracPart.length <= 2) {
    return intPart + '.' + fracPart.padEnd(2, '0');
  }
  // Round by looking at the 3rd decimal digit
  const thirdDigit = parseInt(fracPart[2], 10);
  const twoDigits = parseInt(fracPart.slice(0, 2), 10);
  const rounded = thirdDigit >= 5 ? twoDigits + 1 : twoDigits;
  if (rounded >= 100) {
    // Carry over into integer part
    const carried = (BigInt(intPart) + 1n).toString();
    return carried + '.00';
  }
  return intPart + '.' + rounded.toString().padStart(2, '0');
};

export class ExchangeRateService {
  private get repository(): Repository<ExchangeRate> {
    return AppDataSource.getRepository(ExchangeRate);
  }

  /**
   * Returns the exchange rate (as a decimal string) for converting 1 unit of
   * `currency` to ILS.
   *
   * Strategy:
   *   1. ILS → return '1' immediately.
   *   2. Check DB for a row with today's rate_date — return if found (cache hit).
   *   3. Fetch from Frankfurter API, persist, return.
   *   4. If fetch fails, fall back to the most recent stored rate and warn.
   *   5. If no stored rate, throw a descriptive error.
   */
  async getRateToIls(currency: CurrencyCode): Promise<string> {
    if (currency === CurrencyCode.ILS) {
      return '1';
    }

    const today = todayIso();
    const repo = this.repository;

    // Cache hit: today's rate already stored
    const cached = await repo.findOne({
      where: { currency, rateDate: today },
    });
    if (cached) {
      return cached.rateToIls;
    }

    // Fetch from Frankfurter
    let fetchedRate: string | null = null;
    try {
      const url = `${FRANKFURTER_BASE_URL}?base=${currency}&symbols=ILS`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Frankfurter responded with HTTP ${response.status}`);
      }
      const json = (await response.json()) as { rates?: { ILS?: number } };
      const ilsRate = json?.rates?.ILS;
      if (typeof ilsRate !== 'number' || !isFinite(ilsRate) || ilsRate <= 0) {
        throw new Error('Unexpected Frankfurter response: ILS rate missing or invalid');
      }
      fetchedRate = ilsRate.toFixed(6);
    } catch (fetchError) {
      console.warn(
        `[ExchangeRateService] Failed to fetch rate for ${currency}:`,
        fetchError,
      );
    }

    if (fetchedRate !== null) {
      // Persist to DB (upsert: ignore conflict on unique key)
      const entity = repo.create({
        currency,
        rateToIls: fetchedRate,
        rateDate: today,
      });
      try {
        await repo
          .createQueryBuilder()
          .insert()
          .into(ExchangeRate)
          .values(entity)
          .orIgnore()
          .execute();
      } catch {
        // Another request may have inserted simultaneously — not fatal
      }
      return fetchedRate;
    }

    // Fallback: most recent stored rate
    const fallback = await repo.findOne({
      where: { currency },
      order: { rateDate: 'DESC' },
    });
    if (fallback) {
      console.warn(
        `[ExchangeRateService] Using stale rate for ${currency} (date: ${fallback.rateDate})`,
      );
      return fallback.rateToIls;
    }

    throw new Error(
      `No exchange rate available for ${currency}. ` +
        'The network fetch failed and there is no stored fallback.',
    );
  }

  /**
   * Converts `amount` (in `currency`) to ILS.
   * For ILS, returns the amount unchanged.
   * Uses decimal-safe multiplication — never floats.
   */
  async convertToIls(amount: string, currency: CurrencyCode): Promise<string> {
    if (currency === CurrencyCode.ILS) {
      return amount;
    }
    const rate = await this.getRateToIls(currency);
    return multiplyDecimals(amount, rate);
  }
}

export const exchangeRateService = new ExchangeRateService();
