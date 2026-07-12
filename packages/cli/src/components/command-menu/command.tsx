import type { Command } from "./types"

export const COMMANDS: Command[] = [
    {
        name: "new",
        description: "start a new conversation",
        value: "/new",
    },
    {
        name: "agents",
        description: "switsch between agents",
        value: "/agents"
    },
    {
        name: "models",
        description: "select AI model for generation",
        value: "/models"
    },
    {
        name: "sessions",
        description: "browse past sessions",
        value: "/sessions"
    },
    {
        name: "theme",
        description: "change color theme",
        value: "/theme"
    },
    {
        name: "login",
        description: "Sign in with your browser",
        value: "/login"
    },
    {
        name: "logout",
        description: "sign out of your account",
        value: "/logout"
    },
    {
        name: "upgrade",
        description: "buy more credits",
        value: "/upgrade"
    },
    {
        name: "usage",
        description: "Open billing portal in your browser",
        value: "/usage"
    }, 
    {
        name: "exit",
        description: "quit the application",
        value: "/exit",
        action: (ctx) => {
            ctx.exit()
        }
    }
]