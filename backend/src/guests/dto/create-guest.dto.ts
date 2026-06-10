import { IsString, IsNotEmpty, IsInt, Min, IsOptional, IsBoolean } from 'class-validator';

export class CreateGuestDto {
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsInt()
  @Min(1)
  allowedSeats!: number;

  @IsString()
  @IsOptional()
  tableNumber?: string;

  @IsBoolean()
  @IsOptional()
  isVip?: boolean;

  @IsString()
  @IsOptional()
  guestCategory?: string;
}