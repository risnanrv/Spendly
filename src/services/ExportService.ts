import { db } from '@/lib/db';
import * as schema from '@/database/schema';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { logger } from '@/utils/logger';

const getMonthStr = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

export class ExportService {
  /**
   * Compiles expense history into CSV string.
   */
  public async exportCSV(userId: string, monthStr: string): Promise<string> {
    if (!userId) {
      throw new Error('User ID is required.');
    }
    const isLifetime = monthStr === 'lifetime';
    logger.info(`ExportService: Compiling CSV report for ${monthStr} for user ${userId}...`);

    try {
      const expenses = await db
        .select({
          id: schema.expenses.id,
          amount: schema.expenses.amount,
          title: schema.expenses.title,
          note: schema.expenses.note,
          date: schema.expenses.date,
          categoryName: schema.categories.name,
        })
        .from(schema.expenses)
        .leftJoin(schema.categories, eq(schema.expenses.categoryId, schema.categories.id))
        .where(
          and(
            eq(schema.expenses.userId, userId),
            isNull(schema.expenses.deletedAt)
          )
        )
        .orderBy(desc(schema.expenses.date));

      const filtered = isLifetime
        ? expenses
        : expenses.filter((e) => getMonthStr(new Date(e.date)) === monthStr);
      
      let csvContent = 'Date,Title,Category,Amount,Note\n';
      
      filtered.forEach((e) => {
        const dateStr = new Date(e.date).toISOString().split('T')[0];
        const title = this.escapeCSV(e.title);
        const category = this.escapeCSV(e.categoryName || 'Uncategorized');
        const amount = (e.amount / 100).toFixed(2);
        const note = this.escapeCSV(e.note || '');
        
        csvContent += `${dateStr},${title},${category},${amount},${note}\n`;
      });

      return csvContent;
    } catch (error) {
      logger.error(`ExportService: CSV compilation failed for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Renders a HTML print layout showing summaries, categories breakdown,
   * and transaction tables. Styled in black/white premium design.
   */
  public async exportHTML(userId: string, monthStr: string): Promise<string> {
    if (!userId) {
      throw new Error('User ID is required.');
    }
    const isLifetime = monthStr === 'lifetime';
    const periodLabel = isLifetime ? 'All Time' : monthStr;
    logger.info(`ExportService: Generating HTML statement for ${periodLabel} for user ${userId}...`);

    try {
      const expenses = await db
        .select({
          id: schema.expenses.id,
          amount: schema.expenses.amount,
          title: schema.expenses.title,
          note: schema.expenses.note,
          date: schema.expenses.date,
          categoryName: schema.categories.name,
        })
        .from(schema.expenses)
        .leftJoin(schema.categories, eq(schema.expenses.categoryId, schema.categories.id))
        .where(
          and(
            eq(schema.expenses.userId, userId),
            isNull(schema.expenses.deletedAt)
          )
        )
        .orderBy(desc(schema.expenses.date));

      const filtered = isLifetime
        ? expenses
        : expenses.filter((e) => getMonthStr(new Date(e.date)) === monthStr);
      
      const totalCents = filtered.reduce((sum, item) => sum + item.amount, 0);
      const totalAmountStr = `₹${(totalCents / 100).toFixed(2)}`;
      const avgCents = filtered.length > 0 ? Math.round(totalCents / filtered.length) : 0;
      const avgAmountStr = `₹${(avgCents / 100).toFixed(2)}`;

      const catMap = new Map<string, { name: string; amount: number; count: number }>();
      filtered.forEach((e) => {
        const catName = e.categoryName || 'Uncategorized';
        const existing = catMap.get(catName) || { name: catName, amount: 0, count: 0 };
        existing.amount += e.amount;
        existing.count += 1;
        catMap.set(catName, existing);
      });

      const categoriesBreakdown = Array.from(catMap.values()).sort((a, b) => b.amount - a.amount);

      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Spendly Financial Statement - ${periodLabel}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #111111;
              background-color: #FFFFFF;
              padding: 40px;
              margin: 0;
            }
            .header {
              border-bottom: 2px solid #EAEAEA;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            .title {
              font-size: 26px;
              font-weight: 700;
              color: #111111;
              margin: 0;
            }
            .subtitle {
              font-size: 14px;
              color: #707070;
              margin-top: 4px;
              margin-bottom: 0;
            }
            .grid {
              display: flex;
              gap: 16px;
              margin-bottom: 32px;
            }
            .card {
              flex: 1;
              background-color: #F7F7F7;
              border: 1px solid #EAEAEA;
              border-radius: 8px;
              padding: 16px;
              box-sizing: border-box;
            }
            .card-label {
              font-size: 12px;
              color: #707070;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            .card-value {
              font-size: 20px;
              font-weight: 700;
              color: #111111;
            }
            .section-title {
              font-size: 18px;
              font-weight: 600;
              color: #111111;
              margin-bottom: 12px;
              margin-top: 24px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
            }
            th, td {
              text-align: left;
              padding: 10px 12px;
              font-size: 13px;
              border-bottom: 1px solid #EAEAEA;
            }
            th {
              background-color: #F7F7F7;
              font-weight: 600;
              color: #111111;
            }
            .text-right {
              text-align: right;
            }
            .badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: 500;
              background-color: #F7F7F7;
              border: 1px solid #EAEAEA;
              color: #111111;
            }
            @media print {
              body {
                padding: 0;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; text-align: right;">
            <button onclick="window.print()" style="background-color: #111111; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600;">Print Statement / Save PDF</button>
          </div>
          <div class="header">
            <h1 class="title">Spendly Financial Summary</h1>
            <p class="subtitle">Statement Period: ${periodLabel} &nbsp;|&nbsp; Generated on: ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="grid">
            <div class="card">
              <div class="card-label">Total Expenditures</div>
              <div class="card-value">${totalAmountStr}</div>
            </div>
            <div class="card">
              <div class="card-label">Logged Transactions</div>
              <div class="card-value">${filtered.length}</div>
            </div>
            <div class="card">
              <div class="card-label">Average per Expense</div>
              <div class="card-value">${avgAmountStr}</div>
            </div>
          </div>

          <h2 class="section-title">Category Allocations</h2>
          <table>
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Transactions</th>
                <th class="text-right">Total Allocated</th>
                <th class="text-right">Share Ratio</th>
              </tr>
            </thead>
            <tbody>
              ${categoriesBreakdown.map((c) => {
                const ratio = ((c.amount / totalCents) * 100).toFixed(1);
                const amountStr = `₹${(c.amount / 100).toFixed(2)}`;
                return `
                  <tr>
                    <td><strong>${c.name}</strong></td>
                    <td>${c.count} transaction${c.count === 1 ? '' : 's'}</td>
                    <td class="text-right">${amountStr}</td>
                    <td class="text-right">${ratio}%</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <h2 class="section-title">Detailed Transaction History</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Category</th>
                <th>Note</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map((e) => {
                const dateStr = new Date(e.date).toLocaleDateString();
                const amountStr = `₹${(e.amount / 100).toFixed(2)}`;
                return `
                  <tr>
                    <td>${dateStr}</td>
                    <td><strong>${e.title}</strong></td>
                    <td><span class="badge">${e.categoryName || 'Uncategorized'}</span></td>
                    <td>${e.note || '-'}</td>
                    <td class="text-right" style="color: #111111; font-weight: 500;">${amountStr}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <script>
            // Auto trigger print in printable layouts
            window.onload = function() {
              if (window.location.search.includes('print=true')) {
                window.print();
              }
            }
          </script>
        </body>
        </html>
      `;
    } catch (error) {
      logger.error(`ExportService: HTML compilation failed for user ${userId}:`, error);
      throw error;
    }
  }

  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
