
export const enum Platform {
    Client       = 0x00000001,
    Server       = 0x00000002,
    Android      = 0x00000004,
    Ios          = 0x00000008,
    WindowsPhone = 0x00000010,
    Wechat       = 0x00000020,
    Tablet       = 0x00000040,

    Phone = Android | Ios | WindowsPhone,
}

declare var __dirname: any;
declare var __file: any;
declare var window: any;
declare var navigator: any;

export function getPlatform(userAgent: string): Platform {
    let platform: Platform = 0;

    if (__dirname && __file) {
        platform |= Platform.Server;

        if (navigator) {
            if (/(android)/i.test(userAgent)) {
                platform |= Platform.Android;
            }

            if (/iPad|iPhone|iPod/.test(userAgent)) {
                platform |= Platform.Ios;
            }

            if (/iPad/.test(userAgent)) {
                platform |= Platform.Tablet;
            }

            if (/Windows Phone/.test(userAgent)) {
                platform |= Platform.WindowsPhone;
            }
        }
    }
    else if (window) {
        platform |= Platform.Client;

        if (navigator) {
            if (/(android)/i.test(navigator.userAgent)) {
                platform |= Platform.Android;
            }

            if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                platform |= Platform.Ios;
            }

            if (/iPad/.test(navigator.userAgent)) {
                platform |= Platform.Tablet;
            }

            if (/Windows Phone/.test(navigator.userAgent)) {
                platform |= Platform.WindowsPhone;
            }
        }
    }

    return platform;
}