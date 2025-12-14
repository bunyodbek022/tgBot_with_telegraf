import { Action, Ctx, On, Start, Update } from 'nestjs-telegraf';
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

  private channels = [
    {
      name: 'Bunyodbek | blog',
      username: '@the_points_of_Bunyodbek',
      url: 'https://t.me/the_points_of_Bunyodbek',
    },
    {
      name: 'Bunyodbek | fullstack',
      username: '@full_stack_with_Bunyodbek',
      url: 'https://t.me/full_stack_with_Bunyodbek',
    },
  ];

  @Start()
  async onStart(@Ctx() ctx: BotContext) {
    const chatId = ctx.from?.id;
    if (!chatId) return;

    const isAdmin = await this.botService.isAdmin(BigInt(chatId));

    const subcribedChannels = await this.botService.checkUserSubscriptions(
      ctx,
      this.channels,
    );

    const channelButtons = this.channels
      .filter((ch) => !subcribedChannels.includes(ch.username))
      .map((ch) => [{ text: ch.name, url: ch.url }]);

    const buttons: any[] = [...channelButtons];
    if (channelButtons.length > 0) {
      buttons.push([{ text: '✅ Obunani tekshirish', callback_data: 'check' }]);
    }

    if (isAdmin) {
      return await ctx.reply(
        '🛠 Siz admin sifatida kirdingiz.\n/admin — admin panel',
      );
    }

    ctx.reply(`Hush kelibsiz ${ctx.from?.first_name}`);

    if (buttons.length > 0) {
      await ctx.reply(
        "Botdan foydalanish uchun quyidagi kanalga a'zo bo'ling:",
        {
          reply_markup: { inline_keyboard: buttons },
        },
      );
    } else {
      ctx.session.step = 'menu';
      this.sendUserMenu(ctx as BotContext);
    }

    return;
  }

  @On('text')
  async onText(@Ctx() ctx: BotContext) {
    const text = ctx.message?.['text'];
    const chatId = ctx.from?.id;
    if (!text || !chatId) return;

    // ===== ADMIN PANEL =====
    if (text === '/admin') {
      const isAdmin = await this.botService.isAdmin(BigInt(chatId));
      if (!isAdmin) return await ctx.reply('⛔ Siz admin emassiz.');
      await this.sendAdminMenu(ctx);
      return;
    }

    // ===== ADMIN TEST CREATE =====
    if (ctx.session.step === 'test_code') {
      ctx.session.testCode = text;
      ctx.session.step = 'test_answers';
      await ctx.reply(
        '✅ Test kodi qabul qilindi.\n\nTogri javoblarni kiriting (masalan: ABCDAB):',
      );
      return;
    }

    if (ctx.session.step === 'test_answers') {
      ctx.session.correctAnswers = text;
      ctx.session.step = 'test_start_time';
      await ctx.reply(
        '⏰ Test BOSHLANISH vaqtini kiriting\nFormat: YYYY-MM-DD HH:mm',
      );
      return;
    }

    if (ctx.session.step === 'test_start_time') {
      ctx.session.startTime = text;
      ctx.session.step = 'test_end_time';
      await ctx.reply(
        '⏰ Test TUGASH vaqtini kiriting\nFormat: YYYY-MM-DD HH:mm',
      );
      return;
    }

    if (ctx.session.step === 'test_end_time') {
      ctx.session.endTime = text;
      if (
        !ctx.session.testCode ||
        !ctx.session.correctAnswers ||
        !ctx.session.startTime ||
        !ctx.session.endTime
      ) {
        await ctx.reply(
          "❌ Test ma'lumotlari to'liq emas. Qaytadan urinib ko'ring.",
        );
        return;
      }

      try {
        const test = await this.botService.createTest({
          code: ctx.session.testCode,
          correctAnswers: ctx.session.correctAnswers,
          startTime: new Date(ctx.session.startTime),
          endTime: new Date(ctx.session.endTime),
          createdByChatId: BigInt(chatId),
        });

        await ctx.telegram.sendMessage(
          '@full_stack_with_Bunyodbek',
          `📝 YANGI TEST E'LON QILINDI\n\n` +
            `🆔 Test kodi: ${test.code}\n` +
            `⏰ Boshlanish: ${test.startTime.toLocaleString()}\n` +
            `⏰ Tugash: ${test.endTime.toLocaleString()}\n\n` +
            `Javob yuborish formati:\n` +
            `${test.code}-ABCDA...`,
        );

        ctx.session = {};
        ctx.reply("✅ Test yaratildi va kanalga e'lon qilindi.");
        return;
      } catch (e) {
        console.error(e);
        return ctx.reply('❌ Test yaratishda xatolik yuz berdi.');
      }
    }

    // ===== USER REGISTRATION =====
    if (ctx.session.step == 'ask_name') {
      ctx.session.name = text;
      ctx.session.step = 'ask_age';
      return ctx.reply(
        `Rahmat, ${text}!\n\nEndi **yoshingizni** kiriting (faqat raqamda):`,
        { parse_mode: 'Markdown' },
      );
    }

    if (ctx.session.step == 'ask_age') {
      const age = parseInt(text, 10);
      if (isNaN(age) || age < 5 || age > 100) {
        return ctx.reply("Iltimos, yoshni to'g'ri raqam bilan kiriting.");
      }
      ctx.session.age = String(age);
      ctx.session.step = 'ask_phone';
      const keyboard = {
        keyboard: [[{ text: '📲 Raqamni yuborish', request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      };
      return ctx.reply('Yaxshi. Endi **telefon raqamingizni** yuboring:', {
        reply_markup: keyboard,
        parse_mode: 'Markdown',
      });
    }

    if (ctx.session.step == 'check_test') {
      const text = ctx.message?.['text'];
      if (!text) return;

      const match = text.match(/^([A-Z0-9]+)-([A-Z]+)$/i);
      if (!match) return;

      const testCode = match[1].toUpperCase();
      const userAnswers = match[2].toUpperCase();

      const userId = BigInt(ctx.from!.id);

      const test = await this.botService.getTestByCode(testCode);
      if (!test) return ctx.reply('❌ Bunday test topilmadi.');

      const now = new Date();
      if (now < test.startTime) {
        await ctx.reply('❌ Test hali boshlanmadi.');
        return
      }
      if (now > test.endTime) {
        await ctx.reply('❌ Test topshirish vaqti tugagan.');
        return
      }


      const existingSubmission = await this.botService.getUserSubmission(
        userId,
        test.id,
      );
      if (existingSubmission) {
        await ctx.reply('❌ Siz allaqachon javob bergansiz.');
        return;
      }

      let score = 0;
      const correctAnswers = test.correctAnswers.toUpperCase();

      if (userAnswers.length !== correctAnswers.length) {
        await ctx.reply(
          `❌ Javoblar soni ${correctAnswers.length} bo'lishi kerak.`,
        );
        return;
      }
      for (let i = 0; i < correctAnswers.length; i++) {
        if (userAnswers[i] === correctAnswers[i]) score++;
      }
      await this.botService.saveTestSubmission({
        testId: test.id,
        userId,
        answers: userAnswers,
        score,
      });

      const scorePlace = await this.botService.scorePlace(userId, test.id);
      await ctx.reply(
        `✅ Sizning natijangiz: \n\n⁉️Jami savollar: ${correctAnswers.length} \n\n ✅To'gri jabolar : ${score}\n\n 🏅O'rin : ${scorePlace}`,
      );
      return;
    }

    // ===== DEFAULT =====
    await ctx.reply(
      "Noma'lum buyruq. Iltimos, davom eting yoki /start bosing.",
    );
    return;
  }

  // ======Actions===============

  @Action('check_test')
  async onUserTest(@Ctx() ctx: BotContext) {
    await ctx.editMessageText(
      'Javoblaringinzni yuboring. Masalan(TEST123-ABCDA)',
      {
        parse_mode: 'Markdown',
      },
    );

    ctx.session.step = 'check_test';
  }

  @Action('admin_create_test')
  async adminCreateTest(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    ctx.session = {};
    ctx.session.step = 'test_code';

    await ctx.reply(
      '📝 Yangi test yaratish\n\nTest kodini kiriting  (masalan: TEST123):',
    );
  }

  @Action('admin_tests_list')
  async adminTestsList(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    await ctx.reply('📋 Testlar royxati (keyingi bosqichda qoshiladi)');
  }

  @Action('admin_test_results')
  async adminTestResults(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    await ctx.reply('📊 Test natijalari (keyingi bosqichda qoshiladi)');
  }

  @Action('check')
  async subscriptionCheck(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery('Tekshirilmoqda...');

    const subcribedChannels = await this.botService.checkUserSubscriptions(
      ctx,
      this.channels,
    );

    const notSubscribed = this.channels.filter(
      (ch) => !subcribedChannels.includes(ch.username),
    );

    if (notSubscribed.length > 0) {
      const channelButtons = notSubscribed.map((ch) => [
        { text: ch.name, url: ch.url },
      ]);

      const buttons: any[] = [...channelButtons];
      buttons.push([{ text: '🔄 Qayta tekshirish', callback_data: 'check' }]);

      return await ctx.editMessageText(
        "Iltimos, quyidagi kanallarga a'zo bo'ling:",
        {
          reply_markup: { inline_keyboard: buttons },
        },
      );
    }

    const chatId = ctx.from?.id;
    if (!chatId) return;

    const userChatId = BigInt(chatId);
    const existingUser = await this.botService.checkInfo(userChatId);

    await ctx.editMessageText(
      "Siz barcha kanallarga muvaffaqiyatli obuna bo'ldingiz.",
    );

    if (existingUser) {
      ctx.session.step = 'menu';

      await ctx.reply(`Xush kelibsiz, **${existingUser.name}**!`, {
        parse_mode: 'Markdown',
      });

      return this.sendUserMenu(ctx);
    }

    ctx.session.step = 'ask_name';
    await ctx.reply('Iltimos **ismingizni** kiriting:', {
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
      await ctx.answerCbQuery('Xatolik: Chat ID topilmadi.');
      return;
    }

    await ctx.answerCbQuery("Ma'lumotlaringiz yuklanmoqda...");

    const userChatId = BigInt(userId);

    try {
      const userData = await this.botService.getUserDataForView(userChatId);

      if (!userData) {
        await ctx.editMessageText(
          "Kechirasiz, bazada ma'lumotingiz topilmadi. Ro'yxatdan o'ting.",
          { parse_mode: 'Markdown' },
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
        parse_mode: 'Markdown',
      });

      this.sendUserMenu(ctx);
    } catch (e) {
      console.error("Ma'lumotlarni ko'rishda xato:", e);
      await ctx.editMessageText(
        "Ma'lumotlarni yuklashda texnik xato yuz berdi.",
        { parse_mode: 'Markdown' },
      );
    }
  }

  @Action(/region_select:(.+)/)
  async onRegionSelected(@Ctx() ctx: BotContext) {
    const regionName = (ctx as any).match[1];
    await ctx.answerCbQuery();
    ctx.session.region = regionName;

    ctx.session.step = 'ask_district';

    await this.askDistrict(ctx, regionName);
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
      return this.sendUserMenu(ctx);
    } catch (e) {
      console.error('Foydalanuvchini saqlashda xato:', e);
      await ctx.editMessageText(
        "Kechirasiz, ma'lumotlarni saqlashda texnik xato yuz berdi. Iltimos, keyinroq urinib ko'ring.",
        { parse_mode: 'Markdown' },
      );
    }

    ctx.session = {};
  }

  @On('contact')
  async onContact(@Ctx() ctx: BotContext) {
    if (ctx.session.step == 'ask_phone') {
      const phone = await ctx.message?.['contact'].phone_number;
      ctx.session.phone = phone;
      ctx.session.step = 'ask_region';

      const removeKeyboard: ReplyKeyboardRemove = { remove_keyboard: true };
      await ctx.reply('Telefon raqami qabul qilindi.', {
        reply_markup: removeKeyboard,
      });
      await this.askRegion(ctx);
    }
  }

  private async sendUserMenu(@Ctx() ctx: BotContext) {
    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [{ text: "📝 Ma'lumotlarni Yangilash", callback_data: 'update_start' }],
        [{ text: "📊 Ma'lumotlarni Ko'rish", callback_data: 'view_data' }],
        [{ text: '✅ Testni tekshirish', callback_data: 'check_test' }],
      ],
    };

    await ctx.reply('Iltimos, kerakli amalni tanlang:', {
      reply_markup: keyboard,
      parse_mode: 'Markdown',
    });
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

  private async sendAdminMenu(ctx: BotContext) {
    const keyboard = {
      inline_keyboard: [
        [{ text: '➕ Test yaratish', callback_data: 'admin_create_test' }],
        [{ text: '📋 Testlar royxati', callback_data: 'admin_tests_list' }],
        [{ text: '📊 Test natijalari', callback_data: 'admin_test_results' }],
      ],
    };

    await ctx.reply('🛠 Admin Panel:', {
      reply_markup: keyboard,
    });
  }
}
