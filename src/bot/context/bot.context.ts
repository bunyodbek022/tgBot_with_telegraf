import { Context } from "telegraf"

interface SessionContext {
    step?: "ask_name" | "ask_age"| "ask_phone" | "ask_region" | "ask_district" | "finished" | "menu" | "test_code" | "test_answers" | "test_start_time" | "test_end_time" | "check_test"
    name?: string,
    phone?: string,
    region?: string,
    district?: string,
    age?: string, 
    testCode?: string,
    correctAnswers?: string,
    startTime?: string,
    endTime?: string
}

export class BotContext extends Context {
    session : SessionContext
}