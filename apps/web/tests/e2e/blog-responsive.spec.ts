import { expect, test, type Page } from "@playwright/test";
import { openReadyArticle, openReadyBlog } from "./blog-test-helpers";

import {
  expectGeometry,
  expectHeroGeometry,
  expectHomeArchiveGeometry,
  expectIntroductionGeometry,
  expectPortfolioGeometry,
} from "./blog-responsive-helper";

// 背景音乐开关在三档视口都随导航栏可见，且默认（未开启时）可交互
async function expectMusicToggleReady(page: Page) {
  const musicToggle = page.getByRole("button", { name: "播放背景音乐" });
  await expect(musicToggle).toBeVisible();
  await expect(musicToggle).toHaveAttribute("aria-pressed", "false");
}

async function expectDesktopLayout(page: Page) {
  const leftSidebar = page.getByRole("complementary", { name: "作者信息" });
  const main = page.locator(".blog-main");
  const rightSidebar = page.getByRole("complementary", { name: "站点信息" });
  await expect(leftSidebar).toBeVisible();
  await expect(main).toBeVisible();
  await expect(rightSidebar).toBeVisible();
  const layout = await page.locator(".blog-dashboard").evaluate((dashboard) => {
    const left = dashboard.querySelector(".blog-sidebar--left");
    const center = dashboard.querySelector(".blog-main");
    const right = dashboard.querySelector(".blog-sidebar--right");
    if (!left || !center || !right) {
      throw new Error("博客三栏结构缺失");
    }
    const leftRect = left.getBoundingClientRect();
    const centerRect = center.getBoundingClientRect();
    const rightRect = right.getBoundingClientRect();
    return {
      display: getComputedStyle(dashboard).display,
      columnCount:
        getComputedStyle(dashboard).gridTemplateColumns.split(" ").length,
      leftBeforeCenter: leftRect.right <= centerRect.left,
      centerBeforeRight: centerRect.right <= rightRect.left,
    };
  });
  expect(layout).toEqual({
    display: "grid",
    columnCount: 3,
    leftBeforeCenter: true,
    centerBeforeRight: true,
  });
  await expectMusicToggleReady(page);
}

async function expectTabletLayout(page: Page) {
  await expect(
    page.getByRole("complementary", { name: "作者信息" }),
  ).toBeVisible();
  await expect(
    page.getByRole("complementary", { name: "站点信息" }),
  ).toBeHidden();
  const layout = await page
    .locator(".blog-dashboard")
    .evaluate((dashboard) => ({
      display: getComputedStyle(dashboard).display,
      columnCount:
        getComputedStyle(dashboard).gridTemplateColumns.split(" ").length,
    }));
  expect(layout).toEqual({ display: "grid", columnCount: 1 });
  const cards = page.locator(".blog-article-grid .featured-article");
  await expect(cards.first()).toBeVisible();
  await expect(cards.nth(1)).toBeVisible();
  const [firstCard, secondCard] = await Promise.all([
    cards.first().boundingBox(),
    cards.nth(1).boundingBox(),
  ]);
  expect(firstCard).not.toBeNull();
  expect(secondCard).not.toBeNull();
  expect(Math.abs(firstCard!.y - secondCard!.y)).toBeLessThan(2);
  expect(firstCard!.x + firstCard!.width).toBeLessThanOrEqual(secondCard!.x);
  await expectMusicToggleReady(page);
}

async function expectMobileLayout(page: Page) {
  const mobileMenu = page.locator(".site-nav__mobile-menu");
  const menuButton = page.getByRole("button", { name: "打开导航菜单" });
  await expect(page.locator(".site-nav__list")).toBeHidden();
  await expect(mobileMenu).toBeHidden();
  await expect(page.locator(".site-nav__mobile-overlay")).toBeHidden();
  await expect(
    page.getByRole("button", { name: "开启 Live2D 看板娘" }),
  ).toHaveCount(0);
  await expect(
    page.locator(".blog-article-grid .featured-article").first(),
  ).toBeVisible();
  await expectMusicToggleReady(page);
  const widthState = await page.evaluate(() => {
    const dashboard = document.querySelector(".blog-dashboard");
    if (!dashboard) {
      throw new Error("文章列表区域缺失");
    }
    const dashboardRect = dashboard.getBoundingClientRect();
    return {
      pageFitsViewport:
        document.documentElement.scrollWidth <= window.innerWidth,
      dashboardFitsViewport:
        dashboardRect.left >= 0 && dashboardRect.right <= window.innerWidth,
    };
  });
  expectGeometry(widthState);
  await menuButton.focus();
  await expect(menuButton).toBeFocused();
  const focusStart = await menuButton.elementHandle();
  if (!focusStart) {
    throw new Error("无法记录导航菜单按钮焦点");
  }
  const visibleTabbableCount = await page.locator("body *").evaluateAll(
    (elements) =>
      elements.filter((element) => {
        const htmlElement = element as HTMLElement;
        const style = getComputedStyle(element);
        const isScrollable =
          (["auto", "scroll"].includes(style.overflowX) &&
            htmlElement.scrollWidth > htmlElement.clientWidth) ||
          (["auto", "scroll"].includes(style.overflowY) &&
            htmlElement.scrollHeight > htmlElement.clientHeight);
        return (
          (htmlElement.tabIndex >= 0 || isScrollable) &&
          !element.matches(":disabled") &&
          !element.closest("[inert]") &&
          style.visibility !== "hidden" &&
          style.display !== "none" &&
          element.getClientRects().length > 0
        );
      }).length,
  );
  const maxTabPressCount = Math.max(visibleTabbableCount + 2, 10);
  let focusMoved = false;
  let completedFocusLoop = false;
  for (let tabIndex = 0; tabIndex < maxTabPressCount; tabIndex += 1) {
    await page.keyboard.press("Tab");
    const focusState = await mobileMenu.evaluate(
      (menu, start) => ({
        isInsideHiddenMenu: menu.contains(document.activeElement),
        isAtStart: document.activeElement === start,
      }),
      focusStart,
    );
    expect(focusState.isInsideHiddenMenu).toBe(false);
    if (!focusState.isAtStart) {
      focusMoved = true;
    } else if (focusMoved) {
      completedFocusLoop = true;
      break;
    }
  }
  expect(
    completedFocusLoop,
    `焦点未在 ${maxTabPressCount} 次 Tab 操作内回到导航菜单按钮`,
  ).toBe(true);
  await menuButton.click();
  // 菜单打开后汉堡与遮罩按钮同名，first() 指向 DOM 顺序更前的汉堡按钮
  await expect(
    page.getByRole("button", { name: "关闭导航菜单" }).first(),
  ).toBeVisible();
  const informationLink = page.getByRole("link", {
    name: "INFORMATION 介绍",
  });
  await expect(informationLink).toBeVisible();
  await expect(
    page.getByRole("link", { name: "PORTFOLIO 作品" }),
  ).toBeVisible();
  await informationLink.focus();
  await expect(informationLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/#\/Information$/);
  // 抽屉契约：右贴边、宽度受限、完整落在视口内（等滑入动画结束后测量）
  await menuButton.click();
  await expect(mobileMenu).toBeVisible();
  await expect
    .poll(
      () =>
        mobileMenu.evaluate((menu) => {
          const rect = menu.getBoundingClientRect();
          return {
            rightAligned: Math.abs(rect.right - window.innerWidth) <= 1,
            widthLimited: rect.width <= 320,
            fullyInViewport: rect.left >= 0,
          };
        }),
      { timeout: 2_000 },
    )
    .toEqual({
      rightAligned: true,
      widthLimited: true,
      fullyInViewport: true,
    });
  // 点击遮罩关闭抽屉（点左侧未被抽屉覆盖的可见区域）
  await page
    .locator(".site-nav__mobile-overlay")
    .click({ position: { x: 20, y: 200 } });
  await expect(mobileMenu).toBeHidden();
}

test.describe("响应式契约", () => {
  test("首页标题、档案栏与居中滚动提示互不遮挡", async ({ page }) => {
    await openReadyBlog(page);
    await expect(page.locator("#global-loading")).toHaveCount(0);
    const hero = page.getByRole("region", { name: "home hero panel" });
    await expect(
      hero.getByRole("heading", { name: "娄宿三的小站" }),
    ).toBeVisible();
    await expect(page.locator(".home-quote-text")).toHaveText(
      "爱自己，是终身浪漫的开始。",
    );
    await expect(
      page.locator(".home-frame, .hamal-mark, .home-welcome-copy"),
    ).toHaveCount(0);

    await expectHeroGeometry(page);
    await expect(page.locator(".scroll-text__mobile")).toBeVisible({
      visible: page.viewportSize()!.width < 768,
    });
  });

  test("首页二屏标题、文章区几何与触控目标完整", async ({ page }) => {
    await openReadyBlog(page);
    await expect(page.locator("#global-loading")).toHaveCount(0);
    const archiveHeading = page.locator(".home-archive-heading");
    const archiveTitle = page.locator(".home-archive-heading__title");
    const archiveSection = page.locator(".home-page__articles");
    const dashboard = page.locator(".home-page__articles .blog-dashboard");
    await page.getByRole("button", { name: "滑动查看文章" }).click();
    await expect(archiveSection).toBeInViewport();
    await page.evaluate(() => document.fonts.ready);
    await expect(archiveHeading).toBeVisible();
    await expect(archiveTitle).toHaveText(/NOTES\s*&\s*THOUGHTS\./);
    await expect(page.locator(".home-archive-heading__caption")).toContainText(
      "把好奇写成记录。",
    );
    await expect(dashboard).toBeVisible();

    await expectHomeArchiveGeometry(page);

    // 手机端正文优先：搜索与文章列表必须排在作者/欢迎/一言档案卡之前，
    // 否则进二屏先被三张资料卡挤满一屏，文章入口被推到折叠线以下。
    const readingOrder = await page.evaluate(() => {
      const main = document.querySelector(".blog-main")!.getBoundingClientRect();
      const sidebar = document
        .querySelector(".blog-sidebar--left")!
        .getBoundingClientRect();
      return { mainFirst: innerWidth >= 768 || main.top < sidebar.top };
    });
    expectGeometry(readingOrder);
  });

  test("当前项目符合对应视口的布局与交互", async ({ page }, testInfo) => {
    await openReadyBlog(page);

    switch (testInfo.project.name) {
      case "desktop-chromium":
        await expectDesktopLayout(page);
        break;
      case "tablet-chromium":
        await expectTabletLayout(page);
        break;
      case "mobile-chromium":
        await expectMobileLayout(page);
        break;
      default:
        throw new Error(`未覆盖的响应式测试项目：${testInfo.project.name}`);
    }
  });

  test("介绍页保留人物叠层与右侧竖栏，三档内容完整", async ({ page }) => {
    await page.goto("/#/Information");
    await expect(page.locator("#global-loading")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "娄宿三", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "复制邮箱" })).toBeVisible();
    await expect(page.locator(".intro-panel__section-title > span")).toHaveText(
      ["01 /", "02 /"],
    );
    await expect(
      page.locator(".panel-page__register > span").last(),
    ).toHaveText("INFORMATION — 02 / 04");
    await expect(page.locator(".side-indicator__current")).toHaveText("02");
    const rail = page.getByRole("complementary", {
      name: "Panel Navigation Indicator",
    });
    const width = page.viewportSize()!.width;
    await expect(rail).toBeVisible({ visible: width >= 768 });
    await expectIntroductionGeometry(page);
    const links = await page
      .locator(".intro-panel__social")
      .evaluateAll((elements) =>
        elements.map((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width >= 44 && rect.height >= 44;
        }),
      );
    expect(links.every(Boolean)).toBe(true);
  });

  test("作品目录完整命名，三档目录与卡组布局不遮挡、不横向溢出", async ({
    page,
  }) => {
    await page.goto("/#/Portfolio");
    await expect(page.locator("#global-loading")).toHaveCount(0);
    await page.evaluate(() => document.fonts.ready);
    const directory = page.locator(".portfolio-directory");
    const cards = page.locator(".portfolio-card:not([hidden])");
    await expect(directory).toBeVisible();
    await expect(cards).toHaveCount(3);
    await expect(page.locator(".portfolio-card--slot--1")).toBeVisible();
    await expect(page.locator(".portfolio-card--slot-1")).toBeVisible();
    await expect(page.locator(".portfolio-directory__item strong")).toHaveText([
      "Triple Uni",
      "2025年度总结",
      "愚公迁移工具",
      "火山引擎ByteHouse 官网",
    ]);
    await expect(page.locator(".portfolio-directory__item small")).toHaveText([
      "COMMUNITY PLATFORM",
      "2025 YEAR IN REVIEW",
      "YUGONG / BYTEHOUSE",
      "CLOUD NATIVE / WEBSITE",
    ]);
    await expect(
      page.locator(".panel-page__register > span").last(),
    ).toHaveText("PORTFOLIO — 03 / 04");
    await expect(page.locator(".side-indicator__current")).toHaveText("03");
    await expectPortfolioGeometry(page);
  });

  test("作品档案支持邻卡、箭头、键盘切换及详情导航", async ({ page }) => {
    await page.goto("/#/Portfolio");
    await expect(page.locator("#global-loading")).toHaveCount(0);
    const stage = page.locator(".portfolio-stage");
    const activeCard = page.locator(".portfolio-card.is-active");
    const detailTitle = page.locator("#portfolio-detail-title");
    await expect(stage).toHaveAttribute("data-phase", "idle");
    await expect(activeCard).toContainText("Triple Uni");
    await page.getByRole("button", { name: "下一个作品", exact: true }).click();
    await expect(activeCard).toContainText("2025年度总结");
    const neighbor = page.locator(".portfolio-card--slot-1");
    await neighbor.scrollIntoViewIfNeeded();
    const neighborBox = await neighbor.boundingBox();
    await page.mouse.click(
      Math.min(
        page.viewportSize()!.width - 25,
        neighborBox!.x + neighborBox!.width - 20,
      ),
      neighborBox!.y + neighborBox!.height * 0.32,
    );
    await expect(activeCard).toContainText("愚公迁移工具");
    await page.getByRole("region", { name: "portfolio detail panel" }).focus();
    await page.keyboard.press("ArrowLeft");
    await expect(activeCard).toContainText("2025年度总结");
    await activeCard.click();
    await expect(page).toHaveURL(/project=annual-report/);
    await expect(stage).toHaveClass(/portfolio-stage--detail/);
    await expect(stage).toHaveAttribute("data-phase", "idle");
    await expect(detailTitle).toHaveText("2025年度总结");
    await expect(page.locator(".portfolio-directory")).toBeHidden();
    await expect(page.locator(".portfolio-carousel")).toBeHidden();
    await expect(page.locator(".portfolio-directory__preview")).toBeHidden();
    await expect(page.locator(".portfolio-details__link")).toHaveAttribute(
      "href",
      "https://yukariyukaro.github.io/2025EndYearReport/",
    );
    await page.getByRole("button", { name: "下一个项目", exact: true }).click();
    await expect(page).toHaveURL(/project=yugong$/);
    await expect(detailTitle).toHaveText("愚公迁移工具");
    await page.getByRole("button", { name: "上一个项目", exact: true }).click();
    await expect(detailTitle).toHaveText("2025年度总结");
    await page.getByRole("button", { name: "返回档案" }).click();
    await expect(page).toHaveURL(/\/#\/Portfolio$/);
    await expect(activeCard).toContainText("2025年度总结");
    await expect(activeCard).toBeFocused();
    await page.locator(".portfolio-directory__item").nth(2).click();
    await expect(detailTitle).toHaveText("愚公迁移工具");
    await page.reload();
    await expect(page.locator("#global-loading")).toHaveCount(0);
    await expect(detailTitle).toHaveText("愚公迁移工具");
    await expect(page.locator(".portfolio-directory")).toBeHidden();
    await expect(page.locator(".portfolio-carousel")).toBeHidden();
    const geometry = await page.evaluate(() => {
      const bounds = (selector: string) =>
        document.querySelector(selector)!.getBoundingClientRect();
      const panel = bounds(".portfolio-stage");
      const details = bounds(".portfolio-details");
      const rail = bounds(".side-indicator");
      return {
        pageFits: document.documentElement.scrollWidth <= innerWidth,
        panelFits: panel.left >= 0 && panel.right <= innerWidth,
        railSeparate: innerWidth < 768 || details.right <= rail.left,
      };
    });
    expectGeometry(geometry);
  });

  test("精确指针轮播滚轮节流，三档详情导航不残留其他项目的图片", async ({
    page,
  }, testInfo) => {
    await page.goto("/#/Portfolio");
    await expect(page.locator("#global-loading")).toHaveCount(0);
    const stage = page.locator(".portfolio-stage");
    const activeCard = page.locator(".portfolio-card.is-active");
    const detailTitle = page.locator("#portfolio-detail-title");
    if (testInfo.project.name === "desktop-chromium") {
      // 同批输入保持在节流窗口内，避免 expect 等待消耗手势窗口。
      await stage.dispatchEvent("wheel", { deltaY: 120, deltaMode: 0 });
      await stage.dispatchEvent("wheel", { deltaY: 120, deltaMode: 0 });
    } else {
      await page
        .getByRole("button", { name: "下一个作品", exact: true })
        .click();
    }
    await expect(activeCard).toContainText("2025年度总结");
    await page.getByRole("button", { name: "下一个作品", exact: true }).click();
    await expect(activeCard).toContainText("愚公迁移工具");
    await expect(activeCard.locator(".portfolio-card__tape")).toBeVisible();
    await expect(page.locator(".detail-menu__preview-container")).toHaveCount(
      0,
    );
    await activeCard.click();
    const artwork = page.locator(".portfolio-details__art");
    await expect(artwork.locator("img")).toHaveCount(0);
    await expect(
      artwork.getByRole("img", {
        name: "愚公迁移工具原创几何封面，非产品截图",
      }),
    ).toBeVisible();
    await expect(page.locator(".portfolio-directory__preview")).toBeHidden();
    await page.getByRole("button", { name: "上一个项目", exact: true }).click();
    await expect(detailTitle).toHaveText("2025年度总结");
    await expect(artwork.locator("img")).toHaveAttribute("src", /YearReport/);
    await page.getByRole("button", { name: "上一个项目", exact: true }).click();
    await expect(detailTitle).toHaveText("Triple Uni");
    await expect(artwork.locator("img")).toHaveAttribute("src", /TripleUni/);
    await page.getByRole("button", { name: "上一个项目", exact: true }).click();
    await expect(detailTitle).toHaveText("火山引擎ByteHouse 官网");
    await expect(page).toHaveURL(/project=bytehouse$/);
    await expect(artwork.locator("img")).toHaveCount(0);
    await expect(
      artwork.getByRole("img", {
        name: "火山引擎ByteHouse 官网原创几何封面，非产品截图",
      }),
    ).toBeVisible();
    await expect(
      artwork.getByRole("img", {
        name: "愚公迁移工具原创几何封面，非产品截图",
      }),
    ).toHaveCount(0);
    await expect(page.locator(".portfolio-directory")).toBeHidden();
  });

  test("阅读页与未找到页面三档不横向溢出", async ({ page }) => {
    await openReadyArticle(page, "abstraction");
    await expect(page.locator(".markdown-body")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.goto("/#/missing-page");
    await expect(
      page.getByRole("heading", { name: "档案未找到。" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("link", { name: "返回首页 / HOME" }).click();
    await expect(page).toHaveURL(/\/#\/Home$/);
  });

  test("移动端文章页正文可读且不横向溢出", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "mobile-chromium",
      "正文可读性契约仅在移动端校验",
    );
    await openReadyArticle(page, "abstraction");
    await expect(page.locator(".markdown-body")).toBeVisible();
    const widthState = await page.evaluate(() => {
      const articleElement = document.querySelector(".blog-document");
      if (!articleElement) {
        throw new Error("文章正文区域缺失");
      }
      const articleRect = articleElement.getBoundingClientRect();
      return {
        pageFitsViewport:
          document.documentElement.scrollWidth <= window.innerWidth,
        articleFitsViewport:
          articleRect.left >= 0 && articleRect.right <= window.innerWidth,
      };
    });
    expectGeometry(widthState);
  });
});
