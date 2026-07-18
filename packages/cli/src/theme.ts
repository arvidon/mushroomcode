export type themeColors = {
    primary: string;
    planMode: string;
    selection: string;
    thinking: string;
    success: string;
    error: string;
    info: string;
    background: string;
    surface: string;
    dialogSurface: string;
    thinkBorder: string;
    dimSeperator: string;
}

export type Theme = {
    name: string;
    colors: themeColors
}

export const THEMES: Theme[] = [
    {
        name: "Nightfox",
        colors: {
            primary: "#89B4FA",
            planMode: "#CBA6F7",
            selection: "#313244",
            thinking: "#F9E2AF",
            success: "#A6E3A1",
            error: "#F38BA8",
            info: "#74C7EC",
            background: "#11111B",
            surface: "#1E1E2E",
            dialogSurface: "#181825",
            thinkBorder: "#F9E2AF",
            dimSeperator: "#585B70",
        },
    },

    {
        name: "Dracula",
        colors: {
            primary: "#8BE9FD",
            planMode: "#BD93F9",
            selection: "#44475A",
            thinking: "#F1FA8C",
            success: "#50FA7B",
            error: "#FF5555",
            info: "#8BE9FD",
            background: "#282A36",
            surface: "#343746",
            dialogSurface: "#21222C",
            thinkBorder: "#F1FA8C",
            dimSeperator: "#6272A4",
        },
    },

    {
        name: "Tokyo Night",
        colors: {
            primary: "#7AA2F7",
            planMode: "#BB9AF7",
            selection: "#2F3549",
            thinking: "#E0AF68",
            success: "#9ECE6A",
            error: "#F7768E",
            info: "#7DCFFF",
            background: "#1A1B26",
            surface: "#24283B",
            dialogSurface: "#1F2335",
            thinkBorder: "#E0AF68",
            dimSeperator: "#565F89",
        },
    },

    {
        name: "Nord",
        colors: {
            primary: "#88C0D0",
            planMode: "#B48EAD",
            selection: "#3B4252",
            thinking: "#EBCB8B",
            success: "#A3BE8C",
            error: "#BF616A",
            info: "#81A1C1",
            background: "#2E3440",
            surface: "#3B4252",
            dialogSurface: "#434C5E",
            thinkBorder: "#EBCB8B",
            dimSeperator: "#4C566A",
        },
    },

    {
        name: "Gruvbox Dark",
        colors: {
            primary: "#83A598",
            planMode: "#D3869B",
            selection: "#504945",
            thinking: "#FABD2F",
            success: "#B8BB26",
            error: "#FB4934",
            info: "#8EC07C",
            background: "#282828",
            surface: "#3C3836",
            dialogSurface: "#32302F",
            thinkBorder: "#FABD2F",
            dimSeperator: "#665C54",
        },
    },

    {
        name: "GitHub Dark",
        colors: {
            primary: "#58A6FF",
            planMode: "#BC8CFF",
            selection: "#30363D",
            thinking: "#D29922",
            success: "#3FB950",
            error: "#F85149",
            info: "#79C0FF",
            background: "#0D1117",
            surface: "#161B22",
            dialogSurface: "#21262D",
            thinkBorder: "#D29922",
            dimSeperator: "#484F58",
        },
    },

    {
        name: "Everforest",
        colors: {
            primary: "#7FBBB3",
            planMode: "#D699B6",
            selection: "#3D484D",
            thinking: "#DBBC7F",
            success: "#A7C080",
            error: "#E67E80",
            info: "#83C092",
            background: "#2D353B",
            surface: "#343F44",
            dialogSurface: "#374145",
            thinkBorder: "#DBBC7F",
            dimSeperator: "#4F585E",
        },
    },

    {
        name: "Sakura Pink",
        colors: {
            primary: "#FF8DC7",
            planMode: "#D8B4FE",
            selection: "#5A334F",
            thinking: "#FFE08A",
            success: "#86EFAC",
            error: "#FB7185",
            info: "#7DD3FC",
            background: "#2B1726",
            surface: "#3A2234",
            dialogSurface: "#44283D",
            thinkBorder: "#FFE08A",
            dimSeperator: "#6D4A61",
        },
    },

    {
        name: "Solarized Dark",
        colors: {
            primary: "#268BD2",
            planMode: "#6C71C4",
            selection: "#073642",
            thinking: "#B58900",
            success: "#859900",
            error: "#DC322F",
            info: "#2AA198",
            background: "#002B36",
            surface: "#073642",
            dialogSurface: "#0A3642",
            thinkBorder: "#B58900",
            dimSeperator: "#586E75",
        },
    },

    {
    name: "Ocean Blue",
        colors: {
            primary: "#5CC8FF",
            planMode: "#7C9EFF",
            selection: "#1E3A5F",
            thinking: "#FFD166",
            success: "#4ADE80",
            error: "#FF6B6B",
            info: "#67E8F9",
            background: "#081B29",
            surface: "#0F2A3D",
            dialogSurface: "#14354B",
            thinkBorder: "#FFD166",
            dimSeperator: "#355C7D",
        },
    },

    {
    name: "Blush",
        colors: {
            primary: "#E88CB8",
            planMode: "#C7A6FF",
            selection: "#F2DCE7",
            thinking: "#E7B85A",
            success: "#7CBF91",
            error: "#E57373",
            info: "#7AB8E8",

            background: "#FFF8FB",
            surface: "#FFF2F7",
            dialogSurface: "#FFEAF2",

            thinkBorder: "#E7B85A",
            dimSeperator: "#D8C6CF",
        },
    },
];

export const DEFAULT_THEME =
    THEMES.find((t) => t.name === "Nightfox") ?? THEMES[0]!;