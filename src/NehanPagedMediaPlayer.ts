import {
  PagedNehanDocument,
  CssStyleSheet,
  WritingMode,
  PhysicalSize,
  LayoutOutlineEvaluator,
  LayoutSection,
} from 'nehan';

import { getPageSize } from './PlayerLayout';
import { PagedMediaPlayer, PagedMediaPlayerConfig, PlayerSection } from './PagedMediaPlayer';
import { ScreenLayout, PlayerWritingMode, getScreenPageCount, getPageOrder } from './PlayerLayout';
import { NehanPlayer, PlayerAttributes } from './NehanPlayerElement';

function getNehanBasicStyle(fontSize: number, fontFamily: string, pageSize: PhysicalSize, writingMode: WritingMode): CssStyleSheet {
  const size = pageSize.getLogicalSize(writingMode);
  let body: any = {
    writingMode: writingMode.value,
    measure: `${size.measure}px`,
    extent: `${size.extent}px`,
    fontSize: `${fontSize}px`,
  };
  // font-family is optional (if not defined, default font-family of nehan is used).
  if (fontFamily) {
    body.fontFamily = fontFamily;
  }
  return new CssStyleSheet({
    body,
    "a": {
      color: "#d61111"
    },
  });
}

export class NehanPagedMediaPlayer implements PagedMediaPlayer {
  private reader: PagedNehanDocument;

  constructor(
    private config: PagedMediaPlayerConfig,
    public $host: NehanPlayer,
    private $shadow: ShadowRoot,
    public readonly content: string,
    public readonly layout: ScreenLayout,
    private nehanWritingMode: WritingMode,
    private size: PhysicalSize,
    public readonly fontSize: number,
    private fontFamily: string,
    public pageIndex = 0,
    private pageSize: PhysicalSize = getPageSize(layout, size),
    private screenPageCount = getScreenPageCount(layout),
    private pageOrder = getPageOrder(layout, nehanWritingMode),
    private nehanBodyStyle = getNehanBasicStyle(fontSize, fontFamily, pageSize, nehanWritingMode),
    private $screen = $shadow.getElementById("screen") as HTMLElement,
    private $pageNo = $shadow.getElementById("page-no") as HTMLElement,
    private $pageCount = $shadow.getElementById("page-count") as HTMLElement,
    private $gotoLeft = $shadow.getElementById("goto-left") as HTMLElement,
    private $gotoRight = $shadow.getElementById("goto-right") as HTMLElement,
    private $pages = [
      $shadow.getElementById("page-1") as HTMLElement,
      $shadow.getElementById("page-2") as HTMLElement,
      $shadow.getElementById("page-3") as HTMLElement,
      $shadow.getElementById("page-4") as HTMLElement,
    ],
    private $slider = $shadow.getElementById("slider") as HTMLElement,
    private $sliderRange = $shadow.getElementById("slider-range") as HTMLInputElement,
    private $title = $shadow.getElementById("title") as HTMLElement,
    private $subTitle = $shadow.getElementById("sub-title") as HTMLElement,
  ) {
    const self = this;
    const styleSheets = [this.nehanBodyStyle].concat(
      config.onCreateNehanStyles ? config.onCreateNehanStyles(this) : []
    );
    $pageCount.innerHTML = "- -";
    this.reader = new PagedNehanDocument(this.content, { styleSheets }).render({
      onPage(ctx) {
        if (ctx.page.index <= screenPageCount - 1) {
          self.gotoPage(0);
        }
        if (config.onParsePage) {
          config.onParsePage(self, ctx.page.index);
        }
      },
      onComplete(ctx) {
        const nombrePageCount = self.getNombrePageCount(ctx.pageCount);
        $pageCount.innerHTML = String(nombrePageCount);
        $sliderRange.setAttribute("max", String(nombrePageCount));
        $sliderRange.oninput = (ev: Event) => {
          const value = parseInt($sliderRange.value || "0");
          self.gotoPage(value);
        };
        $slider.style.visibility = "visible";
        if (config.onParseComplete) {
          config.onParseComplete(self, ctx.pageCount, ctx.time);
        }
      }
    });
    $gotoLeft.onclick = () => {
      nehanWritingMode.isVerticalRl() ? this.gotoNextPage() : this.gotoPrevPage();
    }
    $gotoRight.onclick = () => {
      nehanWritingMode.isVerticalRl() ? this.gotoPrevPage() : this.gotoNextPage();
    }
    $screen.onclick = (ev: MouseEvent) => {
      const rect = $screen.getBoundingClientRect();
      const x = ev.pageX - rect.left - window.pageXOffset;
      const y = ev.pageY - rect.top - window.pageYOffset;
      const center = $screen.clientWidth / 2;
      if (x < center && config.onClickLeftPage) {
        config.onClickLeftPage(self);
      } else if (config.onClickRightPage) {
        config.onClickRightPage(self);
      }
    }
    if (config.onPlayerReady) {
      config.onPlayerReady(self);
    }
  }

  get id(): string {
    return this.$host.id;
  }

  get src(): string {
    return this.$host.getAttribute("src") || "";
  }

  get width(): number {
    return this.size.width;
  }

  get height(): number {
    return this.size.height;
  }

  get writingMode(): PlayerWritingMode {
    return this.nehanWritingMode.value;
  }

  get currentPageIndex(): number {
    return this.pageIndex;
  }

  set currentPageIndex(index: number) {
    this.gotoPage(index);
  }

  get currentSection(): PlayerSection {
    return this.reader.getSectionAt(this.pageIndex);
  }

  get pageCount(): number {
    return this.reader.pageCount;
  }

  setTitle(title: string) {
    this.$title.innerHTML = title;
  }

  setSubTitle(subTitle: string) {
    this.$subTitle.innerHTML = subTitle;
  }

  createOutline(onClickTocItem?: (section: LayoutSection) => void): HTMLElement {
    return this.reader.createOutline(
      new LayoutOutlineEvaluator((section: LayoutSection) => {
        const a = document.createElement('a');
        a.innerHTML = section.header ? section.header.innerHTML : section.title;
        a.href = '#' + section.pageIndex;
        if (onClickTocItem) {
          a.onclick = (e: Event) => {
            e.preventDefault();
            onClickTocItem(section);
            return false;
          }
        }
        return a;
      })
    );
  }

  refresh(throttle = false) {
    this.$host.refresh(throttle);
  }

  update(attrs: PlayerAttributes) {
    this.$host.update(attrs);
  }

  gotoLeftPage() {
    this.nehanWritingMode.isVerticalRl() ? this.gotoNextPage() : this.gotoPrevPage();
  }

  gotoRightPage() {
    this.nehanWritingMode.isVerticalRl() ? this.gotoPrevPage() : this.gotoNextPage();
  }

  gotoNextPage() {
    const nextIndex = this.pageIndex + this.screenPageCount;
    if (nextIndex >= this.pageCount) {
      return;
    }
    this.gotoPage(nextIndex);
  }

  gotoPrevPage() {
    const prevIndex = Math.max(0, this.pageIndex - this.screenPageCount);
    if (prevIndex === this.pageIndex) {
      return;
    }
    this.gotoPage(prevIndex);
  }

  private getNombrePageNo(pageIndex: number): number {
    return Math.ceil((pageIndex + 1) / this.screenPageCount);
  }

  private getNombrePageCount(pageCount: number): number {
    return Math.ceil(pageCount / this.screenPageCount);
  }

  gotoPage(pageIndex: number) {
    if (pageIndex < 0 || pageIndex >= this.pageCount) {
      return;
    }
    const self = this;
    const nombrePageNo = this.getNombrePageNo(pageIndex);
    this.pageIndex = pageIndex;
    this.$sliderRange.value = String(nombrePageNo);
    this.$pageNo.innerHTML = String(nombrePageNo);
    this.$pages.forEach($page => {
      if ($page.firstChild) {
        $page.removeChild($page.firstChild);
      }
    });
    this.pageOrder.forEach((order, index) => {
      const index2 = pageIndex + index;
      if (index2 >= this.reader.pageCount) {
        return;
      }
      const page = this.reader.getPage(index2);
      const $page = this.$pages[order - 1];
      if (page && page.dom) {
        $page.appendChild(page.dom);
        if (this.config.onSetPage) {
          this.config.onSetPage(self, page);
        }
      }
    });
  }
}

