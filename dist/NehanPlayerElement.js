var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { layoutSettings, isMultiCol, isMultiRow, decGridCol, decGridRow, getElementLrPaddingSize, getElementBottomPaddingSize, getPlayerSize, getPlayerStyle, getPlayerHTML, getGridStyle } from './PlayerLayout';
import { Utils, WritingMode, PhysicalSize } from 'nehan';
import { NehanPagedMediaPlayer } from './NehanPagedMediaPlayer';
const THEME_CSS_ID = "theme-css";
const MIN_UPDATE_TIME = 200;
let responsivePlayers = {};
let globalConfig = {
    cssFiles: [],
    onFetchContent(src, content) { return content; },
    onClickLeftPage(player) { player.gotoLeftPage(); },
    onClickRightPage(player) { player.gotoRightPage(); },
};
function handleResize() {
    Object.values(responsivePlayers).forEach((player) => player.refresh(true));
}
function genId() {
    const time = new Date();
    return `player-${time.getTime()}`;
}
const defaultAttrs = {
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
function truncateMinMax(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
export class NehanPlayer extends HTMLElement {
    constructor() {
        super();
        this.src = "";
        this.html = "";
        this.$shadow = this.attachShadow({ mode: "open" });
        const id = this.getAttribute("id");
        if (!id) {
            this.id = genId();
        }
    }
    static initialize(userConfig) {
        if (userConfig) {
            globalConfig = Object.assign(Object.assign({}, globalConfig), userConfig);
        }
        customElements.define("nehan-player", NehanPlayer);
    }
    static get observedAttributes() {
        return ["class"];
    }
    connectedCallback() {
        this.render();
    }
    attributeChangedCallback(name, oldValue, newValue) {
        return __awaiter(this, void 0, void 0, function* () {
            if (name === "class" && this.classList.contains("update")) {
                yield this.render();
                this.classList.remove("update");
            }
        });
    }
    update(attrs) {
        let isUpdated = false;
        if (attrs.theme && Object.keys(attrs).length === 1) {
            const $old = this.$shadow.getElementById(THEME_CSS_ID);
            const $new = this.createCssLink(attrs.theme, true);
            const $first = this.$shadow.firstElementChild;
            if ($old) {
                this.$shadow.replaceChild($new, $old);
            }
            else if ($first) {
                this.$shadow.insertBefore($new, $first);
            }
            else {
                this.$shadow.appendChild($new);
            }
            this.setAttribute("theme", attrs.theme);
            return;
        }
        for (const [key, value] of Object.entries(attrs)) {
            const attrName = Utils.String.camelToChain(key);
            const old = this.getAttribute(attrName) || "";
            if (value !== old) {
                if (key === "width" && old === "responsive") {
                    delete responsivePlayers[this.id];
                }
                this.setAttribute(attrName, value);
                isUpdated = true;
            }
        }
        if (isUpdated) {
            this.refresh(false);
        }
    }
    createCssLink(href, theme = false) {
        const link = document.createElement("link");
        if (theme) {
            link.id = THEME_CSS_ID;
        }
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("type", "text/css");
        link.setAttribute("href", href);
        return link;
    }
    refresh(throttle) {
        const curTime = new Date().getTime();
        if (throttle && this.lastUpdate && curTime - this.lastUpdate < MIN_UPDATE_TIME) {
            return;
        }
        this.lastUpdate = curTime;
        this.classList.add("update");
    }
    parseWidth() {
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
    render() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const src = this.getAttribute("src") || defaultAttrs.src;
            const theme = this.getAttribute("theme") || defaultAttrs.theme;
            const width = Math.max(this.parseWidth(), layoutSettings.minWidth);
            const height = Math.max(parseInt(this.getAttribute("height") || String(defaultAttrs.height)), layoutSettings.minHeight);
            let layout = (this.getAttribute("layout") || layoutSettings.defaultLayout);
            if (isMultiCol(layout) && width < layoutSettings.minMultiColWidth) {
                layout = decGridCol(layout);
            }
            if (isMultiRow(layout) && height < layoutSettings.minMultiRowHeight) {
                layout = decGridRow(layout);
            }
            const lineHeight = truncateMinMax(parseFloat(this.getAttribute("line-height") || String(defaultAttrs.lineHeight)), 1.5, 2.0);
            const fontSize = truncateMinMax(parseInt(this.getAttribute("font-size") || String(defaultAttrs.fontSize)), layoutSettings.minFontSize, layoutSettings.maxFontSize);
            const fontFamily = this.getAttribute("font-family") || defaultAttrs.fontFamily || "";
            const borderSize = Math.min(parseInt(this.getAttribute("border-size") || String(defaultAttrs.borderSize)), layoutSettings.maxBorderSize);
            const writingModeValue = (this.getAttribute("writing-mode") || defaultAttrs.writingMode);
            const writingMode = new WritingMode(writingModeValue);
            const elementSize = new PhysicalSize({ width, height });
            const lrPaddingSize = getElementLrPaddingSize(writingMode, layout, elementSize, fontSize, lineHeight, borderSize);
            const bottomPaddingSize = getElementBottomPaddingSize(writingMode, layout, elementSize, fontSize, lineHeight, borderSize);
            const playerSize = getPlayerSize(elementSize, fontSize, lrPaddingSize, bottomPaddingSize, borderSize);
            this.$shadow.innerHTML = "";
            const screenStyle = document.createElement("style");
            const gridStyle = document.createElement("style");
            screenStyle.textContent = getPlayerStyle(writingMode, playerSize, fontSize, lrPaddingSize, bottomPaddingSize, borderSize);
            gridStyle.textContent = getGridStyle(layout, playerSize);
            this.$shadow.appendChild(screenStyle);
            this.$shadow.appendChild(gridStyle);
            if (theme) {
                const link = this.createCssLink(theme, true);
                this.$shadow.appendChild(link);
            }
            const cssFiles = globalConfig.cssFiles || [];
            cssFiles.forEach(href => {
                const link = this.createCssLink(href, false);
                this.$shadow.appendChild(link);
            });
            const cssText = globalConfig.cssText || "";
            if (cssText) {
                const style = document.createElement("style");
                style.innerHTML = cssText;
                this.$shadow.appendChild(style);
            }
            const template = document.createElement("template");
            template.innerHTML = getPlayerHTML();
            this.$shadow.appendChild(template.content.cloneNode(true));
            const slotContent = ((_a = this.$shadow.host.querySelector("div[slot='content']")) === null || _a === void 0 ? void 0 : _a.innerHTML) || "";
            if (slotContent !== "") {
                this.html = globalConfig.onFetchContent ? globalConfig.onFetchContent("content.slot", slotContent) : slotContent;
            }
            else if (!src) {
                this.html = "Can't resolve content. Neither 'content' slot or 'src' attribute is specified!";
            }
            else if (src !== this.src || !this.html) {
                this.src = src;
                this.html = yield fetch(this.src)
                    .then(response => response.ok ? response.text() : `Failed to load ${src}`)
                    .then(text => globalConfig.onFetchContent ? globalConfig.onFetchContent(src, text) : text);
            }
            const player = new NehanPagedMediaPlayer(globalConfig, this, this.$shadow, this.html, layout, writingMode, playerSize, fontSize, fontFamily);
            if (this.getAttribute("width") === "responsive") {
                if (Object.entries(responsivePlayers).length === 0) {
                    window.addEventListener("resize", handleResize);
                }
                responsivePlayers[this.id] = player;
            }
        });
    }
}
//# sourceMappingURL=NehanPlayerElement.js.map