import { PagedMediaPlayer, PagedMediaPlayerConfig } from './PagedMediaPlayer';
import { layoutSettings, ScreenLayout, isMultiCol, isMultiRow, decGridCol, decGridRow, getElementLrPaddingSize, getElementBottomPaddingSize, getPlayerSize, getPlayerStyle, getPlayerHTML, getGridStyle } from './PlayerLayout'
import { Utils, WritingMode, WritingModeValue, PhysicalSize } from 'nehan';
import { NehanPagedMediaPlayer } from './NehanPagedMediaPlayer';

const THEME_CSS_ID = "theme-css";
const MIN_UPDATE_TIME = 200;

let responsivePlayers: { [playerId: string]: PagedMediaPlayer } = {};

let globalConfig: PagedMediaPlayerConfig = {
  cssFiles: [],
  onFetchContent: (src: string, content: string) => content,
}

function handleResize() {
  Object.values(responsivePlayers).forEach((player: PagedMediaPlayer) => player.refresh(true));
}

function genId(): string {
  const time = new Date();
  return `player-${time.getTime()}`;
}

// per player attributes
// basically set by html attribute of <nehan-player>
export interface PlayerAttributes {
  src?: string;
  theme?: string;
  width?: (number | string);
  height?: number;
  fontSize?: number;
  fontFamily?: string;
  lineHeight?: number;
  writingMode?: WritingModeValue;
  layout?: ScreenLayout;
  borderSize?: number;
}

const defaultAttrs: PlayerAttributes = {
  src: "",
  theme: "",
  width: "responsive",
  height: 450,
  fontSize: 16,
  fontFamily: "",
  lineHeight: 2,
  layout: "1x1",
  borderSize: 1,
  writingMode: "horizontal-tb",
};

function truncateMinMax(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export class NehanPlayer extends HTMLElement {
  private $shadow: ShadowRoot;
  private src: string = "";
  private html: string = "";
  private lastUpdate?: number;

  constructor() {
    super();
    this.$shadow = this.attachShadow({ mode: "open" });
    const id = this.getAttribute("id");
    if (!id) {
      this.id = genId();
    }
  }

  static initialize(userConfig?: PagedMediaPlayerConfig) {
    if (userConfig) {
      globalConfig = { ...globalConfig, ...userConfig };
    }
    customElements.define("nehan-player", NehanPlayer);
  }

  static get observedAttributes() {
    return ["class"];
  }

  connectedCallback() {
    this.render();
  }

  async attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === "class" && this.classList.contains("update")) {
      await this.render();
      this.classList.remove("update");
    }
  }

  public update(attrs: PlayerAttributes) {
    let isUpdated = false;

    // if update attr is 'theme' only, just replace css file.
    if (attrs.theme && Object.keys(attrs).length === 1) {
      const $old = this.$shadow.getElementById(THEME_CSS_ID);
      const $new = this.createCssLink(attrs.theme, true);
      const $first = this.$shadow.firstElementChild;
      if ($old) {
        this.$shadow.replaceChild($new, $old);
      } else if ($first) {
        this.$shadow.insertBefore($new, $first);
      } else {
        this.$shadow.appendChild($new);
      }
      this.setAttribute("theme", attrs.theme);
      return;
    }
    for (const [key, value] of Object.entries(attrs)) {
      const attrName = Utils.String.camelToChain(key);
      const old = this.getAttribute(attrName) || "";
      if (value !== old) {
        // if width is changed from "responsive" to other value,
        // unregister player from responsivePlayers cache.
        if (key === "width" && old === "responsive") {
          delete responsivePlayers[this.id];
        }
        this.setAttribute(attrName, value);
        isUpdated = true
      }
    }
    if (isUpdated) {
      this.refresh(false);
    }
  }

  private createCssLink(href: string, theme = false): HTMLLinkElement {
    const link = document.createElement("link");
    if (theme) {
      link.id = THEME_CSS_ID;
    }
    link.setAttribute("rel", "stylesheet");
    link.setAttribute("type", "text/css");
    link.setAttribute("href", href);
    return link;
  }

  public refresh(throttle: boolean) {
    const curTime = new Date().getTime();
    // prevent updates at very short intervals!
    if (throttle && this.lastUpdate && curTime - this.lastUpdate < MIN_UPDATE_TIME) {
      return;
    }
    this.lastUpdate = curTime;
    this.classList.add("update");
  }

  private parseWidth(): number {
    const width = this.getAttribute("width") || defaultAttrs.width;
    if (!width) {
      throw new Error("System Error: width can't be resolved!");
    }
    if (width === "responsive") {
      if (this.parentElement) {
        return this.parentElement.clientWidth;
      }
      return this.clientWidth;
    }
    return typeof width === "number" ? width : parseInt(width);
  }

  private async render() {
    // read settings from DOM or PlayerConfig.
    const src = this.getAttribute("src") || defaultAttrs.src;
    const theme = this.getAttribute("theme") || defaultAttrs.theme;
    const width = Math.max(this.parseWidth(), layoutSettings.minWidth);
    const height = Math.max(parseInt(this.getAttribute("height") || String(defaultAttrs.height)), layoutSettings.minHeight);
    let layout = (this.getAttribute("layout") || layoutSettings.defaultLayout) as ScreenLayout;
    if (isMultiCol(layout) && width < layoutSettings.minMultiColWidth) {
      layout = decGridCol(layout);
    }
    if (isMultiRow(layout) && height < layoutSettings.minMultiRowHeight) {
      layout = decGridRow(layout);
    }
    const lineHeight = truncateMinMax(parseFloat(this.getAttribute("line-height") || String(defaultAttrs.lineHeight)), 1.5, 2.0);
    const fontSize = truncateMinMax(parseInt(this.getAttribute("font-size") || String(defaultAttrs.fontSize)), layoutSettings.minFontSize, layoutSettings.maxFontSize);
    const fontFamily = this.getAttribute("font-family") || defaultAttrs.fontFamily || "";
    // const pageGapSize = layoutSettings.pageGapSize;
    const borderSize = Math.min(parseInt(this.getAttribute("border-size") || String(defaultAttrs.borderSize)), layoutSettings.maxBorderSize);
    const writingModeValue = (this.getAttribute("writing-mode") || defaultAttrs.writingMode) as WritingModeValue;
    const writingMode = new WritingMode(writingModeValue);
    const elementSize = new PhysicalSize({ width, height });
    const lrPaddingSize = getElementLrPaddingSize(writingMode, layout, elementSize, fontSize, lineHeight, borderSize);
    const bottomPaddingSize = getElementBottomPaddingSize(writingMode, layout, elementSize, fontSize, lineHeight, borderSize);
    const playerSize = getPlayerSize(elementSize, fontSize, lrPaddingSize, bottomPaddingSize, borderSize);

    // refresh shadow root
    this.$shadow.innerHTML = "";

    // append {screen, grid} style
    const screenStyle = document.createElement("style");
    const gridStyle = document.createElement("style");
    screenStyle.textContent = getPlayerStyle(writingMode, playerSize, fontSize, lrPaddingSize, bottomPaddingSize, borderSize);
    gridStyle.textContent = getGridStyle(layout, playerSize);
    this.$shadow.appendChild(screenStyle);
    this.$shadow.appendChild(gridStyle);

    // append theme css
    if (theme) {
      const link = this.createCssLink(theme, true);
      this.$shadow.appendChild(link);
    }
    // append other css files
    const cssFiles: string[] = globalConfig.cssFiles || [];
    cssFiles.forEach(href => {
      const link = this.createCssLink(href, false);
      this.$shadow.appendChild(link);
    });

    // append player shadow tree
    const template = document.createElement("template");
    template.innerHTML = getPlayerHTML();
    this.$shadow.appendChild(template.content.cloneNode(true));

    // if content slot is filled, use it as html.
    const slotContent = this.$shadow.host.querySelector("div[slot='content']")?.innerHTML || "";
    if (slotContent !== "") {
      this.html = globalConfig.onFetchContent ? globalConfig.onFetchContent("content.slot", slotContent) : slotContent;
    } else if (!src) {
      this.html = "Can't resolve content. Neither 'content' slot or 'src' attribute is specified!";
    } else if (src !== this.src || !this.html) {
      // use cache if same src and cache(this.html) exists, or fetch remote src.
      this.src = src;
      this.html = await fetch(this.src)
        .then(response => response.ok ? response.text() : `Failed to load ${src}`)
        .then(text => globalConfig.onFetchContent ? globalConfig.onFetchContent(src, text) : text);
    }
    // start paged-media player
    const player = new NehanPagedMediaPlayer(
      globalConfig,
      this,
      this.$shadow,
      this.html,
      layout,
      writingMode,
      playerSize,
      fontSize,
      fontFamily,
    );

    // if resonsive player, cache the player by id.
    if (this.getAttribute("width") === "responsive") {
      // start listening "resize" event if this is first time cache.
      if (Object.entries(responsivePlayers).length === 0) {
        window.addEventListener("resize", handleResize);
      }
      responsivePlayers[this.id] = player;
    }
  }
}
