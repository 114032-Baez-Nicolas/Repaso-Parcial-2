export function generateOrderCode(name: string, email: string): string {
    const firstLetter = name.charAt(0).toUpperCase();
    const lastFourEmail = email.slice(-4);
    const timestamp = Date.now().toString().slice(-4);
    return `${firstLetter}.${lastFourEmail}${timestamp}`;
}