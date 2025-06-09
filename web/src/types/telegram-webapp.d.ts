interface TelegramWebAppCloudStorage {
    setItem: (key: string, value: string) => Promise<void>
    getItem: (key: string) => Promise<string | null>
    removeItem: (key: string) => Promise<void>
    getKeys: () => Promise<string[]>
}

interface TelegramWebApp {
    CloudStorage: TelegramWebAppCloudStorage
    // Add other WebApp properties as needed
}

declare global {
    interface Window {
        Telegram: {
            WebApp: TelegramWebApp
        }
    }
}

export {}
