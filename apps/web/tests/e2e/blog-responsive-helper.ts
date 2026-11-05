import { expect, type Page } from "@playwright/test";

export function expectGeometry(flags: Record<string, boolean>) {
  for (const [name, value] of Object.entries(flags)) {
    expect(value, name).toBe(true);
  }
}

export async function expectHeroGeometry(page: Page) {
  const geometry = await page.evaluate(() => {
    const info = document.querySelector(".home-info-container")!;
    const rail = document.querySelector(".hero-rail")!;
    const prompt = document.querySelector(".scroll-indicator")!;
    const infoRect = info.getBoundingClientRect();
    const railRect = rail.getBoundingClientRect();
    const promptRect = prompt.getBoundingClientRect();
    const links = Array.from(rail.querySelectorAll("a")).map((link) =>
      link.getBoundingClientRect(),
    );
    return {
      fits: document.documentElement.scrollWidth <= innerWidth,
      centered:
        Math.abs(promptRect.x + promptRect.width / 2 - innerWidth / 2) < 1,
      infoFits: infoRect.left >= 0 && infoRect.right <= innerWidth,
      railFits:
        railRect.left >= 0 &&
        railRect.right <= innerWidth &&
        railRect.bottom <= innerHeight,
      regionsSeparate:
        innerWidth < 768
          ? infoRect.bottom <= railRect.top && railRect.bottom <= promptRect.top
          : infoRect.right <= railRect.left,
      touchTargets:
        links.every((rect) => rect.width >= 44 && rect.height >= 44) &&
        promptRect.width >= 44 &&
        promptRect.height >= 44,
    };
  });
  expectGeometry(geometry);
}

export async function expectHomeArchiveGeometry(page: Page) {
  const geometry = await page.evaluate(() => {
    const bounds = (selector: string) =>
      document.querySelector(selector)!.getBoundingClientRect();
    const section = bounds(".home-page__articles");
    const heading = bounds(".home-archive-heading");
    const title = bounds(".home-archive-heading__title");
    const dashboard = bounds(".home-page__articles .blog-dashboard");
    const interactive = Array.from(
      document.querySelectorAll(
        '.home-page__articles .blog-search, .home-page__articles button, .home-page__articles [role="button"]',
      ),
    ).filter(
      (element) =>
        element.getClientRects().length > 0 &&
        getComputedStyle(element).visibility !== "hidden",
    );
    const fits = (rect: DOMRect) => rect.left >= 0 && rect.right <= innerWidth;
    return {
      pageFits: document.documentElement.scrollWidth <= innerWidth,
      sectionFits: fits(section),
      headingFits: fits(heading),
      titleFits: fits(title) && title.bottom <= heading.bottom,
      headingBeforeDashboard: heading.bottom <= dashboard.top,
      touchTargets: interactive.every((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width >= 44 && rect.height >= 44;
      }),
    };
  });
  expectGeometry(geometry);
}

export async function expectIntroductionGeometry(page: Page) {
  const geometry = await page.evaluate(() => {
    const bounds = (selector: string) =>
      document.querySelector(selector)!.getBoundingClientRect();
    const card = bounds(".intro-panel__card");
    const art = bounds(".intro-panel__visual");
    const rail = bounds(".side-indicator");
    return {
      pageFits: document.documentElement.scrollWidth <= innerWidth,
      cardFits: card.left >= 0 && card.right <= innerWidth,
      desktopComposition: innerWidth < 1024 || card.right <= art.left + 50,
      railSeparate: innerWidth < 768 || card.right <= rail.left,
      mobileArtBelow: innerWidth >= 768 || art.top >= card.bottom,
    };
  });
  expectGeometry(geometry);
}

export async function expectPortfolioGeometry(page: Page) {
  const geometry = await page.evaluate(() => {
    const bounds = (selector: string) =>
      document.querySelector(selector)!.getBoundingClientRect();
    const stage = bounds(".portfolio-stage");
    const directory = bounds(".portfolio-directory");
    const carousel = bounds(".portfolio-carousel");
    const card = bounds(".portfolio-card.is-active");
    const status = bounds(".portfolio-carousel__status");
    const rail = bounds(".side-indicator");
    const fits = (rect: DOMRect) => rect.left >= 0 && rect.right <= innerWidth;
    const targets = [
      ...document.querySelectorAll(".portfolio-directory__item, .portfolio-arrow"),
    ];
    return {
      pageFits: document.documentElement.scrollWidth <= innerWidth,
      stageFits: fits(stage),
      directoryFits: fits(directory),
      centralCardFits:
        fits(card) && card.left >= stage.left && card.right <= stage.right,
      regionsSeparate:
        innerWidth < 1024
          ? directory.bottom <= carousel.top
          : directory.right <= carousel.left,
      statusBelowCard: status.top >= card.bottom,
      railSeparate: innerWidth < 768 || stage.right <= rail.left,
      touchTargets: targets.every((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width >= 44 && rect.height >= 44 && fits(rect);
      }),
    };
  });
  expectGeometry(geometry);
}
