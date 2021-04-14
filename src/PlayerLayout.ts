import { PhysicalSize, WritingMode } from 'nehan';

export type ScreenLayout = "1x1" | "1x2" | "2x1" | "2x2"
export type PlayerWritingMode = "horizontal-tb" | "vertical-rl" | "vertical-lr"

// https://octicons-primer.vercel.app/octicons/
const svgLeft = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path fill-rule="evenodd" d="M9.78 12.78a.75.75 0 01-1.06 0L4.47 8.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L6.06 8l3.72 3.72a.75.75 0 010 1.06z"></path></svg>`
const svgRight = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path fill-rule="evenodd" d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z"></path></svg>`;

interface LayoutSettings {
  readonly defaultLayout: ScreenLayout;
  readonly pageGapSize: number;
  readonly minFontSize: number;
  readonly maxFontSize: number;
  readonly minWidth: number;
  readonly minHeight: number;
  readonly minMultiColWidth: number;
  readonly minMultiRowHeight: number;
  readonly maxBorderSize: number;
  readonly elementPaddingTop: number;
};

export const layoutSettings: LayoutSettings = {
  defaultLayout: "1x1",
  pageGapSize: 32,
  minFontSize: 10,
  maxFontSize: 48,
  minWidth: 300,
  minHeight: 300,
  minMultiColWidth: 600,
  minMultiRowHeight: 500,
  maxBorderSize: 20,
  elementPaddingTop: 48,
};

export function getScreenPageCount(layout: ScreenLayout): number {
  switch (layout) {
    case "1x1": return 1;
    case "1x2": case "2x1": return 2;
    case "2x2": return 4;
  }
}

export function getPageOrder(layout: ScreenLayout, writingMode: WritingMode): number[] {
  const isRTL = writingMode.isVerticalRl();
  switch (layout) {
    case "1x1": return [1];
    case "1x2": return isRTL ? [3, 1] : [1, 3];
    case "2x1": return [1, 2];
    case "2x2": return isRTL ? [3, 4, 1, 2] : [1, 2, 3, 4];
  }
}

export function isMultiCol(layout: ScreenLayout): boolean {
  return layout === "1x2" || layout === "2x2";
}

export function isMultiRow(layout: ScreenLayout): boolean {
  return layout === "2x1" || layout === "2x2";
}

export function decGridCol(layout: ScreenLayout): ScreenLayout {
  if (layout === "1x2") {
    return "1x1";
  }
  if (layout === "2x2") {
    return "2x1";
  }
  return layout;
}

export function decGridRow(layout: ScreenLayout): ScreenLayout {
  if (layout === "2x1") {
    return "1x1";
  }
  if (layout === "2x2") {
    return "1x2";
  }
  return layout;
}

export function getElementLrPaddingSize(writingMode: WritingMode, layout: ScreenLayout, elementSize: PhysicalSize, fontSize: number, lineHeight: number, borderSize: number): number {
  if (writingMode.isTextHorizontal()) {
    return fontSize;
  }
  // lhp can be float(because lineHeight can be float), so you cant calc like this.
  // const halfSurplus = ((elementWidth - 2 * fontSize) % lhp) / 2;
  const lhp = fontSize * lineHeight;
  const minSpace = 2 * fontSize;
  let availableWidth = elementSize.width - minSpace - 2 * borderSize;
  if (isMultiCol(layout)) {
    availableWidth -= layoutSettings.pageGapSize + 1;
  }
  const lineCount = Math.floor(availableWidth / lhp);
  const halfSurplusSize = Math.floor((availableWidth - lhp * lineCount) / 2);
  // console.log(`ew: ${elementSize.width}, avail:${availableWidth}, lhp:${lhp}, lc:${lineCount}, halfSurplus:${halfSurplusSize}`);
  return fontSize + halfSurplusSize;
}

export function getElementBottomPaddingSize(writingMode: WritingMode, layout: ScreenLayout, elementSize: PhysicalSize, fontSize: number, lineHeight: number, borderSize: number): number {
  return fontSize * 1.5;
}

export function getPlayerSize(elementSize: PhysicalSize, fontSize: number, lrPadding: number, bottomPadding: number, borderSize: number): PhysicalSize {
  return new PhysicalSize({
    width: elementSize.width - lrPadding * 2 - borderSize * 2,
    height: elementSize.height - layoutSettings.elementPaddingTop - bottomPadding,
  });
}

export function getPageSize(layout: ScreenLayout, playerSize: PhysicalSize): PhysicalSize {
  switch (layout) {
    case "1x1": return new PhysicalSize({
      width: playerSize.width,
      height: playerSize.height,
    });
    case "1x2": return new PhysicalSize({
      width: (playerSize.width - layoutSettings.pageGapSize - 1) / 2,
      height: playerSize.height,
    });
    case "2x1": return new PhysicalSize({
      width: playerSize.width,
      height: (playerSize.height - layoutSettings.pageGapSize - 1) / 2,
    });
    case "2x2": return new PhysicalSize({
      width: (playerSize.width - layoutSettings.pageGapSize - 1) / 2,
      height: (playerSize.height - layoutSettings.pageGapSize - 1) / 2,
    });
  }
}

export function getPlayerHTML(): string {
  return `
    <div class="player">
      <div id="screen-header">
        <span id="title"><slot name="title"></slot></span>
        <span id="sub-title"><slot name="sub-title"></slot></span>
      </div>
      <div id="screen">
        <div class="page" id="page-1"></div>
        <div class="hline" id="hline-12"></div>
        <div class="page" id="page-2"></div>
        <div class="vline"></div>
        <div class="page" id="page-3"></div>
        <div class="hline" id="hline-34"></div>
        <div class="page" id="page-4"></div>
      </div>
      <div id="screen-footer">
        <div class="nombre">
          <span id="page-no"></span>
          <span id="separator">/</span>
          <span id="page-count"></span>
        </div>
      </div>
      <menu id="menu">
        <button class="pager" id="goto-left">
          <slot name="goto-left-label">
            ${svgLeft}
          </slot>
        </button>
        <button class="pager" id="goto-right">
          <slot name="goto-right-label">
            ${svgRight}
          </slot>
        </button>
      </menu>
      <div id="slider">
        <input id="slider-range" type="range" min="1" max="1" step="1" value="0">
      </div>
      <footer id="footer"><slot name="footer"></slot></footer>
      <div id="direct-content"><slot name="content"></slot></div>
    </div>`;
}

export function getPlayerStyle(writingMode: WritingMode, playerSize: PhysicalSize, fontSize: number, lrPadding: number, bottomPadding: number, borderSize: number): string {
  const direction = writingMode.isVerticalRl() ? "rtl" : "ltr";
  return `
  .player {
    margin-bottom: 2em;
    overflow: hidden;
  }
  #screen-header {
    position: relative;
    font-size: 12px;
    top: 32px;
    left: 32px;
    width: ${playerSize.width}px;
    white-space: nowrap;
  }
  #title {
    color: rgba(80,80,80, 0.8);
  }
  #sub-title {
    color: rgba(80,80,80, 0.8);
  }
  #screen{
    width: ${playerSize.width}px;
    height: ${playerSize.height}px;
    padding: ${layoutSettings.elementPaddingTop}px ${lrPadding}px ${bottomPadding}px;
    background: wheat;
    border-width: ${borderSize}px ${borderSize}px 0 ${borderSize}px;
  }
  #screen-footer {
    padding: 10px;
  }
  #menu {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    margin-top: 0;
    width: ${playerSize.width}px;
    color: white;
    font-size: 14px;
    background: #3c3c4e;
    padding: 10px ${lrPadding}px;
    border-width: 0 ${borderSize}px ${borderSize}px ${borderSize}px;
  }
  #slider {
    visibility: hidden; /* hide until onCompletePage is called. */
    width: ${playerSize.width}px;
    padding: 0 ${lrPadding}px;
  }
  #slider input[type="range"] {
    width: ${playerSize.width}px;
  }
  #footer {
    width: ${playerSize.width}px;
    padding: 0 32px;
    text-align: right;
    font-size: 0.82em;
  }
  #direct-content {
    visibility: hidden;
  }
  input[type="range"] {
    direction: ${direction};
  }
  .nehan-line a {
    color:#d61111;
  }
  .pager {
    flex-basis: 100px;
    padding: 4px 0px;
  }
  .nombre {
    font-size: 0.92em;
    text-align: center;
    flex-basis: 150px;
  }
  .vline {
    border-left: 1px dotted #7a7a7a;
  }
  .hline {
    border-bottom: 1px dotted #7a7a7a;
  }
  `;
}

export function getGridStyle(layout: ScreenLayout, playerSize: PhysicalSize): string {
  const pageSize = getPageSize(layout, playerSize);
  switch (layout) {
    case "1x1":
      return `
      #page-2, #page-3, #page-4, .vline, .hline {
        display:none;
      }
      `;
    case "1x2":
      return `
      #screen {
        display: grid;
        grid-template-rows: 100%;
        grid-template-columns: ${pageSize.width}px 1px ${pageSize.width}px;
        gap: 0 ${layoutSettings.pageGapSize / 2}px; /* vline makes 2*gapSize, so we use half for colGap. */
      }
      #page-1 {
        grid-row: 1/2;
        grid-column: 1/2;
      }
      .vline {
        grid-row: 1/3;
        grid-column: 2/3;
      }
      #page-3 {
        grid-row: 1/2;
        grid-column: 3/4;
      }
      #page-2, #page-4, .hline {
        display: none;
      }
      `;
    case "2x1":
      return `
      #screen {
        display: grid;
        grid-template-rows: ${pageSize.height}px 1px ${pageSize.height}px;
        grid-template-columns: 100%;
        gap: ${layoutSettings.pageGapSize / 2}px 0px; /* hline makes 2*gapSize, so we use halt for rowGap. */
      }
      #page-1 {
        grid-row: 1/2;
        grid-column: 1/2;
      }
      #hline-12 {
        grid-row: 2/3;
        grid-column: 1/2;
      }
      #page-2 {
        grid-row: 3/4;
        grid-column: 1/2;
      }
      #page-3, #page-4, #hline-34, .vline {
        display: none;
      }
      `;
    case "2x2":
      return `
      #screen {
        display: grid;
        grid-template-rows: ${pageSize.height}px 1px ${pageSize.height}px;
        grid-template-columns: ${pageSize.width}px 1px ${pageSize.width}px;
        gap: ${layoutSettings.pageGapSize / 2}px; /* vline and hline make 2*gapSize so we use half gap size */
      }
      #page-1 {
        grid-row: 1/2;
        grid-column: 1/2;
      }
      #hline-12 {
        grid-row: 2/3;
        grid-column: 1/2;
      }
      #page-2 {
        grid-row: 3/4;
        grid-column: 1/2;
      }
      .vline {
        grid-row: 1/4;
        grid-column: 2/3;
      }
      #page-3 {
        grid-row: 1/2;
        grid-column: 3/4;
      }
      #hline-34 {
        grid-row: 2/3;
        grid-column: 3/4;
      }
      #page-4 {
        grid-row: 3/4;
        grid-column: 3/4;
      }
      `;
  }
}


