import { Prisma } from "@prisma/client";
import type { User } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RegistrationFailedError } from "../../common/errors/auth.errors";
import type { PrismaService } from "../../prisma/prisma.service";
import { UsersService, type CreateUserInput } from "./users.service";

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed-password"),
    compare: vi.fn().mockResolvedValue(true)
  }
}));

interface PrismaUserMock {
  findUnique: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
}

function buildPrisma(user: PrismaUserMock): PrismaService {
  return { user } as unknown as PrismaService;
}

const input: CreateUserInput = {
  email: "  New@Example.com ",
  password: "Password123!",
  name: "New User",
  role: "CUSTOMER"
};

const createdUser = { id: "u-1", email: "new@example.com" } as User;

describe("UsersService.create", () => {
  let prismaUser: PrismaUserMock;

  beforeEach(() => {
    prismaUser = {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(createdUser)
    };
  });

  it("normalizes the email and persists the hashed password", async () => {
    const service = new UsersService(buildPrisma(prismaUser));

    const result = await service.create(input);

    expect(result).toBe(createdUser);
    expect(prismaUser.findUnique).toHaveBeenCalledWith({ where: { email: "new@example.com" } });
    expect(prismaUser.create).toHaveBeenCalledWith({
      data: {
        email: "new@example.com",
        passwordHash: "hashed-password",
        name: "New User",
        role: "CUSTOMER"
      }
    });
  });

  it("throws RegistrationFailedError when the email is already taken", async () => {
    prismaUser.findUnique.mockResolvedValue(createdUser);
    const service = new UsersService(buildPrisma(prismaUser));

    await expect(service.create(input)).rejects.toBeInstanceOf(RegistrationFailedError);
    expect(prismaUser.create).not.toHaveBeenCalled();
  });

  it("maps a Prisma P2002 unique-violation race to RegistrationFailedError", async () => {
    prismaUser.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test"
      })
    );
    const service = new UsersService(buildPrisma(prismaUser));

    await expect(service.create(input)).rejects.toBeInstanceOf(RegistrationFailedError);
  });

  it("re-throws unexpected Prisma errors unchanged", async () => {
    const unexpected = new Prisma.PrismaClientKnownRequestError("Something else", {
      code: "P2003",
      clientVersion: "test"
    });
    prismaUser.create.mockRejectedValue(unexpected);
    const service = new UsersService(buildPrisma(prismaUser));

    await expect(service.create(input)).rejects.toBe(unexpected);
  });
});

describe("UsersService lookups", () => {
  it("findByEmail normalizes the address before querying", async () => {
    const prismaUser: PrismaUserMock = {
      findUnique: vi.fn().mockResolvedValue(createdUser),
      create: vi.fn()
    };
    const service = new UsersService(buildPrisma(prismaUser));

    await expect(service.findByEmail("  New@Example.com ")).resolves.toBe(createdUser);
    expect(prismaUser.findUnique).toHaveBeenCalledWith({ where: { email: "new@example.com" } });
  });

  it("findById loads the user by primary key", async () => {
    const prismaUser: PrismaUserMock = {
      findUnique: vi.fn().mockResolvedValue(createdUser),
      create: vi.fn()
    };
    const service = new UsersService(buildPrisma(prismaUser));

    await expect(service.findById("u-1")).resolves.toBe(createdUser);
    expect(prismaUser.findUnique).toHaveBeenCalledWith({ where: { id: "u-1" } });
  });
});
