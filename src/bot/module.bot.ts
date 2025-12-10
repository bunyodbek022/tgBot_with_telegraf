import { Module } from "@nestjs/common";
import { BotUpdate } from "./update.bot";


@Module({
    providers:[BotUpdate]
})

export class BotModule{}