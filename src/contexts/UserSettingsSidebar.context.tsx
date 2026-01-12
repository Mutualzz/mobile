import {
    createContext,
    useContext,
    useState,
    type PropsWithChildren,
} from "react";

export type UserSettingsSidebarPage = "my-account" | "profile" | "appearance";
export type UserSettingsSidebarCategories = "user-settings" | "app-settings";

interface UserSettingsSidebarContextProps {
    currentPage: UserSettingsSidebarPage;
    currentCategory: UserSettingsSidebarCategories;
    setCurrentPage: (page: UserSettingsSidebarPage) => void;
    setCurrentCategory: (category: UserSettingsSidebarCategories) => void;
}

const UserSettingsSidebarContext =
    createContext<UserSettingsSidebarContextProps>({
        currentPage: "my-account",
        currentCategory: "user-settings",
        setCurrentPage: () => {
            return;
        },
        setCurrentCategory: () => {
            return;
        },
    });

export const UserSettingsSidebarProvider = ({
    children,
}: PropsWithChildren) => {
    const [currentPage, setCurrentPage] =
        useState<UserSettingsSidebarPage>("profile");

    const [currentCategory, setCurrentCategory] =
        useState<UserSettingsSidebarCategories>("user-settings");

    return (
        <UserSettingsSidebarContext.Provider
            value={{
                currentPage,
                setCurrentPage,
                currentCategory,
                setCurrentCategory,
            }}
        >
            {children}
        </UserSettingsSidebarContext.Provider>
    );
};

export function useUserSettingsSidebar() {
    const ctx = useContext(UserSettingsSidebarContext);
    if (!ctx)
        throw new Error(
            "useSettingsSidebar must be used within a SettingsSidebarProvider",
        );
    return ctx;
}
