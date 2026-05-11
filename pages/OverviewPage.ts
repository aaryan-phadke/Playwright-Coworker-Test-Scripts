import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class OverviewPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open() {
    await this.openNav('Overview');
  }

  /** Shorthand: count visible KPI cards / widgets on the overview page. */
  async kpiCardCount(): Promise<number> {
    return this.page
      .locator('[class*="kpi" i], [class*="card" i], [data-testid*="card" i]')
      .count();
  }
}
