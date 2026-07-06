import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { UpdateProfileDto } from '../dtos/update-profile.dto';

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id_user: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (dto.name !== undefined) {
      user.name = dto.name;
    }
    if (dto.email !== undefined) {
      user.email = dto.email;
    }

    await this.userRepository.save(user);
    return { message: 'Perfil actualizado exitosamente' };
  }
}
