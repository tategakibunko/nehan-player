import { NehanPlayer, PagedMediaPlayer, PlayerSection } from '../dist';
import { Page, CssStyleSheet, CssRules, LayoutSection } from 'nehan';
import { getDeviceFontFamily } from './device-font';

function createHeaderRules(): CssRules {
  const gothicFontFamily = getDeviceFontFamily("gothic");
  return [1, 2, 3, 4, 5, 6].reduce((acm, i) => {
    acm[`h${i}`] = { fontFamily: gothicFontFamily };
    return acm;
  }, {} as CssRules);
}

window.addEventListener("load", () => {
  NehanPlayer.initialize({
    cssFiles: [],
    onCreateNehanStyles(player: PagedMediaPlayer) {
      let rules = createHeaderRules();
      // If vertical writing mode, we have to choose fontFamily carefully!
      if (player.writingMode.indexOf("vertical") >= 0) {
        const fontFamily = getDeviceFontFamily("normal");
        rules = { ...rules, "body": { fontFamily } };
      }
      return [
        new CssStyleSheet(rules)
      ];
    },
    onFetchContent(src: string, content: string) {
      if (src.endsWith(".txt")) {
        return content.replace(/^\n*/, "").replace(/\n/g, "<br>");
      }
      return content;
    },
    onParseComplete(player: PagedMediaPlayer, pageCount: number, ellapsedTime: number) {
      // For readability of this document, we display toc only if the player shows wikipedia.
      if (player.id !== "wikipedia") {
        return;
      }
      const outline = player.createOutline((section: PlayerSection) => {
        player.gotoPage(section.pageIndex);
      });
      const $toc = document.querySelector("#wikipedia-toc");
      if ($toc) {
        $toc.innerHTML = "";
        $toc.appendChild(outline);
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
    }
  });
});

