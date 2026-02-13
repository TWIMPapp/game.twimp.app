export interface PinIcon {
    name: string;
    colour: string;
    /** Emoji used as the map marker. If absent, falls back to `/icons/{name}.svg`. */
    emoji?: string;
    /** Emoji shown in the UI (icon picker, lists). Falls back to `emoji` if not set. */
    displayEmoji?: string;
    label: string;
}

/** Master list of all pin icons. Icons with `emoji` render as emoji on the map;
 *  icons without `emoji` fall back to `/icons/{name}.svg` (with underscores → hyphens). */
const PIN_ICONS: PinIcon[] = [
    // Easter (use SVG files on map, colored circles in UI)
    { name: 'egg_red', colour: 'red', displayEmoji: '🔴', label: 'Red Egg' },
    { name: 'egg_blue', colour: 'blue', displayEmoji: '🔵', label: 'Blue Egg' },
    { name: 'egg_green', colour: 'green', displayEmoji: '🟢', label: 'Green Egg' },
    { name: 'egg_gold', colour: 'gold', displayEmoji: '🟡', label: 'Gold Egg' },
    { name: 'egg_orange', colour: 'orange', displayEmoji: '🟠', label: 'Orange Egg' },
    // Valentine
    { name: 'heart_red', colour: 'red', emoji: '❤️', label: 'Red Heart' },
    { name: 'heart_pink', colour: 'pink', emoji: '💗', label: 'Pink Heart' },
    { name: 'rose', colour: 'red', emoji: '🌹', label: 'Rose' },
    { name: 'love_letter', colour: 'pink', emoji: '💌', label: 'Love Letter' },
    // General
    { name: 'pin', colour: 'red', emoji: '📍', label: 'Pin' },
    { name: 'star', colour: 'gold', emoji: '⭐', label: 'Star' },
    { name: 'flag', colour: 'green', emoji: '🚩', label: 'Flag' },
    { name: 'gift', colour: 'blue', emoji: '🎁', label: 'Gift' },
    // Shared
    { name: 'basket', colour: 'green', emoji: '🧺', label: 'Basket' },
    { name: 'treasure_chest', colour: 'gold', emoji: '💰', label: 'Treasure' },
    { name: 'question_mark', colour: 'purple', emoji: '❓', label: 'Mystery' },
];

const iconMap = new Map(PIN_ICONS.map(i => [i.name, i]));

/** Look up a pin icon by name. Returns undefined if not found. */
export function getPinIcon(name: string): PinIcon | undefined {
    return iconMap.get(name);
}

/** Get the emoji to show in UI (icon picker, lists etc). */
export function getDisplayEmoji(name: string): string {
    const icon = iconMap.get(name);
    return icon?.displayEmoji || icon?.emoji || '📍';
}

/** Get marker display props ({ emoji } or { image_url }) for a pin icon name. */
export function getPinMarkerProps(name: string): { emoji: string } | { image_url: string } | {} {
    const icon = iconMap.get(name);
    if (!icon) return {};
    if (icon.emoji) return { emoji: icon.emoji };
    return { image_url: `/icons/${name.replace(/_/g, '-')}.svg` };
}

export default PIN_ICONS;
