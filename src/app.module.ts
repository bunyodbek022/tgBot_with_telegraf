import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { BotModule } from './bot/module.bot';
import { session } from 'telegraf';
import { PrismaModule } from './prisma/prisma.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal : true
    }),
    TelegrafModule.forRoot({
      token: process.env.BOT_TOKEN as string,
      middlewares : [session()]
    }),
    BotModule,
    PrismaModule
  ]
})
export class AppModule {}
