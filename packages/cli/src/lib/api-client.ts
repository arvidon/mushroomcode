import { hc } from "hono/client";
import type {AppType} from "@mushroomcode/server"
import { getAuth } from "./auth"

export const apiClient = hc<AppType>(process.env.API_URL ?? "http://localhost:3000", {
  headers: (): Record<string, string> => {
    const auth = getAuth()
    return auth ? { Authorization: `Bearer ${auth.token}` } : {}
  },
})
