import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../../users/entities/user.entity';
import { UpdatePasswordDto } from '../dtos/update-password.dto';

@Injectable()
export class UpdatePasswordUseCase {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(
    userId: number,
    dto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id_user: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isMatch = await bcrypt.compare(dto.current_password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('La contraseña actual no es correcta');
    }

    user.password = await bcrypt.hash(dto.new_password, 10);
    await this.userRepository.save(user);

    return { message: 'Contraseña actualizada exitosamente' };
  }
}
