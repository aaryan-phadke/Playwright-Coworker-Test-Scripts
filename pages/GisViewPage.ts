import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class GisViewPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async open() {
    await this.openNav('GIS View');
  }

  /** Returns true if a Leaflet/Mapbox/Google map container is rendered. */
  async hasMap(): Promise<boolean> {
    const mapSelectors = [
      '.leaflet-container',
      '.mapboxgl-canvas',
      '[class*="map" i] canvas',
      'canvas[aria-label*="map" i]',
    ];
    for (const sel of mapSelectors) {
      if (await this.page.locator(sel).first().isVisible().catch(() => false)) {
        return true;
      }
    }
    return false;
  }
}
