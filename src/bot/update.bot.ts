import { Ctx, On, Start, Update } from "nestjs-telegraf";
import { Context } from "telegraf";


@Update()
export class BotUpdate {
    @Start()
    onStart(@Ctx() ctx: Context) {
        ctx.reply(`Hush kelibsiz ${ctx.message!.from.id} `)
        return 
    }

    @On("text")
    ontext(@Ctx() ctx: Context) {
        ctx.telegram.sendMessage(ctx.message!.from.id, "salom")
    }
}