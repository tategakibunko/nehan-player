import { Page, CssStyleSheet } from 'nehan';
import { PlayerAttributes } from "./NehanPlayerElement";
import { ScreenLayout, PlayerWritingMode } from './PlayerLayout';
export interface PlayerSection {
    title: string;
    level: number;
    pageIndex: number;
    isRoot(): boolean;
    isNode(): boolean;
    isLeaf(): boolean;
}
export interface PagedMediaPlayerConfig {
    cssFiles?: string[];
    onCreateNehanStyles?: (player: PagedMediaPlayer) => CssStyleSheet[];
    onParsePage?: (player: PagedMediaPlayer, pageIndex: number) => void;
    onParseComplete?: (player: PagedMediaPlayer, pageCount: number, ellapsedTime: number) => void;
    onFetchContent?: (src: string, content: string) => string;
    onPlayerReady?: (player: PagedMediaPlayer) => void;
    onSetPage?: (player: PagedMediaPlayer, page: Page) => void;
    onClickLeftPage?: (player: PagedMediaPlayer) => void;
    onClickRightPage?: (player: PagedMediaPlayer) => void;
}
export interface PagedMediaPlayer {
    $host: HTMLElement;
    readonly id: string;
    readonly src: string;
    readonly width: number;
    readonly height: number;
    readonly content: string;
    readonly writingMode: PlayerWritingMode;
    readonly layout: ScreenLayout;
    readonly fontSize: number;
    readonly pageCount: number;
    readonly currentSection: PlayerSection;
    currentPageIndex: number;
    update: (attrs: PlayerAttributes) => void;
    refresh: (throttle: boolean) => void;
    gotoLeftPage: () => void;
    gotoRightPage: () => void;
    gotoPrevPage: () => void;
    gotoNextPage: () => void;
    gotoPage: (index: number) => void;
    createOutline: (onClickTocItem?: (section: PlayerSection) => void) => HTMLElement;
    setTitle: (title: string) => void;
    setSubTitle: (subTitle: string) => void;
}
