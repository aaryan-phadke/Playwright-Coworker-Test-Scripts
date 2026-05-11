import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ReportsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open() {
    // Sidebar label is singular "Report", not "Reports".
    await this.openNav('Report');
  }
}
