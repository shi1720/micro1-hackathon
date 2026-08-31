import { withPage, gotoStable, VIEWPORT } from './browser.mjs';

/**
 * Measure the bounding boxes (page coordinates) of a list of CSS selectors —
 * used to define the regions a fix is allowed to repaint.
 */
export async function measureSelectors(target, selectors) {
  return withPage(async (page) => {
    await gotoStable(page, target);
    return page.evaluate((sels) => {
      const boxes = [];
      for (const sel of sels) {
        try {
          const el = document.querySelector(sel);
          if (!el) continue;
          const r = el.getBoundingClientRect();
          if (r.width < 1 || r.height < 1) continue;
          boxes.push({ x: Math.round(r.x + scrollX), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) });
        } catch { /* invalid selector — skip */ }
      }
      return boxes;
    }, selectors);
  });
}

/**
 * Capture everything we need to prove a fix did not damage the page:
 * viewport + full-page screenshots, visible text, element geometry,
 * and the inventory of visible images.
 */
export async function snapshotPage(target) {
  return withPage(async (page) => {
    await gotoStable(page, target);

    const dom = await page.evaluate(() => {
      const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();

      const text = norm(document.body?.innerText || '');

      // Geometry of content-bearing elements, keyed by tag + leading text/src
      // so before/after snapshots can be matched element-to-element.
      const SELECT =
        'h1,h2,h3,h4,h5,h6,p,li,a,button,input,select,textarea,img,label,td,th,figcaption,blockquote';
      const seen = new Map();
      const geometry = [];
      for (const el of document.querySelectorAll(SELECT)) {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        const ident =
          el.tagName === 'IMG'
            ? (el.getAttribute('src') || '').split('/').pop()
            : norm(el.innerText || el.value || el.getAttribute('placeholder') || '').slice(0, 60);
        const base = `${el.tagName.toLowerCase()}:${ident}`;
        const n = (seen.get(base) || 0) + 1;
        seen.set(base, n);
        geometry.push({
          key: n === 1 ? base : `${base}#${n}`,
          x: Math.round(r.x + window.scrollX),
          y: Math.round(r.y + window.scrollY),
          w: Math.round(r.width),
          h: Math.round(r.height),
        });
      }

      const images = [...document.querySelectorAll('img')]
        .map((el) => {
          const r = el.getBoundingClientRect();
          return {
            src: (el.getAttribute('src') || '').split('/').pop(),
            alt: el.getAttribute('alt'),
            w: Math.round(r.width),
            h: Math.round(r.height),
            visible: r.width >= 2 && r.height >= 2,
          };
        })
        .filter((i) => i.src);

      return {
        text,
        geometry,
        images,
        title: document.title,
        lang: document.documentElement.getAttribute('lang'),
        scrollWidth: document.documentElement.scrollWidth,
        interactive: document.querySelectorAll('a[href],button,input,select,textarea').length,
      };
    });

    const screenshotViewport = await page.screenshot({ fullPage: false });
    const screenshotFull = await page.screenshot({ fullPage: true });

    return { target: String(target), viewport: VIEWPORT, ...dom, screenshotViewport, screenshotFull };
  });
}
