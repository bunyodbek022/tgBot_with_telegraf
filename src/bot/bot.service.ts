import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

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
}
