/// <reference types="vite/client" />

declare module "*.css?url";

interface StackrApp {
    id: string;
    name: string;
    url: string;
    description: string;
    category: string;
    icon: string | null;
    iconUrl: string | null;
    iconDataUrl: string | null;
}

interface StackrProfile {
    id: string;
    name: string;
}

interface Window {
    stackr: {
        getApps: () => Promise<StackrApp[]>;
        addApp: (app: {
            name: string;
            url: string;
            description?: string;
            category?: string;
        }) => Promise<StackrApp>;

        updateApp: (
            id: string,
            app: {
                name: string;
                url: string;
                description?: string;
            }
        ) => Promise<StackrApp>;

        deleteApp: (id: string) => Promise<boolean>;

        getProfiles: () => Promise<StackrProfile[]>;
        addProfile: (name: string) => Promise<StackrProfile>;
        setCurrentProfile: (id: string) => Promise<string>;
        getCurrentProfile: () => Promise<string>;
        updateProfile: (id: string, name: string) => Promise<StackrProfile>;
        deleteProfile: (id: string) => Promise<boolean>;

        openUrl: (url: string) => Promise<void>;
        goHome: () => Promise<void>;
        goBack: () => Promise<void>;
        goForward: () => Promise<void>;

        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        close: () => Promise<void>;
    };
}
