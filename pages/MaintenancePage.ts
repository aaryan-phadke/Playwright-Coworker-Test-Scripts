import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class MaintenancePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open() {
    await this.openNav('Maintenance');
  }
}
