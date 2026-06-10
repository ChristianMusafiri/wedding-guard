import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';

export class ScanGuestDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsInt()
  @Min(1)
  enteringSeats!: number; // Nombre de personnes qui se présentent au scan
}