import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class AssetsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open() {
    await this.openNav('Assets');
  }

  /** Count rows in any visible table on the page. */
  async rowCount(): Promise<number> {
    const tables = this.page.locator('table tbody tr, [role="row"]');
    return tables.count();
  }
}
