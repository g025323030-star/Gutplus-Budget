import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { FamilyMember } from '../entities/family-member.entity';
import { CreateFamilyMemberDto, UpdateFamilyMemberDto } from '../dto/family-member.dto';

export class FamilyMemberService {
  private familyMemberRepository: Repository<FamilyMember>;

  constructor() {
    this.familyMemberRepository = AppDataSource.getRepository(FamilyMember);
  }

  async create(createFamilyMemberDto: CreateFamilyMemberDto): Promise<FamilyMember> {
    const familyMember = this.familyMemberRepository.create({
      name: createFamilyMemberDto.name,
      role: createFamilyMemberDto.role,
      household: { id: createFamilyMemberDto.householdId } as any,
    });
    return await this.familyMemberRepository.save(familyMember);
  }

  async findAll(): Promise<FamilyMember[]> {
    return await this.familyMemberRepository.find({ relations: ['household'] });
  }

  async findOne(id: string): Promise<FamilyMember | null> {
    return await this.familyMemberRepository.findOne({
      where: { id },
      relations: ['household'],
    });
  }

  async update(id: string, updateFamilyMemberDto: UpdateFamilyMemberDto): Promise<FamilyMember | null> {
    await this.familyMemberRepository.update(id, updateFamilyMemberDto);
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.familyMemberRepository.delete(id);
  }
}

export const familyMemberService = new FamilyMemberService();