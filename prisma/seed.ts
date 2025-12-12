import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { PrismaService } from 'src/prisma/prisma.service';

class Seeder {
  constructor(private readonly prisma: PrismaService) {}
  async run() {
    const regions = [
      {
        name: "Qoraqalpog'iston Respublikasi",
        districts: [
          'Amudaryo',
          'Beruniy',
          'Kegayli',
          'Kungrad',
          'Moynaq',
          'Nukus shahri',
          'Nukus tumani',
          'Qanlikol',
          "Qo'ng'irot",
          'Shumanay',
          "Taxtako'pir",
          "To'rtko'l",
          "Xo'jayli",
          "Ellikqal'a",
        ],
      },
      {
        name: 'Andijon',
        districts: [
          'Andijon shahri',
          'Andijon tumani',
          'Asaka',
          'Baliqchi',
          "Bo'z",
          'Buloqboshi',
          'Jalaquduq',
          'Izboskan',
          'Marhamat',
          "Oltinko'l",
          'Paxtaobod',
          "Qo'rg'ontepa",
          'Shahrixon',
          "Ulug'nor",
          "Xo'jaobod",
        ],
      },
      {
        name: "Farg'ona",
        districts: [
          "Farg'ona shahri",
          'Oltiariq',
          "Bag'dod",
          'Beshariq',
          'Buvayda',
          "Dang'ara",
          "Farg'ona tumani",
          'Furqat',
          "Qo'qon shahri",
          'Quva',
          'Rishton',
          "So'x",
          'Toshloq',
          "Uchko'prik",
          'Yozyovon',
        ],
      },
      {
        name: 'Namangan',
        districts: [
          'Namangan shahri',
          'Chortoq',
          'Chust',
          'Kosonsoy',
          'Mingbuloq',
          'Namangan tumani',
          'Norin',
          'Pop',
          "To'raqo'rg'on",
          "Uchqo'rg'on",
          'Uychi',
          "Yangiqo'rg'on",
        ],
      },
      {
        name: 'Toshkent viloyati',
        districts: [
          'Bekobod',
          "Bo'stonliq",
          "Bo'ka",
          'Chinoz',
          'Ohangaron',
          "Oqqo'rg'on",
          'Parkent',
          'Piskent',
          'Qibray',
          'Quyichirchiq',
          "O'rta Chirchiq",
          "Yangiyo'l",
          'Yuqori Chirchiq',
          'Zangiota',
          'Chirchiq shahri',
          'Angren',
          'Olmaliq',
        ],
      },
      {
        name: 'Toshkent shahri',
        districts: [
          'Bektemir',
          'Chilonzor',
          "Mirzo Ulug'bek",
          'Mirabad',
          'Olmazor',
          'Sergeli',
          'Shayxontohur',
          'Uchtepa',
          'Yakkasaroy',
          'Yashnobod',
          'Yunusobod',
        ],
      },
      {
        name: 'Sirdaryo',
        districts: [
          'Guliston shahri',
          'Guliston tumani',
          'Boyovut',
          'Sardoba',
          'Sayxunobod',
          'Sirdaryo tumani',
          'Oqoltin',
          'Xovos',
          'Mirzaobod',
        ],
      },
      {
        name: 'Jizzax',
        districts: [
          'Jizzax shahri',
          'Arnasoy',
          'Baxmal',
          "Do'stlik",
          'Forish',
          "G'allaorol",
          "Mirzacho'l",
          'Paxtakor',
          'Yangiobod',
          'Zafarobod',
          'Zarbdor',
        ],
      },
      {
        name: 'Samarqand',
        districts: [
          'Samarqand shahri',
          "Bulung'ur",
          'Ishtixon',
          'Jomboy',
          "Kattaqo'rg'on shahri",
          "Kattaqo'rg'on tumani",
          'Narpay',
          'Nurobod',
          'Oqdaryo',
          'Oqdaryolik',
          'Payariq',
          "Pastdarg'om",
          'Paxtachi',
          'Samarqand tumani',
          'Toyloq',
          'Urgut',
        ],
      },
      {
        name: 'Buxoro',
        districts: [
          'Buxoro shahri',
          'Buxoro tumani',
          "G'ijduvon",
          'Jondor',
          'Kogon shahri',
          'Kogon tumani',
          'Olot',
          'Peshku',
          "Qorako'l",
          'Qorovulbozor',
          'Romitan',
          'Shofirkon',
          'Vobkent',
        ],
      },
      {
        name: 'Navoiy',
        districts: [
          'Navoiy shahri',
          'Konimex',
          'Karmana',
          'Qiziltepa',
          'Navbahor',
          'Nurota',
          'Tomdi',
          'Uchquduq',
        ],
      },
      {
        name: 'Qashqadaryo',
        districts: [
          'Qarshi shahri',
          'Dehqonobod',
          "G'uzor",
          'Kasbi',
          'Kitob',
          'Koson',
          'Mirishkor',
          'Muborak',
          'Nishon',
          'Qamashi',
          'Qarshi tumani',
          'Shahrisabz shahri',
          'Shahrisabz tumani',
          "Yakkabog'",
        ],
      },
      {
        name: 'Surxondaryo',
        districts: [
          'Termiz shahri',
          'Angor',
          'Bandixon',
          'Boysun',
          'Denov',
          "Jarqo'rg'on",
          'Muzrabot',
          'Oltinsoy',
          'Qiziriq',
          "Qumqo'rg'on",
          'Sariosiyo',
          'Sherobod',
          "Sho'rchi",
          'Termiz tumani',
        ],
      },
      {
        name: 'Xorazm',
        districts: [
          'Urganch shahri',
          'Urganch tumani',
          "Bog'ot",
          'Gurlan',
          "Qo'shko'pir",
          'Shovot',
          'Xazorasp',
          'Xiva shahri',
          'Xiva tumani',
          'Yangiariq',
          'Yangibozor',
        ],
      },
    ];
    for (const region of regions) {
      const createdRegion = await this.prisma.region.create({
        data: {
          name: region.name,
          districts: {
            create: region.districts.map((d) => ({ name: d })),
          },
        },
      });

      console.log(`Created region: ${createdRegion.name}`);
    }
  }

}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedModule);
  const prismaService = app.get(PrismaService);

  const seeder = new Seeder(prismaService);

  try {
    await seeder.run();
    console.log('Seeding finished!');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    await prismaService.$disconnect();
    await app.close();
  }
}

bootstrap();
