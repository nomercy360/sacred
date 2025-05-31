export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') {
    try {
        const haptic = window.Telegram?.WebApp?.HapticFeedback
        if (haptic?.impactOccurred) {
            haptic.impactOccurred(type)
            console.log(`[Haptic] Triggered: ${type}`)
        } else {
            console.warn('[Haptic] Not available')
        }
    } catch (err) {
        console.error('[Haptic] Error:', err)
    }
}