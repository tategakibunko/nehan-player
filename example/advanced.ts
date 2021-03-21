import { WritingModeValue, CssRules, CssStyleSheet, Page, Anchor, SemanticStyle, LayoutSection, DomCallbackContext, DynamicStyleContext, DynamicStyleUtils, CssStyleDeclaration } from 'nehan';
// import { NehanPlayer, PagedMediaPlayer, ScreenLayout } from 'nehan-player';
import { NehanPlayer, PagedMediaPlayer, ScreenLayout, PlayerSection } from '../dist';
import * as NehanAnchor from 'nehan-anchor';
import * as NehanKatex from 'nehan-katex';
import * as NehanHighlight from 'nehan-highlight';
import { getDeviceFontFamily } from './device-font';

const defaultFontSize = 16;
const defaultWritingModeValue: WritingModeValue = "horizontal-tb";
const defaultScreenLayout: ScreenLayout = "1x2";

class UserInputManager {
  constructor(
    public player: PagedMediaPlayer,
    private $player = document.getElementById("player"),
    private $fontSmaller = document.getElementById("font-smaller"),
    private $fontLarger = document.getElementById("font-larger"),
    private $selectFontFamily = document.getElementById("select-font-family") as HTMLSelectElement,
    private $selectWritingMode = document.getElementById("select-writing-mode") as HTMLSelectElement,
    private $selectLayout = document.getElementById("select-layout") as HTMLSelectElement,
    private $selectSrc = document.getElementById("select-src") as HTMLSelectElement,
    private $selectTheme = document.getElementById("select-theme") as HTMLSelectElement,
    private fontFamily = $player!.getAttribute("font-family") || "",
    private fontSize = parseInt($player!.getAttribute("font-size") || String(defaultFontSize)),
    private writingMode: WritingModeValue = ($player!.getAttribute("writing-mode") || defaultWritingModeValue) as WritingModeValue,
    private layout: ScreenLayout = ($player!.getAttribute("layout") || defaultScreenLayout) as ScreenLayout,
    private src = $player!.getAttribute("src") || "test-data/aozora01.txt",
    private theme = $player!.getAttribute("theme") || "themes/default.css",
  ) {
    this.setup(this.player);
  }

  setup(player: PagedMediaPlayer) {
    this.player = player;
    document.onkeydown = (ev: KeyboardEvent) => {
      switch (ev.key) {
        case "j":
          this.player.gotoNextPage();
          break;
        case "k":
          this.player.gotoPrevPage();
          break;
        case "ArrowLeft":
          this.player.gotoLeftPage();
          break;
        case "ArrowRight":
          this.player.gotoRightPage();
          break;
      }
    }

    this.$fontLarger!.onclick = () => {
      const newFontSize = Math.min(30, this.fontSize + 2);
      if (newFontSize !== this.fontSize) {
        this.fontSize = newFontSize;
        this.player.update({ fontSize: this.fontSize });
      }
    }

    this.$fontSmaller!.onclick = () => {
      const newFontSize = Math.max(12, this.fontSize - 2);
      if (newFontSize !== this.fontSize) {
        this.fontSize = newFontSize;
        this.player.update({ fontSize: this.fontSize });
      }
    }

    this.$selectFontFamily!.value = this.fontFamily;
    this.$selectFontFamily!.oninput = () => {
      this.fontFamily = this.$selectFontFamily!.value;
      this.player.update({ fontFamily: this.fontFamily });
    }

    this.$selectWritingMode!.value = this.writingMode;
    this.$selectWritingMode!.oninput = () => {
      this.writingMode = this.$selectWritingMode!.value as WritingModeValue;
      this.player.update({ writingMode: this.writingMode });
    }

    this.$selectLayout!.value = this.layout;
    this.$selectLayout!.oninput = () => {
      this.layout = this.$selectLayout!.value as ScreenLayout;
      this.player.update({ layout: this.layout });
    }

    this.$selectSrc!.value = this.src;
    this.$selectSrc!.oninput = () => {
      this.src = this.$selectSrc!.value;
      this.player.update({ src: this.src });
    }

    this.$selectTheme!.value = this.theme;
    this.$selectTheme!.oninput = () => {
      this.theme = this.$selectTheme!.value;
      this.player.update({ theme: this.theme });
    }
  }
}

let userInputManager: UserInputManager;

function createHeaderStyle(): CssStyleSheet {
  const gothicFontFamily = getDeviceFontFamily("gothic");
  return new CssStyleSheet(
    [1, 2, 3, 4, 5, 6].reduce((acm, i) => {
      acm[`h${i}`] = {
        fontFamily: gothicFontFamily,
        // smartHeader removes the extra whitespace before the header
        // that appears at the top of the page, if necessary.
        "!dynamic": DynamicStyleUtils.smartHeader
      };
      return acm;
    }, {} as CssRules)
  );
}

NehanPlayer.initialize({
  // Css files attached to shadow dom of nehan-player.
  // Note that including these files in host html doesn't work,
  // because host css doesn't flood into shadow-dom.
  cssFiles: [
    "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.13.0/katex.min.css",
  ],
  // You can create nehan-styles(internal page styling) here.
  // Note that the inside of each page is calculated by nehan layout engine,
  // so basically the style of each page must be customized by nehan-style.
  onCreateNehanStyles(player: PagedMediaPlayer) {
    return [
      // Enable semantic style in nehan layouting.
      // For example, you can break page by <hr class="page break after">.
      // Or text-centering by <p class="text align center">some text</p>.
      // See others in [https://github.com/tategakibunko/nehan/blob/master/src/semantic-style.ts]
      SemanticStyle.create({ all: true }),
      new CssStyleSheet({
        // By clicking <a href="#top">back to top</a>, goto first page.
        "a[href='#top']": {
          "@create": (ctx: DomCallbackContext) => {
            ctx.dom.onclick = (e) => {
              e.preventDefault();
              player.gotoPage(0);
              return false;
            }
          }
        },
        "blockquote": {
          fontSize: "0.8em",
          padding: "0.6em",
          borderStartWidth: "2px",
          borderStartStyle: "solid",
        },
        "pre": {
          padding: "1em",
        },
      }),
      createHeaderStyle(),

      // By this plugin, you can preview anchor link.
      // and jump to the page of anchored element.
      NehanAnchor.create({
        previewSpacing: 20,
        onClickAnchorLink(anchor: Anchor) {
          player.gotoPage(anchor.pageIndex);
        }
      }),
      // By this plugin, you can highlight code like
      // <pre><code class="lang-javascript">some code</code></pre>
      NehanHighlight.create({
        selector: "pre>code"
      }),
      // By this plugin, you can use
      // <math> tag for block mathematical expressons and
      // <math class="inline"> for inline mathematical expressions.
      NehanKatex.create({
        selector: "math",
        spacingSize: 10,
        margin: "0.5em 0",
        // To get accurate dom size calculated by katex,
        // we have to attach katex element to dom-tree temporary.
        // In normal case, we just add it to document.body,
        // but we use shadow DOM for this player, so we use PagedMediaPlayer.appendChild,
        // to add element to it's shadowRoot.
        attachDOM(dom: HTMLElement) {
          player.$host.shadowRoot!.appendChild(dom);
        },
        detachDOM(dom: HTMLElement) {
          player.$host.shadowRoot!.removeChild(dom);
        }
      }),
    ]
  },
  onParsePage(player: PagedMediaPlayer, pageIndex: number) {
    // console.log(`parsed page(${pageIndex})`);
  },
  onParseComplete(player: PagedMediaPlayer, pageCount: number, ellapsedTime: number) {
    // console.log(`finished! time = ${ellapsedTime / 1000}sec`);
    const outline = player.createOutline((section: PlayerSection) => {
      player.gotoPage(section.pageIndex);
    });
    const $toc = document.querySelector("#toc");
    if ($toc) {
      $toc.innerHTML = "";
      $toc.appendChild(outline);
    }
  },
  onFetchContent(src: string, content: string) {
    if (src.endsWith(".txt")) {
      return content
        .replace(/^\n+/, "")
        .replace(/\n/g, "<br>")
        ;
    }
    return content;
  },
  onPlayerReady(player: PagedMediaPlayer) {
    player.setTitle(player.src.replace(/.*\/(.+)$/, "$1"));
    if (!userInputManager) {
      userInputManager = new UserInputManager(player);
    } else {
      userInputManager.setup(player);
    }
  },
  onSetPage(player: PagedMediaPlayer, page: Page) {
    const section = player.currentSection;
    if (!section.isRoot()) {
      player.setSubTitle(`&gt; ${section.title}`);
    }
  },
  onClickLeftPage(player: PagedMediaPlayer) {
    player.gotoLeftPage();
  },
  onClickRightPage(player: PagedMediaPlayer) {
    player.gotoRightPage();
  },
});
