import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Context } from 'telegraf';
import { BotContext } from './context/bot.context';

interface UserRegistrationData {
    chatId: bigint;
    name: string;
    age: string;
    phone: string;
    region: string;
    district: string;
}

@Injectable()
export class BotService {
  constructor(private readonly prisma: PrismaService) {}
  async getRegion() {
    return await this.prisma.region.findMany({
      select: { name: true },
    });
  }
    async getDisrictsByRegion(regionName : string) {
      const region = await this.prisma.region.findFirst({
    where: { name: regionName },
    include: { districts: { select: { name: true } } }
      });
        return region ? region.districts.map(d => d.name) : [];
    }
    
    async getRegionIdByName(name: string): Promise<number | null> {
    const region = await this.prisma.region.findFirst({
      where: { name: name },
      select: { id: true },
    });
    return region?.id || null;
  }

  async getDistrictIdByName(districtName: string, regionId: number): Promise<number | null> {
    const district = await this.prisma.district.findFirst({
      where: { 
        name: districtName,
        regionId: regionId, 
      },
      select: { id: true },
    });
    return district?.id || null;
  }
  
  async saveUser(data: UserRegistrationData & { regionId: number, districtId: number }) {

    const userData = {
        chatId: data.chatId,
        name: data.name,
        age: String(data.age), 
        phone: data.phone,
        regionId: data.regionId,
        districtId: data.districtId,
    };


    const existingUser = await this.prisma.user.findUnique({
        where : {chatId : data.chatId}
    });

    if (existingUser) {
        return this.prisma.user.update({
            where: { chatId: data.chatId },
            data: userData,
        });
    }

    return this.prisma.user.create({ data: userData });
  }

  async checkInfo(chatId: bigint) {
    const existingUser = await this.prisma.user.findUnique({
        where : {chatId}
    });
    return existingUser
  }

  async getUserDataForView(chatId: bigint) {
    return await this.prisma.user.findUnique({
        where: { chatId: chatId },
        select: {
            name: true,
            age: true,
            phone: true,
            region: {
                select: { name: true } 
            },
            district: {
                select: { name: true } 
            }
        }
    });
  }
  
  async checkUserSubscriptions(ctx: Context, channels) {
  const chatId = ctx.from?.id;
  if (!chatId) return [];

  const subscriptions: string[] = [];

  for (const channel of channels) {
    try {
      const member = await ctx.telegram.getChatMember(channel.username, chatId);
      if (['member', 'administrator', 'creator'].includes(member.status)) {
        subscriptions.push(channel.username);
      }
    } catch (err) {
      console.log(err)
    }
  }

  return subscriptions;
  }
  async scorePlace(userId: bigint, test_id: number) {
  const queue = await this.prisma.testSubmission.findMany({
    where: { testId: test_id },
    orderBy: { score: 'desc' }
  });

  for (let i = 0; i < queue.length; i++) {
    if (queue[i].userId === userId) {
      return i + 1; // 
    }
  }

  return null; 
}


  async getUserSubmission(userChatId: bigint, testId: number) {
  const user = await this.prisma.user.findUnique({ where: { chatId: userChatId } });
  if (!user) return null;
  return this.prisma.testSubmission.findUnique({ where: { testId_userId: { testId, userId: user.chatId } } });
}

async saveTestSubmission(data: { testId: number; userId: any; answers: string; score: number }) {
  return this.prisma.testSubmission.create({ data});
}
 
  
  // ======ADMIN=====
  async isAdmin(chatId: bigint): Promise<boolean> {
  const user = await this.prisma.user.findUnique({
    where: { chatId },
    select: { role: true },
  });

  return user?.role === 'ADMIN';
  }
  
  async createTest(data: {
  code: string;
  correctAnswers: string;
  startTime: Date;
  endTime: Date;
  createdByChatId: bigint;
}) {
  const admin = await this.prisma.user.findUnique({
    where: { chatId: data.createdByChatId },
  });

  if (!admin) {
    throw new Error('Admin topilmadi');
  }

  return this.prisma.test.create({
    data: {
      code: data.code,
      correctAnswers: data.correctAnswers.toUpperCase(),
      startTime: data.startTime,
      endTime: data.endTime,
      createdById: admin.id,
    },
  });
}

async getTestByCode(code: string) {
  return this.prisma.test.findUnique({ where: { code } });
}


}
