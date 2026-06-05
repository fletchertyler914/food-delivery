import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { IsEmail, IsEnum, IsString, MaxLength, MinLength } from "class-validator";

export class SignupDto {
  @ApiProperty({ example: "customer@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "Alex Customer", minLength: 1, maxLength: 80 })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @ApiProperty({ example: "CorrectHorse42Battery", minLength: 12, maxLength: 128 })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CUSTOMER })
  @IsEnum(UserRole)
  role!: UserRole;
}
