import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class NotificationsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open() {
    await this.openNav('Notifications');
  }

  async unreadBadge() {
    return this.page
      .locator('[class*="badge" i], [data-testid*="unread" i]')
      .first();
  }
}
