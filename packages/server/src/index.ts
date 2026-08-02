import {Hono} from "hono"
import { HTTPException } from "hono/http-exception";
import sessions from "./routes/sessions"
import chat from "./routes/chat"

const app = new Hono()

app.onError((error, c) => {
    if(error instanceof HTTPException){
        return c.json({
            error: error.message || "Request failed",
        }, error.status)
    }

    console.error("unhandled server error", error)
    return c.json({error: "Internal server error"}, 500)
})

// app.onError((error, c) => {
//     if (error instanceof HTTPException) {
//         return c.json(
//             {
//                 error: error.message || "Request failed",
//             },
//             error.status
//         );
//     }

//     console.error("===== UNHANDLED SERVER ERROR =====");
//     console.error(error);
//     console.error(error.stack);

//     return c.json(
//         {
//             error: error instanceof Error ? error.message : "Internal server error",
//         },
//         500
//     );
// });

const routes = app.route("/sessions", sessions).route("/chat", chat)

export type AppType = typeof routes

export default {port: 3000, fetch: app.fetch, idleTimeout: 255};