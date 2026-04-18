/**
 * Identity Utility
 * Manages unique, stable identities for anonymous users.
 */

export interface Identity {
    shortId: string;
    color: string;
    gradient: string;
    label: string;
}

/**
 * Generates a stable anonymous identity from an anonId (UUID).
 */
export function getAnonymousIdentity(anonId: string | undefined): Identity {
    if (!anonId) {
        return {
            shortId: 'GUEST',
            color: '#94a3b8', // slate-400
            gradient: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
            label: 'Guest'
        };
    }

    // Stable hash for color generation
    let hash = 0;
    for (let i = 0; i < anonId.length; i++) {
        hash = anonId.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Generate HSL color (Stable Hue, high Saturation, balanced Lightness)
    const h = Math.abs(hash % 360);
    const s = 65 + (Math.abs(hash) % 15); // 65-80% saturation
    const l = 45 + (Math.abs(hash) % 10); // 45-55% lightness
    
    const color = `hsl(${h}, ${s}%, ${l}%)`;
    // Create a smooth gradient shift (40 degrees hue shift)
    const gradient = `linear-gradient(135deg, hsl(${h}, ${s}%, ${l}%) 0%, hsl(${(h + 40) % 360}, ${s}%, ${l - 10}%) 100%)`;

    // Extract short ID from UUID (last 4 characters)
    // UUID format is normally xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    // or anon_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const idParts = anonId.split('_');
    const uuid = idParts[idParts.length - 1];
    const shortId = uuid.slice(-4).toUpperCase();

    return {
        shortId,
        color,
        gradient,
        label: shortId
    };
}
