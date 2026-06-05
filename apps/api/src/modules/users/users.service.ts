import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

import { PrismaService } from "../../prisma/prisma.service";
import { RegistrationFailedError } from "../../common/errors/auth.errors";
import type { User, UserRole } from "@prisma/client";

export interface CreateUserInput {
  readonly email: string;
  readonly password: string;
  readonly name: string;
  readonly role: UserRole;
}

const BCRYPT_COST = 12;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateUserInput): Promise<User> {
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
    const email = normalizeEmail(input.email);

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new RegistrationFailedError();
    }

    try {
      return await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          name: input.name,
          role: input.role
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new RegistrationFailedError();
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: normalizeEmail(email) }
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
