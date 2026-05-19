import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/user.entity';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import { hashPassword } from '../utils/password.utils';

export class UserService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Hash password if provided
    let hashedPassword = createUserDto.password ? await hashPassword(createUserDto.password) : null;
    
    const user = this.userRepository.create({
      lastName: createUserDto.lastName,
      cycle: createUserDto.cycle || null,
      expirationDate: createUserDto.expirationDate || null,
      subscriptionType: createUserDto.subscriptionType || null,
      email: createUserDto.email,
      password: hashedPassword,
    });
    return await this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({ relations: ['households'] });
  }

  async findOne(id: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id },
      relations: ['households'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    try{
          return await this.userRepository.findOne({ where: { email } });

    }
    catch(error){
      console.error("Error finding user by email:", error);
      throw error;
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    // Hash password if being updated
    let updateData = { ...updateUserDto };
    if (updateData.password) {
      console.log('[UserService.update] Plain password received:', updateData.password);
      updateData.password = await hashPassword(updateData.password);
      console.log('[UserService.update] Hashed password to save:', updateData.password);
    }

    await this.userRepository.update(id, updateData);
    const updatedUser = await this.findOne(id);
    if (updateUserDto.password) {
      console.log('[UserService.update] Password in DB after save:', updatedUser?.password);
    }
    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
}

export const userService = new UserService();