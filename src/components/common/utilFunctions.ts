export function hapticSuccess() {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([30, 20, 60])
    }
}