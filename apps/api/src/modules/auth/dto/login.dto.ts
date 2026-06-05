import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "customer@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "CorrectHorse42Battery", minLength: 1, maxLength: 128 })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}
