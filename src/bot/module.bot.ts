import { Module } from "@nestjs/common";
import { BotUpdate } from "./update.bot";
import { BotService } from "./bot.service";


@Module({
    providers:[BotUpdate, BotService]
})

export class BotModule{}