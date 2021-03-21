import { PagedNehanDocument, CssStyleSheet, LayoutOutlineEvaluator, } from 'nehan';
import { getPageSize } from './PlayerLayout';
import { getScreenPageCount, getPageOrder } from './PlayerLayout';
function getNehanBasicStyle(fontSize, fontFamily, pageSize, writingMode) {
    const size = pageSize.getLogicalSize(writingMode);
    let body = {
        writingMode: writingMode.value,
        measure: `${size.measure}px`,
        extent: `${size.extent}px`,
        fontSize: `${fontSize}px`,
    };
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
export class NehanPagedMediaPlayer {
    constructor(config, $host, $shadow, content, layout, nehanWritingMode, size, fontSize, fontFamily, pageIndex = 0, pageSize = getPageSize(layout, size), screenPageCount = getScreenPageCount(layout), pageOrder = getPageOrder(layout, nehanWritingMode), nehanBodyStyle = getNehanBasicStyle(fontSize, fontFamily, pageSize, nehanWritingMode), $screen = $shadow.getElementById("screen"), $pageNo = $shadow.getElementById("page-no"), $pageCount = $shadow.getElementById("page-count"), $gotoLeft = $shadow.getElementById("goto-left"), $gotoRight = $shadow.getElementById("goto-right"), $pages = [
        $shadow.getElementById("page-1"),
        $shadow.getElementById("page-2"),
        $shadow.getElementById("page-3"),
        $shadow.getElementById("page-4"),
    ], $slider = $shadow.getElementById("slider"), $sliderRange = $shadow.getElementById("slider-range"), $title = $shadow.getElementById("title"), $subTitle = $shadow.getElementById("sub-title")) {
        this.config = config;
        this.$host = $host;
        this.$shadow = $shadow;
        this.content = content;
        this.layout = layout;
        this.nehanWritingMode = nehanWritingMode;
        this.size = size;
        this.fontSize = fontSize;
        this.fontFamily = fontFamily;
        this.pageIndex = pageIndex;
        this.pageSize = pageSize;
        this.screenPageCount = screenPageCount;
        this.pageOrder = pageOrder;
        this.nehanBodyStyle = nehanBodyStyle;
        this.$screen = $screen;
        this.$pageNo = $pageNo;
        this.$pageCount = $pageCount;
        this.$gotoLeft = $gotoLeft;
        this.$gotoRight = $gotoRight;
        this.$pages = $pages;
        this.$slider = $slider;
        this.$sliderRange = $sliderRange;
        this.$title = $title;
        this.$subTitle = $subTitle;
        const self = this;
        const styleSheets = [this.nehanBodyStyle].concat(config.onCreateNehanStyles ? config.onCreateNehanStyles(this) : []);
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
                $sliderRange.oninput = (ev) => {
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
        };
        $gotoRight.onclick = () => {
            nehanWritingMode.isVerticalRl() ? this.gotoPrevPage() : this.gotoNextPage();
        };
        $screen.onclick = (ev) => {
            const rect = $screen.getBoundingClientRect();
            const x = ev.pageX - rect.left - window.pageXOffset;
            const y = ev.pageY - rect.top - window.pageYOffset;
            const center = $screen.clientWidth / 2;
            if (x < center && config.onClickLeftPage) {
                config.onClickLeftPage(self);
            }
            else if (config.onClickRightPage) {
                config.onClickRightPage(self);
            }
        };
        if (config.onPlayerReady) {
            config.onPlayerReady(self);
        }
    }
    get id() {
        return this.$host.id;
    }
    get src() {
        return this.$host.getAttribute("src") || "";
    }
    get width() {
        return this.size.width;
    }
    get height() {
        return this.size.height;
    }
    get writingMode() {
        return this.nehanWritingMode.value;
    }
    get currentPageIndex() {
        return this.pageIndex;
    }
    set currentPageIndex(index) {
        this.gotoPage(index);
    }
    get currentSection() {
        return this.reader.getSectionAt(this.pageIndex);
    }
    get pageCount() {
        return this.reader.pageCount;
    }
    setTitle(title) {
        this.$title.innerHTML = title;
    }
    setSubTitle(subTitle) {
        this.$subTitle.innerHTML = subTitle;
    }
    createOutline(onClickTocItem) {
        return this.reader.createOutline(new LayoutOutlineEvaluator((section) => {
            const a = document.createElement('a');
            a.appendChild(document.createTextNode(section.title));
            a.href = '#' + section.pageIndex;
            if (onClickTocItem) {
                a.onclick = (e) => {
                    e.preventDefault();
                    onClickTocItem(section);
                    return false;
                };
            }
            return a;
        }));
    }
    refresh(throttle = false) {
        this.$host.refresh(throttle);
    }
    update(attrs) {
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
    getNombrePageNo(pageIndex) {
        return Math.ceil((pageIndex + 1) / this.screenPageCount);
    }
    getNombrePageCount(pageCount) {
        return Math.ceil(pageCount / this.screenPageCount);
    }
    gotoPage(pageIndex) {
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
//# sourceMappingURL=NehanPagedMediaPlayer.js.map