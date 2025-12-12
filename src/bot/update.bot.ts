import { Action, Ctx, On, Start, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { BotContext } from './context/bot.context';
import { BotService } from './bot.service';
import {
  InlineKeyboardMarkup,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove,
} from 'telegraf/types';

@Update()
export class BotUpdate {
  constructor(private readonly botService: BotService) {}
  async checkChannel(ctx: Context) {
    const chatId = ctx.from?.id;
    if (!chatId) return false;

    try {
      const member1 = await ctx.telegram.getChatMember(
        '@the_points_of_Bunyodbek',
        chatId,
      );
      const res1 = ['member', 'administrator', 'creator'].includes(member1.status);
      const member2 = await ctx.telegram.getChatMember(
        '@the_points_of_Bunyodbek',
        chatId,
      );
      const res2 = ['member', 'administrator', 'creator'].includes(member2.status);

      return res1 && res2
    } catch (err) {
      return false;
    }
  }

  @Start()
  onStart(@Ctx() ctx: Context) {
    ctx.reply(`Hush kelibsiz ${ctx.from?.first_name}`);
    ctx.reply("Botdan foydalanish uchun quyidagi kanalga a'zo bo'ling", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '📢 Bunyodbek | blog',
              url: 'https://t.me/the_points_of_Bunyodbek',
            },
          ],
           [
            {
              text: '🧑🏻‍💻 Bunyodbek | fullstack',
              url: 'https://t.me/full_stack_with_Bunyodbek',
            },
          ],
          [
            {
              text: '✅ Obunani tekshirish',
              callback_data: 'check',
            },
          ],
        ],
      },
    });

    return;
  }

  @Action('check')
  async subscriptionCheck(@Ctx() ctx: BotContext) {
    const res = await this.checkChannel(ctx);
    if (res) {
      await ctx.answerCbQuery("Siz kanalga muvaffaqqiyatli qo'shildingiz");

      const chatId = ctx.from?.id;
      if (chatId == undefined) return;

      const userChatId = BigInt(chatId);

      const existingUser = await this.botService.checkInfo(userChatId);

      if (existingUser) {
        ctx.session.step = 'menu';

        await ctx.reply(
          `Xush kelibsiz, **${existingUser.name}**! Siz tizimda ro'yxatdan o'tgansiz.`,
          { parse_mode: 'Markdown' },
        );

        this.sendUserMenu(ctx);
      } else {
        ctx.session.step = 'ask_name';

        await ctx.reply('Iltimos **ismingizni** kiriting: ', {
          parse_mode: `Markdown`,
        });
      }
    } else {
      await ctx.answerCbQuery("Ka'nalga azo boling");
    }
  }

  private sendUserMenu(@Ctx() ctx: BotContext) {
    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [{ text: "📝 Ma'lumotlarni Yangilash", callback_data: 'update_start' }],
        [{ text: "📊 Ma'lumotlarni Ko'rish", callback_data: 'view_data' }],
      ],
    };

    ctx.reply('Iltimos, kerakli amalni tanlang:', {
      reply_markup: keyboard,
      parse_mode: 'Markdown',
    });
  }
  
@Action('update_start')
  async onUpdateStart(@Ctx() ctx: BotContext) {
      await ctx.answerCbQuery("Ma'lumotlarni yangilash jarayoni boshlandi.");
      ctx.session.step = 'ask_name'; 
      
      await ctx.editMessageText('Iltimos **ismingizni** yangidan kiriting:', {
          parse_mode: 'Markdown',
      });
}
  
@Action('view_data')
async onViewData(@Ctx() ctx: BotContext) {
    const userId = ctx.from?.id;
    if (!userId) {
        await ctx.answerCbQuery("Xatolik: Chat ID topilmadi.");
        return;
    }
    
    await ctx.answerCbQuery("Ma'lumotlaringiz yuklanmoqda...");

    const userChatId = BigInt(userId);
    
    try {
        const userData = await this.botService.getUserDataForView(userChatId);

        if (!userData) {
            await ctx.editMessageText(
                "Kechirasiz, bazada ma'lumotingiz topilmadi. Ro'yxatdan o'ting.",
                { parse_mode: 'Markdown' }
            );
            return;
        }

        const message = 
            `**👤 Sizning Ma'lumotlaringiz:**\n\n` +
            `🔹 **Ism:** ${userData.name}\n` +
            `🔹 **Yosh:** ${userData.age} yosh\n` +
            `🔹 **Telefon:** ${userData.phone}\n\n` +
            `📍 **Viloyat:** ${userData.region.name}\n` +
            `🏙️ **Tuman:** ${userData.district.name}\n`;

        await ctx.editMessageText(message, { 
            parse_mode: 'Markdown' 
        });

        this.sendUserMenu(ctx);

    } catch (e) {
        console.error("Ma'lumotlarni ko'rishda xato:", e);
        await ctx.editMessageText(
            "Ma'lumotlarni yuklashda texnik xato yuz berdi.",
            { parse_mode: 'Markdown' }
        );
    }
}


  @On('text')
  async ontext(@Ctx() ctx: BotContext) {
    const text = ctx.message?.['text'];
    if (ctx.session.step == 'ask_name') {
      ctx.session.name = text;
      ctx.session.step = 'ask_age';
      ctx.reply(
        `Rahmat, ${text}!\n\nEndi **yoshingizni** kiriting (faqat raqamda):`,
        { parse_mode: 'Markdown' },
      );
    } else if (ctx.session.step == 'ask_age') {
      const age = parseInt(text, 10);
      if (isNaN(age) || age < 5 || age > 100) {
        return await ctx.reply("Iltimos, yoshni to'g'ri raqam bilan kiriting.");
      }

      ctx.session.age = String(age);
      ctx.session.step = 'ask_phone';

      const keyboard: ReplyKeyboardMarkup = {
        keyboard: [[{ text: '📲 Raqamni yuborish', request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      };

      ctx.reply('Yaxshi. Endi **telefon raqamingizni** yuboring:', {
        reply_markup: keyboard,
        parse_mode: 'Markdown',
      });
    } else {
      return ctx.reply("Noma'lum buyruq. Iltimos, davom eting yoki /start bosing.");
    }
  }



  @On('contact')
  async onContact(@Ctx() ctx: BotContext) {
    if (ctx.session.step == 'ask_phone') {
      const phone = ctx.message?.['contact'].phone_number;
      ctx.session.phone = phone;
      ctx.session.step = 'ask_region';

      const removeKeyboard: ReplyKeyboardRemove = { remove_keyboard: true };
      await ctx.reply('Telefon raqami qabul qilindi.', {
        reply_markup: removeKeyboard,
      });
      await this.askRegion(ctx);
    }
  }

  private async askRegion(ctx: BotContext) {
    const regions = await this.botService.getRegion();
    const regionsName = regions.map((r) => r.name);

    const keyboard = {
      inline_keyboard: regionsName.map((name) => [
        { text: name, callback_data: `region_select:${name}` },
      ]),
    };
    await ctx.reply('Iltimos viloyatingini tanlang: ', {
      reply_markup: keyboard,
      parse_mode: 'Markdown',
    });
  }

  @Action(/region_select:(.+)/)
  async onRegionSelected(@Ctx() ctx: BotContext) {
    const regionName = (ctx as any).match[1];
    await ctx.answerCbQuery();
    ctx.session.region = regionName;

    ctx.session.step = 'ask_district';

    await this.askDistrict(ctx, regionName);
  }

  private async askDistrict(ctx: BotContext, regionName: string) {
    const districtNames = await this.botService.getDisrictsByRegion(regionName);

    const keyboard = {
      inline_keyboard: districtNames.map((name) => [
        { text: name, callback_data: `district_select:${name}` },
      ]),
    };

    await ctx.editMessageText(
      `Tanlangan viloyat: **${regionName}**\n\nEndi **tumanni** tanlang:`,
      {
        reply_markup: keyboard,
        parse_mode: 'Markdown',
      },
    );
  }

  @Action(/district_select:(.+)/)
  async onDistrictSelected(@Ctx() ctx: BotContext) {
    if (ctx.session.step !== 'ask_district') return;
    const districtName = (ctx as any).match[1];
    await ctx.answerCbQuery();
    ctx.session.district = districtName;
    ctx.session.step = 'finished';

    const regionId = await this.botService.getRegionIdByName(
      ctx.session.region!,
    );

    if (!regionId) {
      return ctx.editMessageText(
        "Kechirasiz, tanlangan viloyat topilmadi. Qayta urinib ko'ring.",
      );
    }

    const districtId = await this.botService.getDistrictIdByName(
      districtName,
      regionId,
    );

    if (!districtId) {
      return ctx.editMessageText(
        "Kechirasiz, tanlangan tuman topilmadi. Qayta urinib ko'ring.",
      );
    }

    const userToSave = {
      chatId: BigInt(ctx.from!.id),
      name: ctx.session.name!,
      age: ctx.session.age!,
      phone: ctx.session.phone!,
      regionId: regionId,
      districtId: districtId,
    };

    try {
      await this.botService.saveUser(userToSave as any);

      await ctx.editMessageText(
        `🎉 Tabriklaymiz! Ro'yxatdan o'tish yakunlandi.\n\n`,
      );
    } catch (e) {
      console.error('Foydalanuvchini saqlashda xato:', e);
      await ctx.editMessageText(
        "Kechirasiz, ma'lumotlarni saqlashda texnik xato yuz berdi. Iltimos, keyinroq urinib ko'ring.",
        { parse_mode: 'Markdown' },
      );
    }

    ctx.session = {};
  }
}
