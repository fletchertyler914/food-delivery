import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";

export class AuthUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: UserRole })
  role!: UserRole;
}

// Cookie-based auth: refresh tokens travel only as an httponly,
// SameSite=lax cookie scoped to /api/v1/auth. The body returns just
// the short-lived access token + the user. Clients store the access
// token in memory and rely on the browser to attach the refresh
// cookie on /auth/refresh and /auth/logout.
export class AuthResponseDto {
  @ApiProperty({ description: "Short-lived JWT access token, sent as Authorization: Bearer." })
  accessToken!: string;

  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}
