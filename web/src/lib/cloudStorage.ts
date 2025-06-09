type CloudStorageCallback<T> = (error: Error | null, value: T) => void

export const setCloudItem = <T>(key: string, value: T): Promise<void> => {
    if (!window.Telegram.WebApp.initDataUnsafe.query_id) {
        return Promise.resolve()
    }

    return new Promise<void>((resolve, reject) => {
        window.Telegram.WebApp.CloudStorage.setItem(
            key,
            JSON.stringify(value),
            ((error: Error | null, success: boolean) => {
                if (error) {
                    reject(error)
                    return
                }
                resolve()
            }) as CloudStorageCallback<boolean>,
        )
    })
}

export const getCloudItem = <T>(key: string): Promise<T | null> => {
    if (!window.Telegram.WebApp.initDataUnsafe.query_id) {
        return Promise.resolve(null)
    }

    return new Promise<T | null>(resolve => {
        window.Telegram.WebApp.CloudStorage.getItem(key, ((
            error: Error | null,
            value: string | null,
        ) => {
            if (error || !value) {
                resolve(null)
                return
            }
            try {
                resolve(JSON.parse(value))
            } catch {
                resolve(null)
            }
        }) as CloudStorageCallback<string | null>)
    })
}
