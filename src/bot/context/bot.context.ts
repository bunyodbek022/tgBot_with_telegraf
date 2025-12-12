import { Context } from "telegraf"

interface SessionContext {
    step?: "ask_name" | "ask_age"| "ask_phone" | "ask_region" | "ask_district" | "finished" | "menu"
    name?: string,
    phone?: string,
    region?: string,
    district?: string,
    age?: string
}

export class BotContext extends Context {
    session : SessionContext
}