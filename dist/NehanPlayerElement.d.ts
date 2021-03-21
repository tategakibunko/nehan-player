import { PagedMediaPlayerConfig } from './PagedMediaPlayer';
import { ScreenLayout } from './PlayerLayout';
import { WritingModeValue } from 'nehan';
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
export declare class NehanPlayer extends HTMLElement {
    private $shadow;
    private src;
    private html;
    private lastUpdate?;
    constructor();
    static initialize(userConfig?: PagedMediaPlayerConfig): void;
    static get observedAttributes(): string[];
    connectedCallback(): void;
    attributeChangedCallback(name: string, oldValue: string, newValue: string): Promise<void>;
    update(attrs: PlayerAttributes): void;
    private createCssLink;
    refresh(throttle: boolean): void;
    private parseWidth;
    private render;
}
