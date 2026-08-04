import { SUPPORTED_CHAT_MODELS } from "@mushroomcode/shared"
import { AgentsDialogContent, SessionsDialogContent, ThemeDialog, ModelsDialogContent } from "../dialogs"
import type { Command } from "./types"

export const COMMANDS: Command[] = [
    {
        name: "new",
        description: "start a new conversation",
        value: "/new",
        action: (ctx) => {
            ctx.navigate('/')
        }
    },
    {
        name: "agents",
        description: "switsch between agents",
        value: "/agents",
        action: (ctx) => {
            ctx.dialog.open({
                title: "Select Agent",
                children: <AgentsDialogContent currentMode={ctx.mode} onSelectMode={ctx.setMode}/>
            })
        }
    },
    {
        name: "models",
        description: "select AI model for generation",
        value: "/models",
        action: (ctx) => {
            ctx.dialog.open({
                title: "Select Agent",
                children: <ModelsDialogContent models={SUPPORTED_CHAT_MODELS.map((model) => model.id)}
                onSelectModel={ctx.setModel}
                />
            })
        }
    },
    {
        name: "sessions",
        description: "browse past sessions",
        value: "/sessions",
        action: (ctx) => {
            ctx.dialog.open({
                title: "Select session",
                children: <SessionsDialogContent/>
            })
        }
    },
    {
        name: "theme",
        description: "change color theme",
        value: "/theme",
        action: (ctx) => {
            ctx.dialog.open({
                title: "Select Theme",
                children: <ThemeDialog/>
            })
        }
    },
    {
        name: "login",
        description: "Sign in with your browser",
        value: "/login",
        action: (ctx) => {
            ctx.toast.show({message: "Opening browser to sign in "})
        }
    },
    {
        name: "logout",
        description: "sign out of your account",
        value: "/logout",
        action: (ctx) => {
            ctx.toast.show({variant: "success", message: "Signed out"})
        }
    },
    {
        name: "upgrade",
        description: "buy more credits",
        value: "/upgrade",
        action: (ctx) => {
            ctx.toast.show({message: "Opening credits checkout..."})
        }
    },
    {
        name: "usage",
        description: "Open billing portal in your browser",
        value: "/usage",
        action: (ctx) => {
            ctx.toast.show({message: "Opening billing portal..."})
        }
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