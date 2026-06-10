import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy, OnModuleInit {
    
    //nw prisma 7 requires: 
    private static pool: Pool;
    constructor() {
        //on cree le pool de conn PostgreSql
        const connectionString = `${process.env.DATABASE_URL}`;
        const pool = new Pool({ connectionString });
        //on cree ladaptateur Prisma pour pg
        const adapter = new PrismaPg(pool);
        //on passe ladap au constructor parent
        super({ adapter });

        PrismaService.pool = pool;
    }

    async onModuleInit() {
        await this.$connect()
    }

    //à larret du serveur , on se deconnecte properly
    async onModuleDestroy() {
        await this.$disconnect()
    }
}
